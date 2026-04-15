
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { question } = req.body || {};

  if (!question) {
    return res.status(400).json({ answer: "No question received" });
  }

  const prompt = `### Question:\n${question}\n\n### Answer:\n`;

  const hfRes = await fetch(
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
          max_new_tokens: 200,
          return_full_text: false
        }
      })
    }
  );

  const result = await hfRes.json();

  if (result.error) {
    return res.status(200).json({
      answer: "Model warming up, wait 30 seconds and try again.\n\n" + result.error
    });
  }

  const answer = result[0]?.generated_text?.trim() || "No answer";
  return res.status(200).json({ answer });
}
