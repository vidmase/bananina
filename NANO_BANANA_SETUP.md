# Nano Banana API Integration Setup

This project now includes integration with the Nano Banana Edit Model API for advanced image editing capabilities using Google's Gemini 2.5 Flash Image model through kie.ai.

## Setup Instructions

### 1. API Key Configuration

The integration uses your existing KIE API key from the `.env.local` file. No additional setup is required since the Nano Banana model is available through the same kie.ai API.

### 2. Environment Variables

Your existing configuration already includes the necessary API key:

```
VITE_KIE_API_KEY=your_api_key_here
```

### 3. Features

The integration provides:

- **Image-to-Image Editing**: Edit existing images with natural language prompts
- **Professional Quality**: Uses Google's Gemini 2.5 Flash for high-quality results
- **Fallback Support**: Automatically falls back to KIE client if Nano Banana fails
- **Async Processing**: Supports both sync and async processing modes
- **Error Handling**: Comprehensive error handling and user feedback

### 4. Usage

Once configured, you can:

1. Upload an image to the editor
2. Enter a descriptive prompt (e.g., "change the background to a sunset", "make it black and white", "add dramatic lighting")
3. Click submit to process the image
4. The app will use Nano Banana API for image editing

### 5. Example Prompts

- "Remove the background and make it transparent"
- "Change the lighting to golden hour"
- "Convert to black and white with high contrast"
- "Add a futuristic cityscape background"
- "Apply a vintage film look"
- "Make the colors more vibrant and saturated"

### 6. API Details

The client is configured to work with:
- **kie.ai API**: Uses the official kie.ai endpoints for Nano Banana model
- **Model**: `google/nano-banana-edit` (Gemini 2.5 Flash Image)
- **Cost**: 4 credits per image (approximately $0.02 USD)

### 7. Technical Implementation

- **Automatic Image Upload**: Images are automatically uploaded to imgur for public URL access
- **Async Processing**: Jobs are submitted and polled for completion
- **Error Handling**: Comprehensive error handling with fallback to KIE client
- **Data URL Conversion**: Results are converted back to data URLs for seamless integration

### 8. Troubleshooting

- Ensure your KIE API key is correctly set in `.env.local`
- Check the browser console for any error messages
- Verify your API key has sufficient credits/quota
- The app will automatically fall back to the KIE client if Nano Banana fails
- Image upload requires internet connection for imgur service

### 9. Technical Details

- **Client File**: `nanoBananaClient.ts`
- **Integration**: Modified `generateImage` function in `index.tsx`
- **Endpoints**: 
  - Create Task: `https://api.kie.ai/api/v1/jobs/createTask`
  - Check Status: `https://api.kie.ai/api/v1/jobs/recordInfo`
- **Image Hosting**: Uses imgur for temporary public image hosting
