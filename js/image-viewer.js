// Image viewer functions
global.onImageError = function(e) {
  console.error('Image error:', e);
  
  // Try to play next item if current one fails
  if (global.currentIndex < global.playlistItems.length - 1) {
    console.log('Trying next item...');
    global.playVideoAtIndex(global.currentIndex + 1);
  }
}

global.onImageLoaded = function() {
  console.log('Image loaded successfully');
  // Keep mainControls hidden for images - only show floating button
  welcomeScreen.classList.add('hidden');
}

global.navigateImage = function(direction, isSlideshowNavigation = false) {
  if (global.playlistItems.length === 0) return;

  // Stop slideshow when navigating manually (not from slideshow)
  if (!isSlideshowNavigation) {
    global.stopSlideshow();
  }

  let newIndex = global.currentIndex + direction;
  if (newIndex < 0) newIndex = global.playlistItems.length - 1;
  if (newIndex >= global.playlistItems.length) newIndex = 0;

  global.playVideoAtIndex(newIndex);
}

global.updateImageTransform = function() {
  imagePlayer.style.transform = `scale(${global.imageZoom}) rotate(${global.imageRotation}deg) translate(${global.imagePanX}px, ${global.imagePanY}px)`;
}

global.handleWheel = function(e) {
  if (global.currentMediaType === 'image') {
    if (global.isScrollPressed) {
      // Pan with scroll wheel pressed
      e.preventDefault();
      global.imagePanX -= e.deltaX;
      global.imagePanY -= e.deltaY;
      global.updateImageTransform();
    } else {
      // Zoom with scroll
      e.preventDefault();
      const zoomSpeed = 0.1;
      if (e.deltaY < 0) {
        // Scroll up - zoom in
        global.imageZoom = Math.min(global.imageZoom + zoomSpeed, 10);
      } else {
        // Scroll down - zoom out
        global.imageZoom = Math.max(global.imageZoom - zoomSpeed, 0.1);
      }
      global.updateImageTransform();
    }
  } else if (global.currentMediaType === 'video' || global.currentMediaType === 'audio') {
    // Volume control with scroll for video/audio
    e.preventDefault();
    const volumeSpeed = 0.05;
    if (e.deltaY < 0) {
      // Scroll up - increase volume
      videoPlayer.volume = Math.min(1, videoPlayer.volume + volumeSpeed);
    } else {
      // Scroll down - decrease volume
      videoPlayer.volume = Math.max(0, videoPlayer.volume - volumeSpeed);
    }
    volumeSlider.value = videoPlayer.volume;
  }
}

global.handleMouseDown = function(e) {
  if (e.button === 1) { // Middle mouse button (scroll wheel)
    global.isScrollPressed = true;
    global.lastMouseX = e.clientX;
    global.lastMouseY = e.clientY;
    e.preventDefault();
  }
}

global.handleMouseUp = function(e) {
  if (e.button === 1) {
    global.isScrollPressed = false;
  }
}

global.handleMouseMovePan = function(e) {
  if (global.isScrollPressed && global.currentMediaType === 'image') {
    const deltaX = e.clientX - global.lastMouseX;
    const deltaY = e.clientY - global.lastMouseY;
    global.imagePanX += deltaX;
    global.imagePanY += deltaY;
    global.lastMouseX = e.clientX;
    global.lastMouseY = e.clientY;
    global.updateImageTransform();
  }
}

global.toggleSlideshow = function() {
  if (global.isSlideshowRunning) {
    global.stopSlideshow();
  } else {
    global.startSlideshow();
  }
}

global.startSlideshow = function() {
  if (global.playlistItems.length <= 1) {
    console.log('Not enough images for slideshow');
    return;
  }

  global.isSlideshowRunning = true;
  console.log('Starting slideshow');

  global.slideshowInterval = setInterval(() => {
    global.navigateImage(1, true); // true = this is slideshow navigation
  }, 6000); // 6 seconds
}

global.stopSlideshow = function() {
  if (global.slideshowInterval) {
    clearInterval(global.slideshowInterval);
    global.slideshowInterval = null;
  }
  global.isSlideshowRunning = false;
  console.log('Slideshow stopped');
}
