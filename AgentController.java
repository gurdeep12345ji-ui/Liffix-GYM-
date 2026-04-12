package com.nexusai.agent.controller;

import com.nexusai.agent.model.*;
import com.nexusai.agent.service.*;
import com.nexusai.agent.security.JwtService;
import com.nexusai.agent.dto.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import javax.validation.Valid;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * NexusAI Agent Controller
 * Handles all REST endpoints for AI agent management,
 * approval workflows, and earnings tracking.
 */
@RestController
@RequestMapping("/api/v1/agents")
@CrossOrigin(origins = {"http://localhost:3000", "https://nexusai.app"})
public class AgentController {

    private static final Logger log = LoggerFactory.getLogger(AgentController.class);

    @Autowired private AgentService agentService;
    @Autowired private ApprovalService approvalService;
    @Autowired private EarningsService earningsService;
    @Autowired private JwtService jwtService;
    @Autowired private NotificationService notificationService;

    // ==================== AGENT CRUD ====================

    @PostMapping("/create")
    public ResponseEntity<AgentResponse> createAgent(
            @Valid @RequestBody CreateAgentRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        try {
            Agent agent = agentService.createAgent(
                user.getId(),
                request.getName(),
                request.getSpecializations(),
                request.getConfig()
            );
            log.info("Agent created: {} for user: {}", agent.getId(), user.getId());
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(AgentResponse.from(agent));
        } catch (Exception e) {
            log.error("Failed to create agent: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{agentId}")
    public ResponseEntity<AgentResponse> getAgent(
            @PathVariable String agentId,
            @AuthenticationPrincipal UserPrincipal user) {
        return agentService.findByIdAndOwner(agentId, user.getId())
            .map(agent -> ResponseEntity.ok(AgentResponse.from(agent)))
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/my")
    public ResponseEntity<List<AgentResponse>> getMyAgents(
            @AuthenticationPrincipal UserPrincipal user) {
        List<Agent> agents = agentService.findByOwner(user.getId());
        return ResponseEntity.ok(agents.stream()
            .map(AgentResponse::from)
            .toList());
    }

    @PatchMapping("/{agentId}/status")
    public ResponseEntity<AgentResponse> updateAgentStatus(
            @PathVariable String agentId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal user) {
        String status = body.get("status");
        Agent agent = agentService.updateStatus(agentId, user.getId(), status);
        return ResponseEntity.ok(AgentResponse.from(agent));
    }

    @DeleteMapping("/{agentId}")
    public ResponseEntity<Void> deleteAgent(
            @PathVariable String agentId,
            @AuthenticationPrincipal UserPrincipal user) {
        agentService.deleteAgent(agentId, user.getId());
        return ResponseEntity.noContent().build();
    }

    // ==================== APPROVAL WORKFLOW ====================

    @GetMapping("/{agentId}/pending")
    public ResponseEntity<List<TaskResponse>> getPendingTasks(
            @PathVariable String agentId,
            @AuthenticationPrincipal UserPrincipal user) {
        List<Task> tasks = approvalService.getPendingTasks(agentId, user.getId());
        return ResponseEntity.ok(tasks.stream().map(TaskResponse::from).toList());
    }

    @PostMapping("/{agentId}/tasks/{taskId}/approve")
    public ResponseEntity<ApprovalResponse> approveTask(
            @PathVariable String agentId,
            @PathVariable String taskId,
            @RequestBody(required = false) Map<String, Object> options,
            @AuthenticationPrincipal UserPrincipal user) {
        try {
            ApprovalResult result = approvalService.approve(
                agentId, taskId, user.getId(), options
            );
            notificationService.notifyApproval(user.getId(), taskId, true);
            log.info("Task {} approved by user {}", taskId, user.getId());
            return ResponseEntity.ok(ApprovalResponse.from(result));
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (TaskNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{agentId}/tasks/{taskId}/reject")
    public ResponseEntity<ApprovalResponse> rejectTask(
            @PathVariable String agentId,
            @PathVariable String taskId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal user) {
        String reason = body.getOrDefault("reason", "No reason provided");
        ApprovalResult result = approvalService.reject(agentId, taskId, user.getId(), reason);
        notificationService.notifyApproval(user.getId(), taskId, false);
        log.info("Task {} rejected by user {}: {}", taskId, user.getId(), reason);
        return ResponseEntity.ok(ApprovalResponse.from(result));
    }

    // ==================== EARNINGS ====================

    @GetMapping("/{agentId}/earnings")
    public ResponseEntity<EarningsResponse> getEarnings(
            @PathVariable String agentId,
            @RequestParam(defaultValue = "30") int days,
            @AuthenticationPrincipal UserPrincipal user) {
        EarningsSummary summary = earningsService.getSummary(agentId, user.getId(), days);
        return ResponseEntity.ok(EarningsResponse.from(summary));
    }

    @GetMapping("/{agentId}/earnings/history")
    public ResponseEntity<List<EarningRecord>> getEarningsHistory(
            @PathVariable String agentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(
            earningsService.getHistory(agentId, user.getId(), page, size)
        );
    }

    @PostMapping("/{agentId}/withdraw")
    public ResponseEntity<WithdrawalResponse> requestWithdrawal(
            @PathVariable String agentId,
            @Valid @RequestBody WithdrawalRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        // High-value withdrawals always require extra human confirmation
        if (request.getAmount() > 500) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                .body(WithdrawalResponse.requiresVerification(
                    "Withdrawals over $500 require 2FA confirmation"
                ));
        }
        WithdrawalResult result = earningsService.withdraw(agentId, user.getId(), request);
        return ResponseEntity.ok(WithdrawalResponse.from(result));
    }

    // ==================== SERVER-SENT EVENTS (Real-time) ====================

    @GetMapping("/{agentId}/stream")
    public SseEmitter streamAgentEvents(
            @PathVariable String agentId,
            @AuthenticationPrincipal UserPrincipal user) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);

        CompletableFuture.runAsync(() -> {
            try {
                agentService.subscribeToEvents(agentId, user.getId(), event -> {
                    try {
                        emitter.send(SseEmitter.event()
                            .name(event.getType())
                            .data(event.getData())
                            .id(event.getId()));
                    } catch (IOException e) {
                        emitter.completeWithError(e);
                    }
                });
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });

        emitter.onTimeout(emitter::complete);
        emitter.onError(e -> log.warn("SSE error for agent {}: {}", agentId, e.getMessage()));
        return emitter;
    }

    // ==================== ANALYTICS ====================

    @GetMapping("/{agentId}/analytics")
    public ResponseEntity<AnalyticsResponse> getAnalytics(
            @PathVariable String agentId,
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(
            agentService.getAnalytics(agentId, user.getId())
        );
    }
}
