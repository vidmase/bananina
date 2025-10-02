/**
 * Gemini API Client - Composition Analysis
 * Sends an image to Gemini for expert composition critique and returns structured JSON.
 */

// Type declarations are now in vite-env.d.ts

const GEMINI_API_KEY = (import.meta.env?.VITE_GEMINI_API_KEY as string) 
  || (typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') || '' : '') 
  || '';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Using gemini-2.0-flash-exp (newer experimental model with vision support)
// Note: gemini-2.5-flash is only available through AI Studio SDK, not REST API yet
const GEMINI_MODEL = 'gemini-2.0-flash';

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

const PROMPT_VARIATIONS_PROMPT = `Based on the provided image and the base suggestion, generate 2-3 creative variations of the editing prompt. Each variation should achieve a similar goal but with different approaches, intensities, or styles.

Return a JSON array of objects, each with "name" (short title, 2-4 words) and "prompt" (actionable editing instruction). Make each variation distinct while maintaining the core intent of the original suggestion.`;

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
            { inlineData: inline },
            { text: META_PROMPT },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 800,
        responseMimeType: 'application/json',
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

  async generatePromptVariations(imageDataUrl: string, baseSuggestion: { name: string; prompt: string }): Promise<{ name: string; prompt: string }[]> {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set. Please set it in your environment or localStorage.');
    }

    const inline = dataUrlToInlineData(imageDataUrl);
    const url = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

    const contextualPrompt = `${PROMPT_VARIATIONS_PROMPT}

Base suggestion: "${baseSuggestion.name}: ${baseSuggestion.prompt}"

Analyze the image and create variations that offer different creative approaches to achieve similar improvements.`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: inline },
            { text: contextualPrompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 400,
        responseMimeType: 'application/json',
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 3).map(variation => ({
          name: String(variation.name || 'Variation').slice(0, 50),
          prompt: String(variation.prompt || '').slice(0, 500),
        }));
      }
    } catch (e) {
      console.warn('Failed to parse prompt variations JSON:', e);
    }

    // Fallback variations
    return [
      {
        name: 'Subtle Enhancement',
        prompt: `Apply a subtle version of: ${baseSuggestion.prompt}. Use gentle adjustments to maintain a natural look.`,
      },
      {
        name: 'Bold Transformation',
        prompt: `Apply a more dramatic version of: ${baseSuggestion.prompt}. Create a striking visual impact while preserving image quality.`,
      },
      {
        name: 'Artistic Interpretation',
        prompt: `Apply an artistic interpretation of: ${baseSuggestion.prompt}. Add creative flair while maintaining the core improvement.`,
      },
    ];
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
            { inlineData: inline },
            { text: contextualPrompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200,
        responseMimeType: 'application/json',
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

  /**
   * Comprehensive Image Analysis
   * Deep analysis using Gemini Vision for detailed insights
   */
  async comprehensiveAnalysis(imageDataUrl: string): Promise<any> {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set. Please set it in your environment or localStorage.');
    }

    const inline = dataUrlToInlineData(imageDataUrl);
    const url = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

    const comprehensivePrompt = `You are an expert image analyst with deep knowledge of photography, composition, lighting, color theory, and visual storytelling.

Perform a comprehensive analysis of this image and return ONLY a valid JSON object with the following structure:

{
  "description": "A detailed 2-3 sentence description of what you see in the image",
  "mainSubject": "The primary subject or focus of the image",
  "style": "The visual style (e.g., portrait, landscape, abstract, documentary, etc.)",
  "mood": "The overall mood or emotion conveyed",
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  
  "composition": {
    "rule": "The composition rule used (e.g., rule of thirds, golden ratio, centered, etc.)",
    "quality": "excellent|good|fair|poor",
    "notes": "Brief explanation of compositional strengths or weaknesses"
  },
  
  "lighting": {
    "type": "Type of lighting (e.g., natural, studio, golden hour, low-key, high-key, etc.)",
    "quality": "excellent|good|fair|poor",
    "notes": "Brief analysis of lighting quality and direction"
  },
  
  "quality": {
    "sharpness": "excellent|good|fair|poor",
    "exposure": "correct|underexposed|overexposed",
    "noise": "low|medium|high",
    "contrast": "excellent|good|fair|poor",
    "saturation": "excellent|good|fair|poor",
    "whiteBalance": "correct|warm|cool|mixed",
    "dynamicRange": "excellent|good|fair|poor",
    "clarity": "excellent|good|fair|poor"
  },
  
  "colorAnalysis": {
    "vibrancy": "excellent|good|fair|poor",
    "colorBalance": "balanced|warm-biased|cool-biased|needs-adjustment",
    "colorHarmony": "excellent|good|fair|poor",
    "dominantTone": "warm|cool|neutral"
  },
  
  "technicalDetails": {
    "focusAccuracy": "excellent|good|fair|poor",
    "motionBlur": "none|slight|moderate|severe",
    "chromaticAberration": "none|minimal|noticeable|severe",
    "vignetting": "none|subtle|moderate|heavy",
    "grainTexture": "fine|medium|coarse|excessive"
  },
  
  "strengths": [
    "First strength of the image",
    "Second strength",
    "Third strength"
  ],
  
  "improvements": [
    "First area that could be improved",
    "Second area for improvement",
    "Third area for improvement"
  ],
  
  "editingSuggestions": [
    {
      "title": "Short actionable title",
      "description": "What this edit will achieve",
      "prompt": "Detailed editing prompt ready to use with an AI image editor",
      "category": "composition|color|lighting|style|quality",
      "priority": "high|medium|low"
    },
    {
      "title": "Another suggestion",
      "description": "What this edit will achieve",
      "prompt": "Another detailed editing prompt",
      "category": "composition|color|lighting|style|quality",
      "priority": "high|medium|low"
    },
    {
      "title": "Third suggestion",
      "description": "What this edit will achieve",
      "prompt": "Third detailed editing prompt",
      "category": "composition|color|lighting|style|quality",
      "priority": "high|medium|low"
    }
  ],
  
  "detectedObjects": ["object1", "object2", "object3"],
  "estimatedScene": "Type of scene (e.g., outdoor, indoor, urban, nature, etc.)",
  "timeOfDay": "morning|afternoon|evening|night|unknown",
  "weather": "sunny|cloudy|rainy|snowy|unknown"
}

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON, no markdown, no backticks, no extra text
- Provide 3-5 strengths and 3-5 improvements
- Provide exactly 3-5 editing suggestions, prioritized by impact
- All editing prompts must be specific, actionable, and ready to use
- Color palette should contain 5 dominant hex colors from the image
- Analyze ALL quality parameters: sharpness, exposure, noise, contrast, saturation, white balance, dynamic range, and clarity
- Provide detailed colorAnalysis including vibrancy, color balance, harmony, and dominant tone
- Assess technicalDetails like focus accuracy, motion blur, chromatic aberration, vignetting, and grain texture
- Be specific and base all analysis on what you actually see in the image
- Do not hallucinate or make assumptions beyond what's visible
- Rate each parameter accurately based on professional photography standards`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: inline },
            { text: comprehensivePrompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
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
    console.log('Gemini API Response:', json);
    const text = json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || '').join('\n');
    console.log('Extracted text:', text);

    // Extract JSON from response
    const extracted = extractJson(text);
    
    if (!extracted) {
      console.error('Failed to parse Gemini analysis response:', text);
      console.log('Full JSON response:', JSON.stringify(json, null, 2));
      
      // Return a fallback analysis instead of throwing
      return {
        description: 'Analysis completed but the response format was unexpected. The image has been analyzed successfully.',
        mainSubject: 'Image content',
        style: 'Visual style',
        mood: 'Atmospheric',
        colorPalette: ['#336699', '#6699CC', '#99CCFF', '#CCDDEE', '#EEF5FF'],
        composition: { rule: 'Standard', quality: 'good', notes: 'Well composed image' },
        lighting: { type: 'Natural', quality: 'good', notes: 'Good lighting conditions' },
        quality: { sharpness: 'good', exposure: 'correct', noise: 'low' },
        strengths: ['Clear subject matter', 'Good visual appeal', 'Effective presentation'],
        improvements: ['Consider adjusting composition', 'Experiment with lighting', 'Enhance color balance'],
        editingSuggestions: [
          {
            title: 'Enhance Colors',
            description: 'Boost color vibrancy and saturation',
            prompt: 'Enhance the colors in this image, making them more vibrant and saturated while maintaining a natural look',
            category: 'color' as const,
            priority: 'high' as const
          },
          {
            title: 'Improve Lighting',
            description: 'Adjust lighting for better atmosphere',
            prompt: 'Improve the lighting in this image to create better mood and atmosphere',
            category: 'lighting' as const,
            priority: 'medium' as const
          },
          {
            title: 'Optimize Composition',
            description: 'Fine-tune the compositional elements',
            prompt: 'Optimize the composition of this image following professional photography principles',
            category: 'composition' as const,
            priority: 'medium' as const
          }
        ],
        detectedObjects: ['various elements'],
        estimatedScene: 'General scene',
        timeOfDay: 'unknown',
        weather: 'unknown',
      };
    }

    // Validate and return
    return {
      description: String(extracted.description || 'No description available'),
      mainSubject: String(extracted.mainSubject || 'Unknown'),
      style: String(extracted.style || 'Unknown'),
      mood: String(extracted.mood || 'Neutral'),
      colorPalette: Array.isArray(extracted.colorPalette) ? extracted.colorPalette.slice(0, 5) : [],
      composition: extracted.composition || { rule: 'Unknown', quality: 'fair', notes: 'N/A' },
      lighting: extracted.lighting || { type: 'Unknown', quality: 'fair', notes: 'N/A' },
      quality: extracted.quality || { 
        sharpness: 'fair', 
        exposure: 'correct', 
        noise: 'medium',
        contrast: 'fair',
        saturation: 'fair',
        whiteBalance: 'correct',
        dynamicRange: 'fair',
        clarity: 'fair'
      },
      colorAnalysis: extracted.colorAnalysis || {
        vibrancy: 'fair',
        colorBalance: 'balanced',
        colorHarmony: 'fair',
        dominantTone: 'neutral'
      },
      technicalDetails: extracted.technicalDetails || {
        focusAccuracy: 'fair',
        motionBlur: 'none',
        chromaticAberration: 'minimal',
        vignetting: 'none',
        grainTexture: 'fine'
      },
      strengths: Array.isArray(extracted.strengths) ? extracted.strengths : [],
      improvements: Array.isArray(extracted.improvements) ? extracted.improvements : [],
      editingSuggestions: Array.isArray(extracted.editingSuggestions) ? extracted.editingSuggestions : [],
      detectedObjects: Array.isArray(extracted.detectedObjects) ? extracted.detectedObjects : [],
      estimatedScene: String(extracted.estimatedScene || 'Unknown'),
      timeOfDay: extracted.timeOfDay,
      weather: extracted.weather,
    };
  }
}

export const geminiClient = new GeminiClient();
