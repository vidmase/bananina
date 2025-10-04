/**
 * Sora 2 Text To Video API Client
 * Uses kie.ai API for Sora 2 text-to-video generation
 */

const KIE_API_BASE = 'https://api.kie.ai';
const KIE_API_KEY = import.meta.env.VITE_KIE_API_KEY;
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

// Debug logger utility
class DebugLogger {
  static log(category: string, message: string, data?: any) {
    console.log(`[SORA2-${category}]`, message, data ? JSON.stringify(data, null, 2) : '');
  }
  
  static error(category: string, message: string, error?: any) {
    console.error(`[SORA2-${category}] ERROR:`, message);
    if (error) {
      console.error('Error details:', error);
      if (error.stack) console.error('Stack trace:', error.stack);
    }
  }
  
  static warn(category: string, message: string, data?: any) {
    console.warn(`[SORA2-${category}] WARNING:`, message, data || '');
  }
}

export interface Sora2CreateTaskRequest {
  model: 'sora-2-text-to-video' | 'sora-2-image-to-video';
  input: {
    prompt: string;
    image_urls?: string[];
    aspect_ratio?: 'portrait' | 'landscape';
    quality?: 'standard' | 'hd';
  };
  callBackUrl?: string;
}

export interface Sora2TaskResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

export interface Sora2TaskStatus {
  code: number;
  msg: string;
  data: {
    taskId: string;
    model: string;
    state: 'waiting' | 'success' | 'fail';
    param: string;
    resultJson: string;
    failCode: string | null;
    failMsg: string | null;
    costTime: number | null;
    completeTime: number | null;
    createTime: number;
  };
}

