// Keyboard Shortcuts
global.handleKeyboard = function(e) {
  if (e.target.tagName === 'INPUT') return;

  // Image-specific shortcuts
  if (global.currentMediaType === 'image') {
    switch(e.key) {
      case 'ArrowLeft':
        if (e.shiftKey) {
          // Rotate left
          e.preventDefault();
          global.imageRotation -= 90;
          global.updateImageTransform();
        } else {
          // Previous image
          e.preventDefault();
          global.navigateImage(-1);
        }
        break;
      case 'ArrowRight':
        if (e.shiftKey) {
          // Rotate right
          e.preventDefault();
          global.imageRotation += 90;
          global.updateImageTransform();
        } else {
          // Next image
          e.preventDefault();
          global.navigateImage(1);
        }
        break;
      case 'a':
      case 'A':
        if (e.shiftKey && e.ctrlKey) {
          // Shift + Ctrl + A - Add folder
          e.preventDefault();
          global.addFolder();
        } else if (e.shiftKey) {
          // Shift + A - Add files
          e.preventDefault();
          global.addFiles();
        } else {
          // Previous image
          e.preventDefault();
          global.navigateImage(-1);
        }
        break;
      case 's':
        e.preventDefault();
        global.navigateImage(1);
        break;
      case 'f':
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
        break;
      case 'Enter':
        // Reset image transform
        e.preventDefault();
        global.imageZoom = 1;
        global.imageRotation = 0;
        global.imagePanX = 0;
        global.imagePanY = 0;
        global.updateImageTransform();
        break;
      case ' ':
        // Toggle slideshow
        e.preventDefault();
        global.toggleSlideshow();
        break;
    }
    return;
  }

  // Video-specific shortcuts
  switch(e.key) {
    case ' ':
      e.preventDefault();
      global.togglePlayPause();
      break;
    case 'ArrowLeft':
      global.seekVideo(-5);
      break;
    case 'ArrowRight':
      global.seekVideo(5);
      break;
    case 'ArrowUp':
      e.preventDefault();
      volumeSlider.value = Math.min(1, parseFloat(volumeSlider.value) + 0.1);
      videoPlayer.volume = volumeSlider.value;
      break;
    case 'ArrowDown':
      e.preventDefault();
      volumeSlider.value = Math.max(0, parseFloat(volumeSlider.value) - 0.1);
      videoPlayer.volume = volumeSlider.value;
      break;
    case 'f':
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
      break;
    case 'A':
      if (e.shiftKey && e.ctrlKey) {
        // Shift + Ctrl + A - Add folder
        e.preventDefault();
        global.addFolder();
      } else if (e.shiftKey) {
        // Shift + A - Add files
        e.preventDefault();
        global.addFiles();
      }
      break;
  }
}
