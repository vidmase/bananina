/**
 * Mobile Image Manager
 * Manages image in dedicated fixed area, prevents overlap
 */

(function() {
  'use strict';

  // Only run on mobile
  if (window.innerWidth > 768) return;

  console.log('📱 Mobile Image Manager - Starting...');

  let imageContainer = null;
  let contentWrapper = null;
  let toggleButton = null;

  // =====================================
  // FIX HEADER LAYOUT
  // =====================================
  
  function fixHeaderLayout() {
    const header = document.querySelector('.app-header');
    if (!header) return;

    // Ensure header has proper structure
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    header.style.padding = '0.5rem 0.75rem';
    header.style.overflow = 'hidden';
    header.style.width = '100%';
    header.style.boxSizing = 'border-box';

    // Find buttons and make them compact
    const buttons = header.querySelectorAll('button');
    buttons.forEach(btn => {
      const text = btn.textContent || btn.innerText;
      
      // If button has long text, truncate it
      if (text && text.length > 10) {
        btn.style.maxWidth = '100px';
        btn.style.overflow = 'hidden';
        btn.style.textOverflow = 'ellipsis';
        btn.style.whiteSpace = 'nowrap';
      }
      
      // Make buttons smaller
      btn.style.height = '36px';
      btn.style.padding = '0.5rem';
      btn.style.fontSize = '0.85rem';
    });

    console.log('✅ Header layout fixed');
  }

  // =====================================
  // CREATE DEDICATED IMAGE AREA
  // =====================================
  
  function createImageContainer() {
    if (imageContainer) return imageContainer;

    // Find app layout
    const appLayout = document.querySelector('.app-layout, .app-container');
    if (!appLayout) {
      console.warn('App layout not found');
      return null;
    }

    // Create dedicated image container
    imageContainer = document.createElement('div');
    imageContainer.className = 'mobile-image-container';
    imageContainer.id = 'mobile-image-area';

    // Create toggle button
    toggleButton = document.createElement('button');
    toggleButton.className = 'mobile-image-toggle';
    toggleButton.innerHTML = '−'; // Minimize symbol
    toggleButton.setAttribute('aria-label', 'Toggle image size');
    
    toggleButton.addEventListener('click', () => {
      imageContainer.classList.toggle('collapsed');
      toggleButton.innerHTML = imageContainer.classList.contains('collapsed') ? '+' : '−';
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    });

    imageContainer.appendChild(toggleButton);

    // Find header
    const header = appLayout.querySelector('.app-header');
    
    if (header) {
      // Insert image container after header
      header.insertAdjacentElement('afterend', imageContainer);
    } else {
      // Insert at beginning
      appLayout.insertBefore(imageContainer, appLayout.firstChild);
    }

    console.log('✅ Created dedicated image container');
    return imageContainer;
  }

  // =====================================
  // CREATE CONTENT WRAPPER
  // =====================================
  
  function createContentWrapper() {
    if (contentWrapper) return contentWrapper;

    const appLayout = document.querySelector('.app-layout, .app-container');
    if (!appLayout) return null;

    // Find main content area
    const mainContent = appLayout.querySelector('.main-content, [class*="content"]');
    
    if (mainContent && !mainContent.classList.contains('mobile-content-wrapper')) {
      contentWrapper = document.createElement('div');
      contentWrapper.className = 'mobile-content-wrapper';
      
      // Move main content inside wrapper
      const parent = mainContent.parentNode;
      parent.insertBefore(contentWrapper, mainContent);
      contentWrapper.appendChild(mainContent);
      
      console.log('✅ Created content wrapper');
    }

    return contentWrapper;
  }

  // =====================================
  // HIDE ALL IMAGES - SHOW ONLY IN BOTTOM
  // =====================================
  
  function hideAllDuplicateImages() {
    // Find ALL image displays
    const allImageDisplays = document.querySelectorAll('.image-display, .image-container, [class*="image-display"]');
    
    let lastImage = null;
    let lastImageParent = null;
    
    // Find the LAST (bottom-most) image
    allImageDisplays.forEach(imgDisplay => {
      // Skip previews/thumbnails
      if (imgDisplay.closest('[class*="preview"]') || 
          imgDisplay.closest('[class*="thumbnail"]') ||
          imgDisplay.closest('#mobile-image-area')) return;
      
      const img = imgDisplay.querySelector('img');
      const canvas = imgDisplay.querySelector('canvas');
      
      if (img || canvas) {
        lastImage = imgDisplay;
        lastImageParent = imgDisplay.parentElement;
      }
    });
    
    // Hide ALL images except the last one
    allImageDisplays.forEach(imgDisplay => {
      // Skip previews/thumbnails
      if (imgDisplay.closest('[class*="preview"]') || 
          imgDisplay.closest('[class*="thumbnail"]') ||
          imgDisplay.closest('#mobile-image-area')) return;
      
      if (imgDisplay !== lastImage) {
        imgDisplay.style.display = 'none';
        imgDisplay.style.visibility = 'hidden';
        imgDisplay.style.position = 'absolute';
        imgDisplay.style.left = '-9999px';
        imgDisplay.style.opacity = '0';
        imgDisplay.style.pointerEvents = 'none';
      } else {
        // Keep the last image visible
        imgDisplay.style.display = '';
        imgDisplay.style.visibility = '';
        imgDisplay.style.position = '';
        imgDisplay.style.left = '';
        imgDisplay.style.opacity = '';
        imgDisplay.style.pointerEvents = '';
      }
    });
    
    // Remove the dedicated image container if it exists
    if (imageContainer && imageContainer.parentNode) {
      imageContainer.remove();
      imageContainer = null;
    }
    
    console.log('✅ Kept only bottom image, removed duplicates');
  }

  // =====================================
  // ENSURE CONTENT IS BELOW IMAGE
  // =====================================
  
  function ensureProperLayout() {
    const appLayout = document.querySelector('.app-layout, .app-container');
    if (!appLayout) return;

    // Ensure order: header -> image -> content -> nav
    const header = appLayout.querySelector('.app-header');
    const imageArea = appLayout.querySelector('#mobile-image-area');
    const mainContent = appLayout.querySelector('.main-content, [class*="content"]');
    const bottomNav = appLayout.querySelector('.main-nav, .main-nav-mobile');

    if (header) header.style.order = '1';
    if (imageArea) imageArea.style.order = '2';
    if (mainContent) mainContent.style.order = '3';
    if (bottomNav) bottomNav.style.order = '4';
  }

  // Not needed anymore - using hideAllDuplicateImages instead

  // =====================================
  // COLLAPSIBLE CATEGORIES
  // =====================================
  
  function initCollapsibleCategories() {
    const categories = document.querySelectorAll('.assistant-category');
    
    categories.forEach((category, index) => {
      if (category.dataset.mobileCollapsible) return;
      category.dataset.mobileCollapsible = 'true';
      
      const header = category.querySelector('h3');
      if (!header) return;
      
      // First one expanded, rest collapsed
      if (index === 0) {
        category.classList.add('expanded');
      } else {
        category.classList.add('collapsed');
      }
      
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        category.classList.toggle('collapsed');
        category.classList.toggle('expanded');
        
        if (navigator.vibrate) {
          navigator.vibrate(10);
        }
      });
    });
  }

  // =====================================
  // MONITOR FOR NEW IMAGES
  // =====================================
  
  function observeImageChanges() {
    const observer = new MutationObserver((mutations) => {
      let hasNewImage = false;
      
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            if (node.matches('img, canvas') || 
                node.querySelector('img, canvas')) {
              hasNewImage = true;
            }
          }
        });
      });
      
      if (hasNewImage) {
        setTimeout(() => {
          hideAllDuplicateImages();
        }, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // =====================================
  // HANDLE TAB CHANGES
  // =====================================
  
  function handleTabChanges() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.tab-button, .nav-button')) {
        setTimeout(() => {
          hideAllDuplicateImages();
          initCollapsibleCategories();
        }, 100);
      }
    });
  }

  // =====================================
  // INITIALIZE EVERYTHING
  // =====================================
  
  function init() {
    console.log('🔄 Initializing mobile image manager...');
    
    // Fix header layout
    fixHeaderLayout();
    
    // Hide duplicate images, keep only bottom one
    hideAllDuplicateImages();
    
    // Init features
    initCollapsibleCategories();
    
    // Monitor changes
    observeImageChanges();
    handleTabChanges();
    
    console.log('✅ Mobile image manager ready!');
    console.log('📸 Showing only bottom image');
    console.log('🚫 Removed duplicate images');
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Run immediately
    init();
  }

  // Re-run on window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      fixHeaderLayout();
      hideAllDuplicateImages();
    }, 200);
  });

  // Re-run every 2 seconds to catch any missed duplicates
  setInterval(() => {
    fixHeaderLayout();
    hideAllDuplicateImages();
  }, 2000);

  console.log('✅ Mobile Image Manager loaded');
})();

