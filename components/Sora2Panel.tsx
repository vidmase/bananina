import React, { useState } from 'react';
import { sora2Client } from '../soraClient';

interface Sora2PanelProps {
  onClose?: () => void;
}

const VideoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"></polygon>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
  </svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/>
    <path d="M19 17v4"/>
    <path d="M3 5h4"/>
    <path d="M17 19h4"/>
  </svg>
);

type TabType = 'text-to-video' | 'image-to-video';

export const Sora2Panel: React.FC<Sora2PanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('text-to-video');
  const [prompt, setPrompt] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<'portrait' | 'landscape'>('landscape');
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setError(null);

    try {
      // Upload to kie.ai and get the URL
      const uploadedUrl = await sora2Client.uploadImage(file);
      setImageUrl(uploadedUrl);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      setImageUrl('');
      console.error('Image upload error:', err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt to generate a video');
      return;
    }

    if (activeTab === 'image-to-video') {
      if (!imageUrl) {
        setError(imageInputMode === 'upload' ? 'Please upload an image' : 'Please enter an image URL');
        return;
      }
      
      // Validate URL format
      try {
        new URL(imageUrl);
      } catch {
        setError('Please enter a valid URL');
        return;
      }
    }

    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    setProgressMessage('Initializing...');
    
    // Scroll to top to ensure video will be visible when generated
    setTimeout(() => {
      const mainContent = document.querySelector('.sora2-main-content');
      if (mainContent) {
        mainContent.scrollTop = 0;
      }
    }, 100);

    try {
      let resultUrl: string;
      
      if (activeTab === 'text-to-video') {
        resultUrl = await sora2Client.generateVideo(prompt, {
          aspect_ratio: aspectRatio,
          quality: quality,
          onProgress: (message) => {
            setProgressMessage(message);
          },
        });
      } else {
        // Image-to-video mode
        resultUrl = await sora2Client.generateVideoFromImage(prompt, [imageUrl], {
          aspect_ratio: aspectRatio,
          quality: quality,
          onProgress: (message) => {
            setProgressMessage(message);
          },
        });
      }

      setVideoUrl(resultUrl);
      setProgressMessage('');
      
      // Scroll to video after it's set
      setTimeout(() => {
        const videoContainer = document.querySelector('.video-container-sora2');
        if (videoContainer) {
          videoContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate video');
      setProgressMessage('');
      console.error('Video generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!videoUrl) return;

    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sora2-video-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download video');
      console.error('Download error:', err);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '1.5rem 2rem',
        borderBottom: '1px solid var(--border-color, #333)',
        background: 'var(--surface-color, #0f0f0f)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <VideoIcon />
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Sora 2</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-color, #fff)',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.5rem',
                lineHeight: 1,
              }}
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>
        
        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-color, #333)',
        }}>
          <button
            onClick={() => {
              setActiveTab('text-to-video');
              setVideoUrl(null);
              setError(null);
              setImageUrl('');
            }}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'text-to-video' ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === 'text-to-video' ? '#6366f1' : 'var(--text-secondary, #999)',
              fontSize: '0.95rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Text to Video
          </button>
          <button
            onClick={() => {
              setActiveTab('image-to-video');
              setVideoUrl(null);
              setError(null);
            }}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'image-to-video' ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === 'image-to-video' ? '#6366f1' : 'var(--text-secondary, #999)',
              fontSize: '0.95rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Image to Video
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div 
        className="sora2-main-content"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem',
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          zIndex: 1,
        }}>
        {/* Video Preview */}
        {videoUrl && (
          <div 
            className="video-container-sora2"
            style={{
              width: '100%',
              maxWidth: aspectRatio === 'landscape' ? '1400px' : '800px',
              minHeight: aspectRatio === 'landscape' ? '400px' : '600px',
              margin: '0 auto 2rem auto',
              backgroundColor: '#000',
              borderRadius: '12px',
              overflow: 'visible',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.5)',
              position: 'relative',
              zIndex: 10,
            }}>
            <video
              key={videoUrl}
              src={videoUrl}
              controls
              autoPlay
              loop
              playsInline
              onLoadedMetadata={(e) => {
                console.log('[Sora2Panel] Video loaded:', {
                  src: videoUrl,
                  videoWidth: e.currentTarget.videoWidth,
                  videoHeight: e.currentTarget.videoHeight,
                  clientWidth: e.currentTarget.clientWidth,
                  clientHeight: e.currentTarget.clientHeight,
                });
              }}
              style={{
                width: '100%',
                height: 'auto',
                minHeight: aspectRatio === 'landscape' ? '400px' : '600px',
                display: 'block',
                borderRadius: '12px',
                backgroundColor: '#000',
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        {/* Placeholder when no video */}
        {!videoUrl && (
          <div style={{
            width: '100%',
            maxWidth: aspectRatio === 'landscape' ? '1400px' : '800px',
            margin: '0 auto 2rem auto',
            position: 'relative',
          }}>
            <div style={{
              position: 'relative',
              width: '100%',
              paddingBottom: aspectRatio === 'landscape' ? '56.25%' : '177.78%',
              backgroundColor: 'var(--surface-color, #1a1a1a)',
              borderRadius: '12px',
              border: '2px dashed var(--border-color, #333)',
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary, #999)',
              }}>
                {isGenerating ? (
                  <div style={{ textAlign: 'center' }}>
                    <SparklesIcon />
                    <p style={{ marginTop: '1rem', fontSize: '1.1rem' }}>
                      {progressMessage || 'Generating your video...'}
                    </p>
                    <div style={{
                      marginTop: '1rem',
                      width: '200px',
                      height: '4px',
                      backgroundColor: 'var(--border-color, #333)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                      marginLeft: 'auto',
                      marginRight: 'auto',
                    }}>
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #6366f1)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s infinite linear',
                      }} />
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <VideoIcon />
                    <p style={{ marginTop: '1rem', fontSize: '1.1rem' }}>
                      Your video will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Controls Container */}
        <div style={{
          width: '100%',
          maxWidth: '900px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}>

          {/* Controls */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            backgroundColor: 'var(--surface-color, #1a1a1a)',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color, #333)',
          }}>
            {/* Image Input (Image-to-Video only) */}
            {activeTab === 'image-to-video' && (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}>
                  <label style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--text-secondary, #999)',
                  }}>
                    Image Source
                  </label>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    background: 'var(--background-color, #0a0a0a)',
                    borderRadius: '6px',
                    padding: '0.25rem',
                    border: '1px solid var(--border-color, #333)',
                  }}>
                    <button
                      onClick={() => {
                        setImageInputMode('upload');
                        setImageUrl('');
                        setError(null);
                      }}
                      disabled={isGenerating || isUploadingImage}
                      style={{
                        padding: '0.4rem 0.8rem',
                        background: imageInputMode === 'upload' ? '#6366f1' : 'transparent',
                        color: imageInputMode === 'upload' ? '#fff' : 'var(--text-secondary, #999)',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: (isGenerating || isUploadingImage) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      📤 Upload File
                    </button>
                    <button
                      onClick={() => {
                        setImageInputMode('url');
                        setImageUrl('');
                        setError(null);
                      }}
                      disabled={isGenerating || isUploadingImage}
                      style={{
                        padding: '0.4rem 0.8rem',
                        background: imageInputMode === 'url' ? '#6366f1' : 'transparent',
                        color: imageInputMode === 'url' ? '#fff' : 'var(--text-secondary, #999)',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: (isGenerating || isUploadingImage) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      🔗 Enter URL
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}>
                  {imageInputMode === 'upload' ? (
                    <>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageUpload}
                        disabled={isGenerating || isUploadingImage}
                        style={{
                          padding: '0.75rem',
                          background: 'var(--background-color, #0a0a0a)',
                          border: '1px solid var(--border-color, #333)',
                          borderRadius: '8px',
                          color: 'var(--text-color, #fff)',
                          fontSize: '0.875rem',
                          cursor: (isGenerating || isUploadingImage) ? 'not-allowed' : 'pointer',
                        }}
                      />
                      {isUploadingImage && (
                        <div style={{
                          padding: '0.75rem',
                          background: 'rgba(99, 102, 241, 0.1)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          borderRadius: '8px',
                          color: '#6366f1',
                          fontSize: '0.875rem',
                          textAlign: 'center',
                        }}>
                          ⏳ Uploading image to ImgBB (free hosting)...
                        </div>
                      )}
                      <div style={{
                        padding: '0.75rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary, #999)',
                      }}>
                        <div style={{ marginBottom: '0.5rem', fontWeight: 500, color: '#3b82f6' }}>
                          ℹ️ Upload Feature
                        </div>
                        <div>• Your image will be uploaded to ImgBB (free public hosting)</div>
                        <div>• The returned URL will be used for video generation</div>
                        <div>• Accepted formats: JPEG, PNG, WebP • Max size: 10MB</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => {
                          setImageUrl(e.target.value);
                          setError(null);
                        }}
                        placeholder="https://example.com/image.jpg"
                        disabled={isGenerating || isUploadingImage}
                        style={{
                          padding: '0.75rem 1rem',
                          background: 'var(--background-color, #0a0a0a)',
                          border: '1px solid var(--border-color, #333)',
                          borderRadius: '8px',
                          color: 'var(--text-color, #fff)',
                          fontSize: '1rem',
                          outline: 'none',
                          fontFamily: 'inherit',
                        }}
                      />
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary, #666)',
                      }}>
                        Enter a publicly accessible image URL • JPEG, PNG, WebP • Max 10MB
                      </div>
                    </>
                  )}

                  {imageUrl && (
                    <div style={{
                      width: '100%',
                      maxHeight: '200px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid var(--border-color, #333)',
                    }}>
                      <img
                        src={imageUrl}
                        alt="Image preview"
                        onError={() => setError('Failed to load image. Please check the URL.')}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          backgroundColor: '#000',
                        }}
                      />
                    </div>
                  )}
                </div>
                
                {/* Safety Filter Tips */}
                {activeTab === 'image-to-video' && imageUrl && (
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(147, 51, 234, 0.1)',
                    border: '1px solid rgba(147, 51, 234, 0.3)',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary, #999)',
                  }}>
                    <div style={{ marginBottom: '0.5rem', fontWeight: 500, color: '#9333ea' }}>
                      💡 Tips to Avoid Safety Filter Issues:
                    </div>
                    <div style={{ marginBottom: '0.25rem' }}>
                      • Use generic descriptions: "the person" instead of "man/woman"
                    </div>
                    <div style={{ marginBottom: '0.25rem' }}>
                      • Keep prompts simple and clear
                    </div>
                    <div style={{ marginBottom: '0.25rem' }}>
                      • Avoid brand names or logos in images
                    </div>
                    <div style={{ marginBottom: '0.25rem' }}>
                      • Try rephrasing if you get safety errors
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Prompt Input */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-secondary, #999)',
              }}>
                {activeTab === 'text-to-video' ? 'Video Description' : 'Motion Description'}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  activeTab === 'text-to-video'
                    ? "Describe the video you want to create... (e.g., A professor stands at the front of a lively classroom, enthusiastically giving a lecture.)"
                    : "Describe the motion... (e.g., The person slowly stands up from the chair and walks toward the door)"
                }
                maxLength={5000}
                rows={4}
                disabled={isGenerating}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'var(--background-color, #0a0a0a)',
                  border: '1px solid var(--border-color, #333)',
                  borderRadius: '8px',
                  color: 'var(--text-color, #fff)',
                  fontSize: '1rem',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
              <div style={{
                marginTop: '0.25rem',
                fontSize: '0.75rem',
                color: 'var(--text-secondary, #666)',
                textAlign: 'right',
              }}>
                {prompt.length} / 5000
              </div>
            </div>

            {/* Options Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}>
              {/* Aspect Ratio */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary, #999)',
                }}>
                  Aspect Ratio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as 'portrait' | 'landscape')}
                  disabled={isGenerating}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--background-color, #0a0a0a)',
                    border: '1px solid var(--border-color, #333)',
                    borderRadius: '8px',
                    color: 'var(--text-color, #fff)',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="landscape">Landscape (16:9)</option>
                  <option value="portrait">Portrait (9:16)</option>
                </select>
              </div>

              {/* Quality */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary, #999)',
                }}>
                  Quality
                </label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as 'standard' | 'hd')}
                  disabled={isGenerating}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--background-color, #0a0a0a)',
                    border: '1px solid var(--border-color, #333)',
                    borderRadius: '8px',
                    color: 'var(--text-color, #fff)',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="standard">Standard</option>
                  <option value="hd">HD</option>
                </select>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                padding: '1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '0.875rem',
              }}>
                {error.split('\n').map((line, index) => (
                  <div key={index} style={{ marginBottom: index < error.split('\n').length - 1 ? '0.5rem' : 0 }}>
                    {line}
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '0.5rem',
            }}>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || isUploadingImage || !prompt.trim() || (activeTab === 'image-to-video' && !imageUrl)}
                style={{
                  flex: 1,
                  padding: '1rem 2rem',
                  background: (isGenerating || isUploadingImage || !prompt.trim() || (activeTab === 'image-to-video' && !imageUrl)) ? '#444' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: (isGenerating || isUploadingImage || !prompt.trim() || (activeTab === 'image-to-video' && !imageUrl)) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isGenerating && !isUploadingImage && prompt.trim() && (activeTab === 'text-to-video' || imageUrl)) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <SparklesIcon />
                {isGenerating ? 'Generating Video...' : 'Generate Video'}
              </button>

              {videoUrl && (
                <button
                  onClick={handleDownload}
                  style={{
                    padding: '1rem 2rem',
                    background: 'var(--accent-color, #10b981)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Download Video
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shimmer animation */}
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
    </div>
  );
};

export default Sora2Panel;

