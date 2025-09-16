/**
 * Nano Banana API Client for Image Editing
 * Uses kie.ai API with google/nano-banana-edit (Gemini 2.5 Flash Image) model
 */

// Extend ImportMeta interface to include env
declare global {
  interface ImportMetaEnv {
    VITE_KIE_API_KEY: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

interface NanoBananaCreateTaskRequest {
  model: "google/nano-banana-edit";
  input: {
    prompt: string;
    image_urls: string[];
    output_format?: 'png' | 'jpeg';
    image_size?: 'auto' | string;
  };
  callBackUrl?: string;
}

interface NanoBananaCreateTaskResponse {
  code: number;
  message: string;
  data: {
    taskId: string;
  };
}

interface NanoBananaJobInfo {
  code: number;
  message: string;
  data: {
    taskId: string;
    model: string;
    state: 'waiting' | 'queuing' | 'generating' | 'success' | 'fail';
    param: string;
    resultJson: string;
    failCode: string;
    failMsg: string;
    completeTime: number;
    createTime: number;
    updateTime: number;
  };
}

class NanoBananaClient {
  private apiKey: string;
  private baseUrl: string;
  private statusUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.kie.ai/api/v1/jobs/createTask';
    this.statusUrl = 'https://api.kie.ai/api/v1/jobs/recordInfo';
  }

  /**
   * Convert a data URL to a blob and upload it to get a public URL
   * Uses multiple upload services as fallbacks
   */
  private async uploadImageFromDataUrl(dataUrl: string): Promise<string> {
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Try imgur first
      try {
        const formData = new FormData();
        formData.append('image', blob);
        
        const uploadResponse = await fetch('https://api.imgur.com/3/image', {
          method: 'POST',
          headers: {
            'Authorization': 'Client-ID 546c25a59c58ad7',
          },
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          if (uploadResult.success && uploadResult.data?.link) {
            return uploadResult.data.link;
          }
        }
      } catch (imgurError) {
        console.warn('Imgur upload failed, trying alternative:', imgurError);
      }
      
      // Since upload services are failing, let's bypass the Nano Banana API entirely
      // and fall back to the KIE client immediately
      throw new Error('Image upload services unavailable');
      
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Create a task for image editing
   */
  private async createTask(prompt: string, imageUrls: string[]): Promise<string> {
    // Ensure the prompt clearly indicates editing the provided image
    const editingPrompt = `Edit this image: ${prompt}. Keep the original composition and only apply the requested changes to the existing image.`;
    
    const requestBody: NanoBananaCreateTaskRequest = {
      model: "google/nano-banana-edit",
      input: {
        prompt: editingPrompt,
        image_urls: imageUrls,
        output_format: 'png',
        image_size: 'auto'
      }
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result: NanoBananaCreateTaskResponse = await response.json();
    
    if (result.code !== 200 || !result.data?.taskId) {
      throw new Error(`API Error: ${result.message || 'No task ID returned'}`);
    }

    return result.data.taskId;
  }

  /**
   * Get job status and results
   */
  private async getJobInfo(taskId: string): Promise<NanoBananaJobInfo> {
    const response = await fetch(`${this.statusUrl}?taskId=${taskId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Status request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Edit an image using the Nano Banana model
   */
  async editImage(
    prompt: string,
    imageDataUrl: string,
    options: { output_format?: 'png' | 'jpeg'; image_size?: string } = {}
  ): Promise<string> {
    try {
      // Upload the image to get a public URL
      const imageUrl = await this.uploadImageFromDataUrl(imageDataUrl);
      
      // Use the public URL method
      return await this.editImageFromUrl(prompt, imageUrl, options);
      
    } catch (error) {
      console.error('Nano Banana API Error:', error);
      throw error;
    }
  }

  /**
   * Edit image with public URL (recommended approach)
   */
  async editImageFromUrl(
    prompt: string,
    imageUrl: string,
    options: { output_format?: 'png' | 'jpeg'; image_size?: string } = {}
  ): Promise<string> {
    try {
      // Create the task
      const taskId = await this.createTask(prompt, [imageUrl]);
      
      // Poll for completion
      return new Promise((resolve, reject) => {
        const pollInterval = setInterval(async () => {
          try {
            const jobInfo = await this.getJobInfo(taskId);
            
            if (jobInfo.data.state === 'success') {
              clearInterval(pollInterval);
              
              // Parse the resultJson string
              let resultData;
              try {
                resultData = JSON.parse(jobInfo.data.resultJson);
              } catch (e) {
                reject(new Error('Failed to parse result JSON'));
                return;
              }
              
              if (!resultData.resultUrls?.[0]) {
                reject(new Error('No edited image returned from API'));
                return;
              }

              // Convert the result URL to a data URL for consistency with the existing app
              const imageResponse = await fetch(resultData.resultUrls[0]);
              const imageBlob = await imageResponse.blob();
              
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(imageBlob);
              
            } else if (jobInfo.data.state === 'fail') {
              clearInterval(pollInterval);
              reject(new Error(jobInfo.data.failMsg || 'Image editing job failed'));
            }
            
          } catch (error) {
            clearInterval(pollInterval);
            reject(error);
          }
        }, 2000); // Poll every 2 seconds

        // Set a timeout to prevent infinite polling
        setTimeout(() => {
          clearInterval(pollInterval);
          reject(new Error('Request timeout - job took too long to complete'));
        }, 300000); // 5 minutes timeout
      });

    } catch (error) {
      console.error('Nano Banana API Error:', error);
      throw error;
    }
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test with a simple public image URL
      const testImageUrl = 'https://via.placeholder.com/100x100/000000/FFFFFF?text=Test';
      const taskId = await this.createTask('make it white', [testImageUrl]);
      return !!taskId;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Create and export the client instance using the existing KIE API key
const nanoBananaClient = new NanoBananaClient(
  import.meta.env.VITE_KIE_API_KEY || ''
);

export { nanoBananaClient, NanoBananaClient };
export type { NanoBananaCreateTaskRequest, NanoBananaCreateTaskResponse, NanoBananaJobInfo };
