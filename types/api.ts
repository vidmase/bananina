/**
 * API Type Definitions
 * Centralized types for all API clients (Kie.ai, Gemini, DeepSeek, Nano Banana)
 */

// ===== Common API Types =====

export interface APIError {
  code: number;
  message: string;
  details?: unknown;
}

export interface APIResponse<T = unknown> {
  code: number;
  message?: string;
  data?: T;
  error?: APIError;
}

// ===== Kie.ai Image Edit API =====

export namespace KieAPI {
  export type ImageSize = 
    | 'square' 
    | 'square_hd' 
    | 'portrait_4_3' 
    | 'portrait_16_9' 
    | 'landscape_4_3' 
    | 'landscape_16_9';

  export type Acceleration = 'none' | 'regular' | 'high';

  export type OutputFormat = 'jpeg' | 'png';

  export type TaskState = 'waiting' | 'queuing' | 'generating' | 'success' | 'fail';

  export interface ImageEditInput {
    prompt: string;
    image_url: string;
    acceleration?: Acceleration;
    image_size?: ImageSize;
    num_inference_steps?: number;
    seed?: number;
    guidance_scale?: number;
    sync_mode?: boolean;
    num_images?: '1' | '2' | '3' | '4';
    enable_safety_checker?: boolean;
    output_format?: OutputFormat;
    negative_prompt?: string;
  }

  export interface CreateTaskRequest {
    model: string;
    callBackUrl?: string;
    input: ImageEditInput;
  }

  export interface CreateTaskResponse {
    code: number;
    message: string;
    data: {
      taskId: string;
    };
  }

  export interface TaskStatus {
    code: number;
    data: {
      taskId: string;
      model: string;
      state: TaskState;
      param?: string;
      resultJson?: string;
      failCode?: string;
      failMsg?: string;
      costTime?: number;
      completeTime?: number;
      createTime: number;
    };
  }

  export interface TaskResult {
    resultUrls?: string[];
    resultObject?: Record<string, unknown>;
  }
}

// ===== Gemini API =====

export namespace GeminiAPI {
  export type ModelName = 
    | 'gemini-1.5-flash-latest' 
    | 'gemini-2.0-flash-exp'
    | 'gemini-2.5-flash-image-preview';

  export type Modality = 'TEXT' | 'IMAGE';

  export interface InlineData {
    mimeType: string;
    data: string;
  }

  export interface Part {
    text?: string;
    inlineData?: InlineData;
  }

  export interface Content {
    role?: 'user' | 'model';
    parts: Part[];
  }

  export interface GenerationConfig {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
    stopSequences?: string[];
  }

  export interface GenerateContentRequest {
    model: ModelName;
    contents: Content | { parts: Part[] };
    config?: {
      responseModalities?: Modality[];
      generationConfig?: GenerationConfig;
    };
    generationConfig?: GenerationConfig;
  }

  export interface Candidate {
    content: Content;
    finishReason?: string;
    index?: number;
  }

  export interface GenerateContentResponse {
    candidates?: Candidate[];
    promptFeedback?: {
      blockReason?: string;
    };
  }

  export interface CompositionSuggestion {
    title: string;
    advice: string;
    relatedPrompt: string;
  }

  export interface CompositionAnalysis {
    summary: string;
    suggestions: CompositionSuggestion[];
    tags?: string[];
    confidence?: number;
  }

  export interface ImageEditResult {
    imageUrl: string;
    mimeType: string;
  }
}

// ===== DeepSeek API =====

export namespace DeepSeekAPI {
  export type MessageRole = 'system' | 'user' | 'assistant';

  export interface Message {
    role: MessageRole;
    content: string;
  }

  export interface ChatCompletionRequest {
    model: string;
    messages: Message[];
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    stop?: string[];
  }

  export interface Choice {
    index: number;
    message: Message;
    finish_reason?: string;
  }

  export interface ChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Choice[];
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }

  export interface Suggestion {
    name: string;
    prompt: string;
  }
}

// ===== Nano Banana API (via Kie.ai) =====

export namespace NanoBananaAPI {
  export interface CreateTaskRequest {
    model: 'google/nano-banana-edit';
    input: {
      prompt: string;
      image_urls: string[];
      output_format?: 'png' | 'jpeg';
      image_size?: 'auto' | string;
    };
    callBackUrl?: string;
  }

  export interface JobInfo {
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
}

// ===== Image Upload Services =====

export namespace ImageUploadAPI {
  export interface ImgBBResponse {
    success: boolean;
    data?: {
      url: string;
      display_url?: string;
      delete_url?: string;
      id?: string;
      title?: string;
      time?: number;
      expiration?: number;
      size?: number;
    };
    status?: number;
    error?: {
      message: string;
      code: number;
    };
  }

  export interface TmpFilesResponse {
    status: 'success' | 'error';
    data?: {
      url: string;
      expiry?: string;
    };
    message?: string;
  }

  export interface FileIOResponse {
    success: boolean;
    link?: string;
    key?: string;
    expiry?: string;
    message?: string;
  }
}

// ===== HTTP Client Types =====

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  signal?: AbortSignal;
}

export interface FetchOptions extends RequestConfig {
  baseURL?: string;
  params?: Record<string, string | number | boolean>;
  retries?: number;
  retryDelay?: number;
}

// ===== Callback Types =====

export type ProgressCallback = (progress: number) => void;
export type ErrorCallback = (error: Error) => void;
export type SuccessCallback<T = unknown> = (data: T) => void;

export interface TaskCallbacks {
  onProgress?: ProgressCallback;
  onSuccess?: SuccessCallback;
  onError?: ErrorCallback;
}



