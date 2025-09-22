/**
 * Gemini API Client - Composition Analysis
 * Sends an image to Gemini for expert composition critique and returns structured JSON.
 */

// Type declarations are now in vite-env.d.ts

const GEMINI_API_KEY = (import.meta.env?.VITE_GEMINI_API_KEY as string) 
  || (typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') || '' : '') 
  || '';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = 'gemini-1.5-flash-latest';

export type CompositionSuggestion = {
  title: string;
  advice: string;
  relatedPrompt: string;
};

export type CompositionAnalysis = {
  summary: string;
  suggestions: CompositionSuggestion[]; // exactly 3
  tags?: string[];
  confidence?: number; // 0..1
};

function dataUrlToInlineData(dataUrl: string): { mimeType: string; data: string } {
  const [meta, base64] = dataUrl.split(',');
  const match = /data:(.*?);base64/.exec(meta || '');
  const mimeType = match?.[1] || 'image/png';
  return { mimeType, data: (base64 || '') };
}

function extractJson(text: string): any {
  if (!text) return null;
  // Prefer fenced code block
  const fenced = /```json\s*([\s\S]*?)```/i.exec(text);
  const jsonText = fenced ? fenced[1] : text;

  // Try direct parse
  try {
    return JSON.parse(jsonText);
  } catch {}

  // Try to find first {...} JSON object
  const objMatch = /\{[\s\S]*\}/.exec(jsonText);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch {}
  }

  return null;
}

const PORTRAIT_CONSTRAINT = "Do not change any facial features, expression, face shape, skin tone, eyes, nose, mouth, birthmarks, scars, or hairstyle. Keep all aspects of the face exactly as in the original image.";

const META_PROMPT = `You are an expert photography and visual composition critic.
Analyze the provided image for its composition, lighting, and color. Provide exactly three brief, actionable suggestions suitable to be used in subsequent editing prompts. Keep your tone constructive and educational.

Return ONLY a valid JSON object with the following shape:
{
  "summary": "One-paragraph critique that praises what's working and identifies improvement areas",
  "suggestions": [
    {
      "title": "Short title (max 40 chars)",
      "advice": "One-sentence suggestion explaining the principle",
      "relatedPrompt": "A concrete follow-up edit prompt that the user can run next"
    },
    { ... },
    { ... }
  ],
  "tags": ["composition", "lighting", "color"],
  "confidence": 0.0
}

Important requirements:
- Keep suggestions concise and actionable.
- The "relatedPrompt" must be directly usable in an image editing workflow.
- If there are visible people or portraits in the image, append this exact constraint to every relatedPrompt: "${PORTRAIT_CONSTRAINT}".
- Do NOT include any markdown, commentary, or backticks in the output, only pure JSON.
- Do NOT hallucinate content that cannot be deduced from the image context.
`;

const SMART_SUGGESTION_PROMPT = `Based on the provided image, generate a creative suggestion to improve it, focusing on the specified category. Analyze what you see in the image and provide context-aware recommendations.

Return a single JSON object with two keys: "name" (a short, catchy title, 2-4 words) and "prompt" (a concise, actionable prompt for an AI image editor). Do not add any extra text, quotes, or markdown formatting. Ensure each suggestion is unique and specifically tailored to what you observe in the image.`;

class GeminiClient {
  async analyzeComposition(imageDataUrl: string): Promise<CompositionAnalysis> {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set. Please set it in your environment or localStorage.');
    }

    const inline = dataUrlToInlineData(imageDataUrl);

    const url = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: META_PROMPT },
            { inlineData: inline },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 800,
      },
    } as any;

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Gemini API error: ${resp.status} ${txt}`);
    }

    const json = await resp.json();
    const text = json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || '').join('\n');

    const parsed = extractJson(text || '');
    if (!parsed || !parsed.suggestions || !Array.isArray(parsed.suggestions)) {
      // Fallback shape
      const fallback: CompositionAnalysis = {
        summary: 'The image shows strengths in certain areas, but could benefit from improvements in composition, lighting, and color balance.',
        suggestions: [
          { title: 'Adjust Framing', advice: 'Reframe using the rule of thirds for a more dynamic composition.', relatedPrompt: 'Reframe the image to follow the rule of thirds, maintaining subject hierarchy and natural perspective.' },
          { title: 'Enhance Warmth', advice: 'Add subtle golden hour warmth to improve mood and cohesion.', relatedPrompt: 'Add subtle golden hour warmth to the lighting while preserving overall realism and natural skin tones.' },
          { title: 'Balance Contrast', advice: 'Improve local contrast while preserving highlight and shadow details.', relatedPrompt: 'Increase local contrast and clarity while preserving highlight and shadow detail to maintain a natural look.' },
        ],
        tags: ['composition', 'lighting', 'color'],
        confidence: 0.5,
      };
      return fallback;
    }

    // Validate and coerce
    const result: CompositionAnalysis = {
      summary: String(parsed.summary || '').slice(0, 600),
      suggestions: (parsed.suggestions as any[]).slice(0, 3).map((s) => ({
        title: String(s.title || 'Suggestion'),
        advice: String(s.advice || ''),
        relatedPrompt: String(s.relatedPrompt || ''),
      })),
      tags: Array.isArray(parsed.tags) ? parsed.tags.map((t: any) => String(t)) : ['composition', 'lighting', 'color'],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.75,
    };

    return result;
  }

  async generateSmartSuggestion(imageDataUrl: string, category: string, description: string): Promise<{ name: string; prompt: string }> {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set. Please set it in your environment or localStorage.');
    }

    const inline = dataUrlToInlineData(imageDataUrl);
    const url = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

    const contextualPrompt = `${SMART_SUGGESTION_PROMPT}

Category: "${category}: ${description}"

Analyze the image content and generate a suggestion that is specifically relevant to what you see. Consider the subject matter, composition, lighting, colors, and style when crafting your recommendation.`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: contextualPrompt },
            { inlineData: inline },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200,
      },
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Gemini API error: ${resp.status} ${txt}`);
    }

    const json = await resp.json();
    const text = json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || '').join('\n');

    try {
      const parsed = JSON.parse(text.trim());
      if (parsed && parsed.name && parsed.prompt) {
        return {
          name: String(parsed.name).slice(0, 50),
          prompt: String(parsed.prompt).slice(0, 500),
        };
      }
    } catch (e) {
      console.warn('Failed to parse smart suggestion JSON:', e);
    }

    // Fallback suggestion
    return {
      name: 'Enhance Image',
      prompt: `Improve the image focusing on ${category.toLowerCase()}. Analyze the current composition and apply appropriate enhancements while maintaining the original style and subject matter.`,
    };
  }
}

export const geminiClient = new GeminiClient();
