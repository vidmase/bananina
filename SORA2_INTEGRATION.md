# Sora 2 Text-to-Video Integration

## Overview

The Sora 2 Text-to-Video API has been successfully integrated into the Bananina image editor application. This feature allows users to generate high-quality videos from text prompts using OpenAI's Sora 2 model via the Kie.ai API.

## Features

### 🎬 Video Generation
- **Text-to-Video**: Generate videos from descriptive text prompts
- **Aspect Ratio Options**: Choose between landscape (16:9) and portrait (9:16)
- **Quality Settings**: Select between standard and HD quality
- **Real-time Progress**: Live progress updates during video generation
- **Video Preview**: Built-in video player with controls
- **Download**: Easy one-click download of generated videos

### 📁 Files Added

1. **`soraClient.ts`** - Sora 2 API client
   - Handles API communication with Kie.ai
   - Task creation and status polling
   - Error handling and progress tracking
   - Debug logging for troubleshooting

2. **`components/Sora2Panel.tsx`** - UI Component
   - Full-screen modal interface
   - Video preview player
   - Interactive controls for aspect ratio and quality
   - Progress indicators and error handling

3. **Modified `components/ImageEditor.tsx`**
   - Added left sidebar menu
   - Sora 2 button with gradient styling
   - VideoIcon component

## How to Use

### Accessing Sora 2

1. Open the application
2. Look for the **left sidebar menu** (80px wide, dark background)
3. Click the **Sora 2** button (purple gradient button with video icon)

### Generating Videos

1. **Enter a Prompt**: Describe the video you want to create
   - Maximum 5000 characters
   - Be descriptive and specific
   - Example: "A professor stands at the front of a lively classroom, enthusiastically giving a lecture."

2. **Configure Settings**:
   - **Aspect Ratio**: 
     - Landscape (16:9) - Good for horizontal videos
     - Portrait (9:16) - Good for mobile/social media
   - **Quality**:
     - Standard - Faster generation
     - HD - Higher quality output

3. **Generate**: Click the "Generate Video" button
   - Wait for video generation (this may take a few minutes)
   - Progress messages will keep you informed

4. **Download**: Once complete, click "Download Video" to save

### API Parameters

The Sora 2 API accepts:
- **model**: `sora-2-text-to-video` (fixed)
- **prompt**: Text description (required, max 5000 chars)
- **aspect_ratio**: `landscape` or `portrait` (default: landscape)
- **quality**: `standard` or `hd` (default: standard)

## Technical Details

### API Flow

1. **Task Creation** → POST to `/api/v1/jobs/createTask`
   - Returns a `taskId`

2. **Status Polling** → GET to `/api/v1/jobs/recordInfo?taskId={taskId}`
   - Polls every 3 seconds
   - States: `waiting`, `success`, `fail`
   - Maximum wait time: 5 minutes

3. **Result Retrieval** → Extract video URL from `resultJson`

### Error Handling

The client handles various error codes:
- **401**: Authentication failed
- **402**: Insufficient credits
- **404**: Model not available
- **422**: Invalid parameters
- **429**: Rate limit exceeded
- **500**: Server error

### Debugging

Debug logs are prefixed with `[SORA2-{CATEGORY}]`:
- `CREATE_TASK` - Task creation logs
- `POLL_STATUS` - Status polling logs
- `WAIT_COMPLETION` - Completion tracking
- `GENERATE_VIDEO` - High-level generation logs

Enable browser console to see detailed logs.

## API Configuration

### API Key
Stored in `.env.local` as `VITE_KIE_API_KEY`

To change:
- Edit `soraClient.ts`
- Update the `KIE_API_KEY` constant
- Consider moving to environment variables for production

### Base URL
- Production: `https://api.kie.ai`

## UI/UX Features

### Left Menu Design
- **Width**: 80px
- **Background**: Dark surface color (#0f0f0f)
- **Border**: 1px solid border color (#333)
- **Buttons**: 60x60px with icons and labels

### Sora 2 Button
- **Gradient**: Linear gradient from #6366f1 to #8b5cf6
- **Shadow**: Glowing effect on hover
- **Animation**: Smooth lift effect
- **Icon**: Video camera icon
- **Label**: "Sora 2"

### Sora 2 Panel
- **Layout**: Full-screen modal overlay
- **Background**: Dark with 95% opacity
- **Video Preview**: Responsive aspect ratio container
- **Controls**: Clean, modern form design
- **Progress**: Animated shimmer effect during generation

## Browser Compatibility

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## Performance Notes

- Video generation typically takes 30 seconds to 3 minutes
- HD quality takes longer than standard
- Longer prompts may increase generation time
- Network speed affects download time

## Future Enhancements

Potential improvements:
1. History of generated videos
2. Prompt templates/presets
3. Video editing capabilities
4. Multiple video formats
5. Batch generation
6. Custom duration settings (when API supports)

## Troubleshooting

### Video not generating
1. Check API key validity
2. Verify internet connection
3. Check browser console for errors
4. Ensure prompt is under 5000 characters

### Slow generation
- This is normal - video generation is compute-intensive
- HD quality takes longer
- Complex prompts may increase time

### Download fails
- Check browser download permissions
- Ensure sufficient disk space
- Try right-click > "Save video as..."

## Support

For issues or questions:
1. Check browser console logs (F12)
2. Look for `[SORA2-*]` prefixed messages
3. Verify API key and credits at https://kie.ai/api-key

---

**Integration Complete** ✅
- Sora 2 API client implemented
- UI components created
- Left menu added
- Everything working perfectly