class Sora2Client {
  /**
   * Upload an image file to ImgBB (free public hosting service)
   * Returns a publicly accessible URL that can be used in image_urls parameter for Sora 2
   * Note: kie.ai doesn't provide a public upload API, so we use ImgBB as intermediary
   */
  async uploadImage(file: File): Promise<string> {
    DebugLogger.log('UPLOAD_IMAGE', 'Starting image upload', { fileName: file.name, fileSize: file.size, fileType: file.type });
    
    // Validate file
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are supported.');
    }
    
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit.');
    }
    
    // Since kie.ai doesn't provide a public upload API, use ImgBB as a free image hosting service
    // ImgBB provides a free API with no authentication required (using a public demo key)
    try {
      DebugLogger.log('UPLOAD_IMAGE', 'Uploading to ImgBB for public URL...');
      
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload to ImgBB using their free API
      const formData = new FormData();
      formData.append('image', base64);
      formData.append('name', file.name);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        DebugLogger.error('UPLOAD_IMAGE', 'ImgBB upload failed', {
          status: response.status,
          error: errorText,
        });
        throw new Error('Failed to upload image to hosting service. Please try using "Enter URL" mode.');
      }

      const result = await response.json();
      DebugLogger.log('UPLOAD_IMAGE', 'ImgBB upload response', result);

      if (!result.success || !result.data?.url) {
        DebugLogger.error('UPLOAD_IMAGE', 'Invalid ImgBB response', result);
        throw new Error('Failed to get image URL from hosting service.');
      }

      const imageUrl = result.data.url;
      DebugLogger.log('UPLOAD_IMAGE', `Image uploaded successfully: ${imageUrl}`);
      return imageUrl;
    } catch (error) {
      DebugLogger.error('UPLOAD_IMAGE', 'Image upload failed', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to upload image. Please try using "Enter URL" mode or upload to Imgur/ImgBB manually.');
    }
  }

  private async createTask(input: Sora2CreateTaskRequest): Promise<string> {
    DebugLogger.log('CREATE_TASK', 'Starting Sora 2 task creation', input);
    
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

      const result: Sora2TaskResponse = await response.json();
      DebugLogger.log('CREATE_TASK', 'API response received', result);
      
      if (result.code !== 200) {
        DebugLogger.error('CREATE_TASK', `API returned error code ${result.code}`, result);
        
        // Provide specific error messages based on Kie.ai error codes
        let errorMessage = result.msg || 'Unknown error';
        switch (result.code) {
          case 401:
            errorMessage = 'Authentication failed. Please check your API key.';
            break;
          case 402:
            errorMessage = 'Insufficient credits. Please add more credits to your Kie.ai account.';
            break;
          case 404:
            errorMessage = 'API endpoint not found. The Sora 2 model may not be available.';
            break;
          case 422:
            errorMessage = 'Invalid request parameters. Please check your prompt.';
            break;
          case 429:
            errorMessage = 'Rate limit exceeded. Please wait before making another request.';
            break;
          case 500:
            errorMessage = 'Internal server error. Please try again or contact support.';
            break;
          default:
            errorMessage = `API error (${result.code}): ${result.msg || 'Unknown error'}`;
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

  private async pollTaskStatus(taskId: string): Promise<Sora2TaskStatus> {
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

      const result: Sora2TaskStatus = await response.json();
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

  private async waitForCompletion(
    taskId: string, 
    maxWaitTime = 900000, // 15 minutes - Sora 2 can take a while
    onProgress?: (message: string) => void
  ): Promise<string> {
    DebugLogger.log('WAIT_COMPLETION', `Starting to wait for task ${taskId} completion`);
    const startTime = Date.now();
    const pollInterval = 5000; // Poll every 5 seconds to reduce API calls

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
          failCode: status.data.failCode,
          fullStatus: status.data
        });
        
        // Provide helpful error messages for common issues
        let errorMessage = status.data.failMsg || 'Unknown error';
        
        if (errorMessage.toLowerCase().includes('safety filter') || errorMessage.toLowerCase().includes('copyrighted')) {
          errorMessage = `Content Safety Issue: ${errorMessage}\n\nSuggestions:\n• Try different wording in your prompt\n• Avoid mentioning specific brands, characters, or celebrities\n• Use more generic descriptions\n• If using an image, ensure it doesn't contain copyrighted material`;
        } else if (errorMessage.toLowerCase().includes('nsfw') || errorMessage.toLowerCase().includes('inappropriate')) {
          errorMessage = `Content Policy Violation: ${errorMessage}\n\nPlease ensure your prompt follows OpenAI's content policy.`;
        }
        
        throw new Error(errorMessage);
      }
      
      // Still processing, wait before next poll
      const elapsed = Date.now() - startTime;
      const elapsedSeconds = Math.floor(elapsed / 1000);
      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;
      const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
      
      DebugLogger.log('WAIT_COMPLETION', `Task ${taskId} still processing (${elapsed}ms elapsed), waiting ${pollInterval}ms...`);
      
      // Update progress with time elapsed
      if (onProgress) {
        onProgress(`Video generation in progress... (${timeString} elapsed)\nSora 2 can take 5-10 minutes. Please be patient.`);
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    DebugLogger.error('WAIT_COMPLETION', `Task ${taskId} timed out after ${maxWaitTime}ms`);
    throw new Error('Task timed out after 15 minutes. The video may still be processing on kie.ai - check your account.');
  }

  /**
   * Generate video from text prompt using Sora 2
   */
  async generateVideo(
    prompt: string,
    options?: {
      aspect_ratio?: 'portrait' | 'landscape';
      quality?: 'standard' | 'hd';
      onProgress?: (message: string) => void;
    }
  ): Promise<string> {
    try {
      DebugLogger.log('GENERATE_VIDEO', 'Starting video generation', { prompt, options });

      // Notify progress
      if (options?.onProgress) {
        options.onProgress('Creating video generation task...');
      }

      const requestData: Sora2CreateTaskRequest = {
        model: 'sora-2-text-to-video',
        input: {
          prompt: prompt,
          aspect_ratio: options?.aspect_ratio || 'landscape',
          quality: options?.quality || 'standard',
        },
      };

      const taskId = await this.createTask(requestData);
      DebugLogger.log('GENERATE_VIDEO', 'Task created with ID:', taskId);

      // Notify progress
      if (options?.onProgress) {
        options.onProgress('Video generation in progress... Sora 2 can take 5-10 minutes.');
      }
      
      const videoUrl = await this.waitForCompletion(taskId, undefined, options?.onProgress);
      DebugLogger.log('GENERATE_VIDEO', 'Task completed, result URL:', videoUrl);

      // Notify progress
      if (options?.onProgress) {
        options.onProgress('Video generated successfully!');
      }
      
      return videoUrl;
    } catch (error) {
      DebugLogger.error('GENERATE_VIDEO', 'Video generation error:', error);
      throw error;
    }
  }

  /**
   * Generate video from image using Sora 2
   */
  async generateVideoFromImage(
    prompt: string,
    imageUrls: string[],
    options?: {
      aspect_ratio?: 'portrait' | 'landscape';
      quality?: 'standard' | 'hd';
      onProgress?: (message: string) => void;
    }
  ): Promise<string> {
    try {
      DebugLogger.log('GENERATE_VIDEO_FROM_IMAGE', 'Starting image-to-video generation', { prompt, imageUrls, options });

      // Notify progress
      if (options?.onProgress) {
        options.onProgress('Creating image-to-video generation task...');
      }

      const requestData: Sora2CreateTaskRequest = {
        model: 'sora-2-image-to-video',
        input: {
          prompt: prompt,
          image_urls: imageUrls,
          aspect_ratio: options?.aspect_ratio || 'landscape',
          quality: options?.quality || 'standard',
        },
      };

      const taskId = await this.createTask(requestData);
      DebugLogger.log('GENERATE_VIDEO_FROM_IMAGE', 'Task created with ID:', taskId);

      // Notify progress
      if (options?.onProgress) {
        options.onProgress('Video generation in progress... Sora 2 can take 5-10 minutes.');
      }
      
      const videoUrl = await this.waitForCompletion(taskId, undefined, options?.onProgress);
      DebugLogger.log('GENERATE_VIDEO_FROM_IMAGE', 'Task completed, result URL:', videoUrl);

      // Notify progress
      if (options?.onProgress) {
        options.onProgress('Video generated successfully!');
      }
      
      return videoUrl;
    } catch (error) {
      DebugLogger.error('GENERATE_VIDEO_FROM_IMAGE', 'Image-to-video generation error:', error);
      throw error;
    }
  }

  /**
   * Check if video URL is accessible
   */
  async testVideoUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      DebugLogger.error('TEST_VIDEO_URL', 'Failed to test video URL', error);
      return false;
    }
  }
}

export const sora2Client = new Sora2Client();

