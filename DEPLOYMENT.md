# Deployment Guide for Bananina AI Image Editor

## Environment Variables Setup

For the AI suggestions to work properly in production, you need to set up environment variables on your deployment platform.

### Required Environment Variables

```bash
VITE_KIE_API_KEY=your_kie_api_key_here
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here  
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Platform-Specific Setup

#### Vercel
1. Go to your project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with its value
4. Redeploy your application

#### Netlify
1. Go to Site Settings → Environment Variables
2. Add each variable with its value
3. Redeploy your application

#### GitHub Pages / Static Hosting
For static hosting, you'll need to build with environment variables:
```bash
VITE_KIE_API_KEY=xxx VITE_DEEPSEEK_API_KEY=xxx VITE_GEMINI_API_KEY=xxx npm run build
```

### Fallback Behavior

The application includes robust fallback mechanisms:

- **With API Keys**: Context-aware AI suggestions based on image analysis
- **Without API Keys**: Generic but relevant suggestions based on category
- **API Failures**: Automatic fallback to generic suggestions

### Testing Deployment

1. Deploy without environment variables first to test fallback behavior
2. Add environment variables one by one to test each AI service
3. Check browser console for any API key related errors

### Security Notes

- Never commit `.env.local` to version control
- Use `.env.example` as a template for other developers
- Environment variables starting with `VITE_` are exposed to the browser
- Consider using server-side API routes for sensitive operations
