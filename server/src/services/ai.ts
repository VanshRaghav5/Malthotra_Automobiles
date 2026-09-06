import { config } from '../config';

export async function generateGeminiResponse(message: string, context: { businessContext?: string; customerContext?: Record<string, any> } = {}): Promise<string> {
  if (!config.GEMINI_API_KEY) {
    return "I'm sorry, the AI assistant is not configured. Please contact support.";
  }

  const systemPrompt = `You are an AI assistant for Malhotra Automobiles, a professional automobile parts and service business.

Business context:
${context.businessContext || 'Contact us for product and service information.'}

Guidelines:
- Be helpful and professional
- Never invent product availability, pricing, or booking slots
- For factual business data (prices, availability), defer to the website/backend
- Suggest contacting the business for specific inquiries
- Keep responses concise

Customer context:
${context.customerContext ? JSON.stringify(context.customerContext) : 'None'}
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: message }] }],
          generationConfig: { maxOutputTokens: 500 },
          systemInstruction: { parts: [{ text: systemPrompt }] },
        }),
      }
    );

    const data = await response.json();
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    return "I'm sorry, I couldn't process that request. Please contact us directly.";
  } catch (error) {
    console.error('Gemini API error:', error);
    return "I'm sorry, the AI assistant is temporarily unavailable. Please contact us directly.";
  }
}
