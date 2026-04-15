export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { question } = req.body;
    const prompt = `### Question:\n${question}\n\n### Answer:\n`;

    try {
        const hfResponse = await fetch(
            "https://api-inference.huggingface.co/models/Liffix/coding-ai-model",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.HF_TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: 200,
                        temperature: 0.7,
                        return_full_text: false
                    }
                })
            }
        );

        const text = await hfResponse.text();
        console.log("HF Response:", text);

        const data = JSON.parse(text);

        if (data.error) {
            return res.status(500).json({
                answer: "Model is loading, please wait 20 seconds and try again. Error: " + data.error
            });
        }

        const answer = data[0]?.generated_text || "No answer generated";
        return res.status(200).json({ answer });

    } catch (error) {
        console.log("Error:", error.message);
        return res.status(500).json({
            answer: "Error: " + error.message
        });
    }
}
