// State management
global.playlistItems = [];
global.currentIndex = -1;
global.isPlaying = false;
global.hideTimeout = null;
global.isControlsVisible = true;
global.isConsoleEnabled = false;
global.consoleLogs = [];
global.currentMediaType = null; // 'video', 'image', or 'audio'

// Image viewer state
global.imageZoom = 1;
global.imageRotation = 0;
global.imagePanX = 0;
global.imagePanY = 0;
global.isScrollPressed = false;
global.lastMouseX = 0;
global.lastMouseY = 0;
global.slideshowInterval = null;
global.isSlideshowRunning = false;

// Main controls dragging state
global.isControlsDragging = false;
global.controlsDragOffsetX = 0;
global.controlsDragOffsetY = 0;

// Original console methods
global.originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
};
