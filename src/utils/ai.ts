import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

export async function estimateCategoryInflation(categoryName: string): Promise<number | null> {
  const token = (import.meta as any).env.VITE_GITHUB_TOKEN;

  if (!token) {
    console.error("VITE_GITHUB_TOKEN is not set in environment variables.");
    return null;
  }

  const endpoint = "https://models.github.ai/inference";
  const model = "meta/Llama-4-Maverick-17B-128E-Instruct-FP8";

  try {
    const client = ModelClient(
      endpoint,
      new AzureKeyCredential(token),
    );

    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: "system", content: "You are an expert financial and economic assistant. Your only job is to estimate the average historical annual inflation rate (as a percentage) for a given US expense category. Return ONLY the number as a decimal percentage (e.g., '3.5', '5.0', '1.2'). Do not include the '%' sign. Do not include any text, explanations, or ranges. Just the single best estimate number." },
          { role: "user", content: `What is the average historical annual inflation rate for the US expense category: "${categoryName}"?` }
        ],
        temperature: 0.1, // low temp for more deterministic numerical answers
        top_p: 1.0,
        max_tokens: 10,
        model: model
      }
    });

    if (isUnexpected(response)) {
      console.error("Unexpected response from AI:", response.body?.error || response.body);
      return null;
    }

    const content = response.body.choices[0].message.content?.trim();
    if (!content) return null;

    // Parse the float, stripping out any non-numeric characters just in case the AI didn't listen perfectly
    const match = content.match(/[\d.]+/);
    if (match) {
        const value = parseFloat(match[0]);
        if (!isNaN(value)) {
            return value;
        }
    }

    console.warn("Could not parse a valid percentage from AI response:", content);
    return null;

  } catch (err) {
    console.error("Error calling GitHub AI inference:", err);
    return null;
  }
}
