/**
 * Mobile Image Viewer
 * Provides fullscreen image viewing on mobile devices
 */

(function() {
  'use strict';

  // Only run on mobile devices
  if (window.innerWidth > 768) return;

  // Add fullscreen image viewer to the page
  function createImageViewer() {
    const viewer = document.createElement('div');
    viewer.id = 'mobile-image-viewer';
    viewer.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.95);
      z-index: 9999;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    `;

    const container = document.createElement('div');
    container.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: env(safe-area-inset-top, 20px) env(safe-area-inset-right, 20px) env(safe-area-inset-bottom, 20px) env(safe-area-inset-left, 20px);
      overflow: auto;
      -webkit-overflow-scrolling: touch;
    `;

    const img = document.createElement('img');
    img.style.cssText = `
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      width: auto;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      position: fixed;
      top: env(safe-area-inset-top, 20px);
      right: env(safe-area-inset-right, 20px);
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      font-size: 24px;
      cursor: pointer;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      -webkit-tap-highlight-color: transparent;
    `;

    closeBtn.addEventListener('click', () => {
      viewer.style.display = 'none';
      document.body.style.overflow = '';
    });

    container.appendChild(img);
    viewer.appendChild(container);
    viewer.appendChild(closeBtn);
    document.body.appendChild(viewer);

    return { viewer, img };
  }

  // Initialize viewer
  const { viewer, img: viewerImg } = createImageViewer();

  // Function to open viewer
  function openViewer(imageSrc) {
    viewerImg.src = imageSrc;
    viewer.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Add fade-in animation
    viewer.style.opacity = '0';
    requestAnimationFrame(() => {
      viewer.style.transition = 'opacity 0.3s ease';
      viewer.style.opacity = '1';
    });
  }

  // Add click handlers to images
  function attachImageClickHandlers() {
    // Find all images in the image display area
    const imageDisplays = document.querySelectorAll('.image-display img, .canvas-area img, [src*="data:image"]');
    
    imageDisplays.forEach(img => {
      if (img.hasAttribute('data-viewer-attached')) return;
      
      img.style.cursor = 'pointer';
      img.setAttribute('data-viewer-attached', 'true');
      
      img.addEventListener('click', (e) => {
        // Don't open if image is in a button or control
        if (e.target.closest('button, .btn, .control-panel')) return;
        
        openViewer(img.src);
        e.stopPropagation();
      });
    });
  }

  // Watch for new images being added
  const observer = new MutationObserver(() => {
    attachImageClickHandlers();
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial attachment
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachImageClickHandlers);
  } else {
    attachImageClickHandlers();
  }

  // Re-attach on tab change
  document.addEventListener('click', (e) => {
    if (e.target.closest('.tab-button')) {
      setTimeout(attachImageClickHandlers, 100);
    }
  });

  // Close viewer on swipe down (optional enhancement)
  let touchStartY = 0;
  viewer.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  });

  viewer.addEventListener('touchmove', (e) => {
    const touchEndY = e.touches[0].clientY;
    const diff = touchEndY - touchStartY;
    
    if (diff > 100) {
      viewer.style.display = 'none';
      document.body.style.overflow = '';
    }
  });

  console.log('📱 Mobile Image Viewer initialized');
})();

