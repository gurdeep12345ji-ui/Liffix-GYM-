export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: "No question provided" });
    }

    try {
        const prompt = `### Question:\n${question}\n\n### Answer:\n`;

        const response = await fetch(
            "https://api-inference.huggingface.co/models/Liffix/coding-ai-model",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.HF_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: 150,
                        temperature: 0.7,
                        return_full_text: false
                    }
                })
            }
        );

        const data = await response.json();
        const answer = data[0]?.generated_text || "No answer generated";

        return res.status(200).json({ answer });

    } catch (error) {
        return res.status(500).json({ error: "AI error" });
    }
}