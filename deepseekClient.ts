/**
 * DeepSeek API Client
 * Handles AI assistant suggestions using DeepSeek's chat completion API
 */

const DEEPSEEK_API_BASE = 'https://api.deepseek.com/v1';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY as string;

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface Suggestion {
  name: string;
  prompt: string;
}

class DeepSeekClient {
  /**
   * Generate suggestions with image analysis for People & Portraits categories
   */
  async generateSuggestionsWithImageAnalysis(
    systemInstruction: string,
    imageDataUrl: string,
    featureName: string
  ): Promise<Suggestion[]> {
    try {
      // First, analyze the image to get context
      const imageAnalysis = await this.analyzeImage(imageDataUrl, featureName);
      
      // Then generate suggestions based on the analysis
      return await this.generateSuggestions(systemInstruction, imageAnalysis);
    } catch (error) {
      console.error('Image analysis failed, falling back to generic suggestions:', error);
      // Fallback to generic suggestions if image analysis fails
      return await this.generateSuggestions(systemInstruction, "the uploaded image");
    }
  }

  /**
   * Analyze image using a vision-capable model (simulated with detailed prompting)
   */
  private async analyzeImage(imageDataUrl: string, featureName: string): Promise<string> {
    // For now, we'll create a detailed analysis prompt based on the feature type
    // This simulates image analysis by providing context-specific descriptions
    
    const analysisPrompts: { [key: string]: string } = {
      'Fashion Stylist': 'a person wearing clothing that could benefit from fashion styling advice. Consider their current outfit, body type, setting, and overall style aesthetic',
      'Portrait Studio': 'a portrait photo that could be enhanced with professional studio techniques including lighting, posing, and composition',
      'Expression Coach': 'a person whose facial expression and body language could be coached for better engagement and natural appearance',
      'Glamour Shots': 'a person who could benefit from glamour photography techniques including dramatic lighting, elegant posing, and sophisticated styling',
      'Beauty Retouching': 'a portrait that could be enhanced with professional beauty retouching while maintaining natural appearance',
      'Eyewear Styling': 'a person wearing or who could benefit from eyewear styling advice including frame selection and reflection management',
      'Hair Styling': 'a person whose hairstyle could be enhanced or restyled for better overall appearance and photo composition',
      'Skin Perfection': 'a portrait where skin tone and texture could be professionally enhanced while preserving natural characteristics',
      'Age Enhancement': 'a person whose appearance could be enhanced to emphasize their best features at their current life stage',
      'Body Contouring': 'a person whose pose and body positioning could be optimized for the most flattering photographic result',
      'Pose Director': 'a person whose pose and body language could be directed for more dynamic and engaging photography'
    };

    return analysisPrompts[featureName] || 'an uploaded image that needs enhancement';
  }

  async generateSuggestions(
    systemInstruction: string,
    imageDescription: string = "an uploaded image"
  ): Promise<Suggestion[]> {
    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: `${systemInstruction}

Return your response as a JSON array with exactly 3 suggestions. Each suggestion should have:
- "name": A short, catchy title (max 20 characters)
- "prompt": A detailed, actionable prompt for image editing

Format: [{"name": "Title", "prompt": "Detailed prompt..."}, ...]`
      },
      {
        role: 'user',
        content: `Analyze ${imageDescription} and provide 3 creative suggestions based on your expertise.`
      }
    ];

    try {
      const response = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const result: DeepSeekResponse = await response.json();
      const content = result.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from DeepSeek API');
      }

      // Try to parse JSON response
      try {
        const suggestions = JSON.parse(content);
        if (Array.isArray(suggestions) && suggestions.length > 0) {
          return suggestions.slice(0, 3); // Ensure max 3 suggestions
        }
      } catch (parseError) {
        console.warn('Failed to parse JSON, using fallback parsing');
      }

      // Fallback: extract suggestions from text response
      return this.parseTextResponse(content);

    } catch (error) {
      console.error('DeepSeek API error:', error);
      throw error;
    }
  }

  private parseTextResponse(content: string): Suggestion[] {
    // Fallback parsing for non-JSON responses
    const suggestions: Suggestion[] = [];
    const lines = content.split('\n');
    
    let currentSuggestion: Partial<Suggestion> = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Look for name patterns
      if (trimmed.match(/^\d+\.|^-|^\*/) && trimmed.length < 50) {
        if (currentSuggestion.name && currentSuggestion.prompt) {
          suggestions.push(currentSuggestion as Suggestion);
        }
        currentSuggestion = { name: trimmed.replace(/^\d+\.|^-|^\*/, '').trim() };
      }
      // Look for prompt patterns
      else if (trimmed.length > 20 && !currentSuggestion.prompt) {
        currentSuggestion.prompt = trimmed;
      }
    }
    
    // Add the last suggestion
    if (currentSuggestion.name && currentSuggestion.prompt) {
      suggestions.push(currentSuggestion as Suggestion);
    }
    
    // If parsing failed, return generic suggestions
    if (suggestions.length === 0) {
      return [
        { name: 'Enhance', prompt: 'Enhance and improve the overall quality of the image' },
        { name: 'Stylize', prompt: 'Apply artistic styling and creative effects' },
        { name: 'Optimize', prompt: 'Optimize colors, lighting, and composition' }
      ];
    }
    
    return suggestions.slice(0, 3);
  }

  async enhancePrompt(originalPrompt: string): Promise<string> {
    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: 'You are an AI assistant for a photo editor. Take the user\'s prompt and make it more descriptive and effective for image generation. Add details about style, lighting, composition, and mood. Respond only with the enhanced prompt text, nothing else.'
      },
      {
        role: 'user',
        content: originalPrompt
      }
    ];

    try {
      const response = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature: 0.7,
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const result: DeepSeekResponse = await response.json();
      return result.choices[0]?.message?.content?.trim() || originalPrompt;

    } catch (error) {
      console.error('DeepSeek prompt enhancement error:', error);
      return originalPrompt;
    }
  }
}

export const deepseekClient = new DeepSeekClient();
