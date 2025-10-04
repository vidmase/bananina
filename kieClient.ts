/**
 * Kie.ai Nano Banana API Client
 * Handles image generation and editing using kie.ai's REST API
 */

const KIE_API_BASE = 'https://api.kie.ai';
const KIE_API_KEY = import.meta.env.VITE_KIE_API_KEY;

// Debug logger utility
class DebugLogger {
  static log(category: string, message: string, data?: any) {
    console.log(`[KIE-${category}]`, message, data ? JSON.stringify(data, null, 2) : '');
  }
  
  static error(category: string, message: string, error?: any) {
    console.error(`[KIE-${category}] ERROR:`, message);
    if (error) {
      console.error('Error details:', error);
      if (error.stack) console.error('Stack trace:', error.stack);
    }
  }
  
  static warn(category: string, message: string, data?: any) {
    console.warn(`[KIE-${category}] WARNING:`, message, data || '');
  }
}

export interface KieGenerateRequest {
  model: string;
  callbackUrl?: string;
  input: {
    prompt: string;
    image_urls?: string[];
    output_format: string;
    image_size: string;
  };
}

export interface KieTaskResponse {
  code: number;
  message: string;
  data: {
    taskId: string;
  };
}

export interface KieTaskStatus {
  code: number;
  data: {
    taskId: string;
    state: string; // 'success', 'fail', 'processing'
    completeTime?: number;
    failMsg?: string;
    resultJson?: string;
  };
}

class KieClient {
  private async createTask(input: KieGenerateRequest): Promise<string> {
    DebugLogger.log('CREATE_TASK', 'Starting task creation', input);
    
    try {
      const response = await fetch(`${KIE_API_BASE}/api/v1/jobs/createTask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KIE_API_KEY}`,
        },
        body: JSON.stringify(input),
      });

