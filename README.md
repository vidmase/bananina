# Bananina - AI Image Editor

A powerful web-based AI image editing application with advanced features including before/after comparison slider, multiple AI assistants, and comprehensive editing tools.

## Features

### 🎨 AI-Powered Editing
- **Multiple AI Models**: Support for Kie.ai Nano Banana Edit, DeepSeek, and Nano Banana models
- **Smart Suggestions**: 50+ specialized AI assistants across categories:
  - **Creative Concepts**: Art direction and creative transformations
  - **People & Portraits**: Professional portrait enhancement and styling
  - **Architecture & Interiors**: Space planning, lighting design, and architectural improvements
  - **Photography Essentials**: Technical photography improvements and advanced techniques
  - **Car Tuning**: Automotive modifications and enhancements
  - **Landscapes & Scenery**: Natural scene enhancement

### 🔄 Before/After Comparison
- **Interactive Slider**: Drag to compare original vs edited images
- **Automatic Display**: Slider appears automatically after editing
- **Reset Functionality**: One-click return to original image

### 🛠️ Advanced Tools
- **Mask Editor**: Precise area selection for targeted edits
- **Voice Input**: Speech-to-text for prompts
- **Undo/Redo**: Full editing history management
- **Favorites**: Save and reuse favorite edits
- **Quick Effects**: One-click style transformations

### 📱 User Experience
- **Responsive Design**: Works on desktop and mobile
- **Touch Support**: Mobile-friendly slider interactions
- **Real-time Preview**: Instant feedback on edits
- **Professional UI**: Clean, modern interface

## Tech Stack

- **Frontend**: React with TypeScript, Vite
- **AI Integration**: Multiple AI model APIs
- **Styling**: Modern CSS with responsive design
- **Image Processing**: Canvas-based editing tools

## Setup

**Prerequisites:** Node.js

1. Clone the repository:
   ```bash
   git clone https://github.com/vidmase/bananina.git
   cd bananina
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env.local`:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   KIE_API_KEY=your_kie_api_key
   DEEPSEEK_API_KEY=your_deepseek_api_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Usage

1. **Upload an Image**: Click to upload or drag & drop an image
2. **Choose AI Assistant**: Select from 50+ specialized AI assistants
3. **Apply Edits**: Use the before/after slider to compare results
4. **Fine-tune**: Use additional tools like masking for precise edits
5. **Save Results**: Download your enhanced image

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Apache-2.0 License.