      DebugLogger.log('CREATE_TASK', `Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        DebugLogger.error('CREATE_TASK', `HTTP ${response.status} error`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result: KieTaskResponse = await response.json();
      DebugLogger.log('CREATE_TASK', 'API response received', result);
      
      if (result.code !== 200) {
        DebugLogger.error('CREATE_TASK', `API returned error code ${result.code}`, result);
        
        // Provide specific error messages based on Kie.ai error codes
        let errorMessage = result.message || 'Unknown error';
        switch (result.code) {
          case 401:
            errorMessage = 'Authentication failed. Please check your API key.';
            break;
          case 402:
            errorMessage = 'Insufficient credits. Please add more credits to your Kie.ai account.';
            break;
          case 404:
            errorMessage = 'API endpoint not found. The model may not be available.';
            break;
          case 422:
            errorMessage = 'Invalid request parameters. Please check your image format and prompt.';
            break;
          case 429:
            errorMessage = 'Rate limit exceeded. Please wait before making another request.';
            break;
          case 455:
            errorMessage = 'Service temporarily unavailable. Please try again later.';
            break;
          case 500:
            errorMessage = 'Internal server error. Please try again or contact support.';
            break;
          case 505:
            errorMessage = 'The nano-banana-edit model is currently disabled or unavailable.';
            break;
          default:
            errorMessage = `API error (${result.code}): ${result.message || 'Unknown error'}`;
        }
        
        throw new Error(errorMessage);
      }

      if (!result.data?.taskId) {
        DebugLogger.error('CREATE_TASK', 'No taskId in response', result);
        throw new Error('No taskId returned from API');
      }

      DebugLogger.log('CREATE_TASK', `Task created successfully: ${result.data.taskId}`);
      return result.data.taskId;
    } catch (error) {
      DebugLogger.error('CREATE_TASK', 'Task creation failed', error);
      throw error;
    }
  }

  private async pollTaskStatus(taskId: string): Promise<KieTaskStatus> {
    DebugLogger.log('POLL_STATUS', `Polling status for task: ${taskId}`);
    
    try {
      const response = await fetch(`${KIE_API_BASE}/api/v1/jobs/recordInfo?taskId=${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`,
        },
      });

      DebugLogger.log('POLL_STATUS', `Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        DebugLogger.error('POLL_STATUS', `HTTP ${response.status} error`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          taskId: taskId
        });
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result: KieTaskStatus = await response.json();
      DebugLogger.log('POLL_STATUS', `Task ${taskId} status: ${result.data?.state}`, result);
      
      if (result.code !== 200) {
        DebugLogger.error('POLL_STATUS', `API returned error code ${result.code}`, result);
        throw new Error(`API error: Failed to query task status - ${result.code}`);
      }

      return result;
    } catch (error) {
      DebugLogger.error('POLL_STATUS', `Failed to poll task ${taskId}`, error);
      throw error;
    }
  }

  private async uploadImageToPublicUrl(dataUrl: string): Promise<string> {
    DebugLogger.log('UPLOAD', 'Converting image for Kie.ai API');
    
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const mimeType = blob.type || 'image/png';
      
      DebugLogger.log('UPLOAD', `Image details: ${blob.size} bytes, type: ${mimeType}`);
      
      // Convert blob to base64 for direct API submission
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Extract just the base64 part without the data URL prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      DebugLogger.log('UPLOAD', 'Converted image to base64 format');
      
      // Use a simple file hosting service that works with CORS
      try {
        const formData = new FormData();
        formData.append('file', blob, 'image.png');
        
        // Try tmpfiles.org - a simple, CORS-friendly service
        const uploadResponse = await fetch('https://tmpfiles.org/api/v1/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const result = await uploadResponse.json();
          if (result.status === 'success' && result.data?.url) {
            // Convert tmpfiles.org URL to direct access URL
            const directUrl = result.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
            DebugLogger.log('UPLOAD', `Successfully uploaded to tmpfiles.org: ${directUrl}`);
            return directUrl;
          }
        }
      } catch (tmpError) {
        DebugLogger.warn('UPLOAD', 'tmpfiles.org upload failed', tmpError);
      }
      
      // Try file.io as backup
      try {
        const formData = new FormData();
        formData.append('file', blob);
        
        const uploadResponse = await fetch('https://file.io', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const result = await uploadResponse.json();
          if (result.success && result.link) {
            DebugLogger.log('UPLOAD', `Successfully uploaded to file.io: ${result.link}`);
            return result.link;
          }
        }
      } catch (fileIoError) {
        DebugLogger.warn('UPLOAD', 'file.io upload failed', fileIoError);
      }
      
      // As a last resort, try using the Kie.ai API with base64 data
      // Some APIs accept base64 data in the image_urls field despite documentation
      DebugLogger.log('UPLOAD', 'Trying base64 data URL as fallback');
      return dataUrl;
      
    } catch (error) {
      DebugLogger.error('UPLOAD', 'Image processing failed', error);
      // Return the original data URL as absolute fallback
      return dataUrl;
    }
  }

  private async waitForCompletion(taskId: string, maxWaitTime = 60000): Promise<string> {
    DebugLogger.log('WAIT_COMPLETION', `Starting to wait for task ${taskId} completion`);
    const startTime = Date.now();
    const pollInterval = 2000; // Poll every 2 seconds

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.pollTaskStatus(taskId);
      
      if (status.data.state === 'success') {
        DebugLogger.log('WAIT_COMPLETION', `Task ${taskId} completed successfully`);
        
        if (status.data.resultJson) {
          try {
            const result = JSON.parse(status.data.resultJson);
            DebugLogger.log('WAIT_COMPLETION', 'Parsed result JSON', result);
            
            if (result.resultUrls && result.resultUrls.length > 0) {
              DebugLogger.log('WAIT_COMPLETION', `Found result URL: ${result.resultUrls[0]}`);
              return result.resultUrls[0];
            } else {
              DebugLogger.error('WAIT_COMPLETION', 'No resultUrls in parsed result', result);
            }
          } catch (parseError) {
            DebugLogger.error('WAIT_COMPLETION', 'Failed to parse resultJson', {
              resultJson: status.data.resultJson,
              error: parseError
            });
          }
        } else {
          DebugLogger.error('WAIT_COMPLETION', 'Task completed but no resultJson', status.data);
        }
        throw new Error('Task completed but no result URL found');
      }
      
      if (status.data.state === 'fail') {
        DebugLogger.error('WAIT_COMPLETION', `Task ${taskId} failed`, {
          failMsg: status.data.failMsg,
          fullStatus: status.data
        });
        throw new Error(`Task failed: ${status.data.failMsg || 'Unknown error'}`);
      }
      
      // Still processing, wait before next poll
      const elapsed = Date.now() - startTime;
      DebugLogger.log('WAIT_COMPLETION', `Task ${taskId} still processing (${elapsed}ms elapsed), waiting ${pollInterval}ms...`);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    DebugLogger.error('WAIT_COMPLETION', `Task ${taskId} timed out after ${maxWaitTime}ms`);
    throw new Error('Task timed out');
  }

  async generateImage(prompt: string, baseImage?: string, referenceImage?: string, options?: { image_size?: string }): Promise<string> {
    // Always use the editing model when baseImage is provided for image editing
    const model = 'google/nano-banana-edit';
    
    const requestData: KieGenerateRequest = {
      model: model,
      input: {
        prompt: baseImage ? `Edit this image: ${prompt}. Keep the original composition and only apply the requested changes.` : prompt,
        output_format: 'png',
        image_size: options?.image_size || 'auto',
      },
    };

    // For image editing, we need to provide the base image and optionally reference image
    if (baseImage) {
      try {
        // If reference image is provided, place REFERENCE FIRST, BASE SECOND
        if (referenceImage) {
          DebugLogger.log('GENERATE_IMAGE', 'Processing reference and base images');

          const refImageUrl = await this.uploadImageToPublicUrl(referenceImage);
          const baseImageUrl = await this.uploadImageToPublicUrl(baseImage);

          // Order matters for some providers; use [reference, base]
          requestData.input.image_urls = [refImageUrl, baseImageUrl];
          DebugLogger.log('GENERATE_IMAGE', 'Image URLs order set to [reference, base]', requestData.input.image_urls);

          // Strong instruction: edit BASE (second) using REFERENCE (first). Preserve face; never output reference as final image.
          requestData.input.prompt = `Edit the second image using the first image as a reference: ${prompt}. Apply the exact style, colors, patterns, textures, and design details from the reference image to the person in the base photo. Ensure realistic fit and lighting. The output MUST be the edited base image with the clothing transferred; DO NOT output or replace the scene with the reference image. Do not change any facial features, expression, face shape, skin tone, eyes, nose, mouth, birthmarks, scars, or hairstyle. Keep all aspects of the face exactly as in the original image.`;
        } else {
          DebugLogger.log('GENERATE_IMAGE', 'Processing base image only for editing');

          // No reference image; just edit the base
          const baseImageUrl = await this.uploadImageToPublicUrl(baseImage);
          requestData.input.image_urls = [baseImageUrl];
          DebugLogger.log('GENERATE_IMAGE', `Using public base image URL: ${baseImageUrl}`);
          requestData.input.prompt = `Edit this image: ${prompt}. Keep the original composition and only apply the requested changes.`;
        }
      } catch (processError) {
        DebugLogger.error('GENERATE_IMAGE', 'Failed to process images', processError);
        throw new Error('Failed to process images for editing. Please try again.');
      }
    } else {
      throw new Error('Base image is required for image editing');
    }

    try {
      const taskId = await this.createTask(requestData);
      console.log('Task created with ID:', taskId);
      
      const imageUrl = await this.waitForCompletion(taskId);
      console.log('Task completed, result URL:', imageUrl);
      
      // Convert URL to base64 data URL for compatibility with existing code
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch result image: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to convert image to data URL'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Generate image error:', error);
      throw error;
    }
  }
}

export const kieClient = new KieClient();
