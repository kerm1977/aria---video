const { ipcRenderer } = require('electron');
const path = require('path');

// DOM Elements
const videoPlayer = document.getElementById('videoPlayer');
const imagePlayer = document.getElementById('imagePlayer');
const floatingBtn = document.getElementById('floatingBtn');
const optionsPanel = document.getElementById('optionsPanel');
const closePanel = document.getElementById('closePanel');
const mainControls = document.getElementById('mainControls');
const welcomeScreen = document.getElementById('welcomeScreen');
const playlist = document.getElementById('playlist');

// Control buttons
const playPauseBtn = document.getElementById('playPauseBtn');
const stopBtn = document.getElementById('stopBtn');
const forwardBtn = document.getElementById('forwardBtn');
const backwardBtn = document.getElementById('backwardBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');

// Progress and volume
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const volumeSlider = document.getElementById('volumeSlider');

// Speed controls
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const speedBtns = document.querySelectorAll('.speed-btn');

// Playlist buttons
const addFolderBtn = document.getElementById('addFolderBtn');
const addFilesBtn = document.getElementById('addFilesBtn');
const clearPlaylistBtn = document.getElementById('clearPlaylistBtn');

// Titlebar buttons
const minimizeBtn = document.getElementById('minimizeBtn');
const maximizeBtn = document.getElementById('maximizeBtn');
const closeBtn = document.getElementById('closeBtn');

// Video info
const infoName = document.getElementById('infoName');
const infoPath = document.getElementById('infoPath');
const infoSize = document.getElementById('infoSize');
const infoDuration = document.getElementById('infoDuration');
const infoResolution = document.getElementById('infoResolution');

// Debug console
const consoleToggle = document.getElementById('consoleToggle');
const debugConsole = document.getElementById('debugConsole');
const copyConsole = document.getElementById('copyConsole');
const clearConsole = document.getElementById('clearConsole');

// State
let playlistItems = [];
let currentIndex = -1;
let isPlaying = false;
let hideTimeout = null;
let isControlsVisible = true;
let isConsoleEnabled = false;
let consoleLogs = [];
let currentMediaType = null; // 'video' or 'image'

// Image viewer state
let imageZoom = 1;
let imageRotation = 0;
let imagePanX = 0;
let imagePanY = 0;
let isScrollPressed = false;
let lastMouseX = 0;
let lastMouseY = 0;
let slideshowInterval = null;
let isSlideshowRunning = false;

// Main controls dragging state
let isControlsDragging = false;
let controlsDragOffsetX = 0;
let controlsDragOffsetY = 0;

// Original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
};

// Initialize
function init() {
  setupEventListeners();
  updatePlayPauseButton();
}

function setupEventListeners() {
  floatingBtn.addEventListener('click', toggleOptionsPanel);
  closePanel.addEventListener('click', () => optionsPanel.classList.add('hidden'));

  playPauseBtn.addEventListener('click', togglePlayPause);
  stopBtn.addEventListener('click', stopVideo);
  forwardBtn.addEventListener('click', () => seekVideo(10));
  backwardBtn.addEventListener('click', () => seekVideo(-10));

  videoPlayer.addEventListener('timeupdate', updateProgress);
  videoPlayer.addEventListener('loadedmetadata', onVideoLoaded);
  videoPlayer.addEventListener('ended', onVideoEnded);
  videoPlayer.addEventListener('error', onVideoError);
  videoPlayer.addEventListener('play', () => {
    isPlaying = true;
    updatePlayPauseButton();
  });
  videoPlayer.addEventListener('pause', () => {
    isPlaying = false;
    updatePlayPauseButton();
  });

  imagePlayer.addEventListener('error', onImageError);
  imagePlayer.addEventListener('load', onImageLoaded);

  progressBar.addEventListener('input', () => {
    const time = (progressBar.value / 100) * videoPlayer.duration;
    videoPlayer.currentTime = time;
  });

  volumeSlider.addEventListener('input', () => {
    videoPlayer.volume = volumeSlider.value;
  });

  speedSlider.addEventListener('input', () => {
    const speed = parseFloat(speedSlider.value);
    setPlaybackSpeed(speed);
  });

  speedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = parseFloat(btn.dataset.speed);
      setPlaybackSpeed(speed);
      speedSlider.value = speed;
    });
  });

  addFolderBtn.addEventListener('click', addFolder);
  addFilesBtn.addEventListener('click', addFiles);
  clearPlaylistBtn.addEventListener('click', clearPlaylist);

  ipcRenderer.on('open-file', (event, filePath) => {
    loadVideo(filePath);
  });

  document.addEventListener('keydown', handleKeyboard);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('click', handleMouseMove);

  // Image viewer mouse events
  document.addEventListener('wheel', handleWheel, { passive: false });
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('mousemove', handleMouseMovePan);

  // Console controls
  consoleToggle.addEventListener('change', toggleConsole);
  copyConsole.addEventListener('click', copyLogs);
  clearConsole.addEventListener('click', clearLogs);

  // Collapse buttons
  document.querySelectorAll('.collapse-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const section = btn.dataset.section;
      toggleSection(section, btn);
    });
  });

  // Titlebar buttons
  minimizeBtn.addEventListener('click', () => {
    ipcRenderer.send('minimize-window');
  });

  maximizeBtn.addEventListener('click', () => {
    ipcRenderer.send('maximize-window');
  });

  closeBtn.addEventListener('click', () => {
    ipcRenderer.send('close-window');
  });

  // Section header click (clicking on header also toggles)
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', () => {
      const btn = header.querySelector('.collapse-btn');
      const section = btn.dataset.section;
      toggleSection(section, btn);
    });
  });

  // Double click on image player for fullscreen toggle + slideshow
  imagePlayer.addEventListener('dblclick', () => {
    if (currentMediaType === 'image') {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        stopSlideshow();
      } else {
        document.documentElement.requestFullscreen();
        if (!isSlideshowRunning) {
          startSlideshow();
        }
      }
    }
  });

  // Double click on video player for fullscreen toggle
  videoPlayer.addEventListener('dblclick', () => {
    if (currentMediaType === 'video' || currentMediaType === 'audio') {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    }
  });

  // Main controls dragging
  mainControls.addEventListener('mousedown', startControlsDrag);
  document.addEventListener('mousemove', dragControls);
  document.addEventListener('mouseup', stopControlsDrag);
}

// UI Control Functions
function toggleOptionsPanel() {
  optionsPanel.classList.toggle('hidden');
  if (!optionsPanel.classList.contains('hidden')) {
    showControls();
  } else {
    resetHideTimeout();
  }
}

function toggleSection(section, btn) {
  const content = document.getElementById(section + '-section');
  if (content) {
    content.classList.toggle('collapsed');
    btn.classList.toggle('collapsed');
  }
}

// Main controls dragging functions
function startControlsDrag(e) {
  if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;

  isControlsDragging = true;

  // Get current position accounting for transform
  const rect = mainControls.getBoundingClientRect();
  controlsDragOffsetX = e.clientX - rect.left;
  controlsDragOffsetY = e.clientY - rect.top;

  // Remove transform and set explicit position
  mainControls.style.transform = 'none';
  mainControls.style.left = rect.left + 'px';
  mainControls.style.top = rect.top + 'px';
  mainControls.style.bottom = 'auto';
  mainControls.style.transition = 'none';
}

function dragControls(e) {
  if (!isControlsDragging) return;

  e.preventDefault();

  const newX = e.clientX - controlsDragOffsetX;
  const newY = e.clientY - controlsDragOffsetY;

  // Constrain to viewport (accounting for titlebar)
  const maxX = window.innerWidth - mainControls.offsetWidth;
  const maxY = window.innerHeight - mainControls.offsetHeight - 32; // 32px for titlebar

  const constrainedX = Math.max(0, Math.min(newX, maxX));
  const constrainedY = Math.max(32, Math.min(newY, maxY + 32)); // Below titlebar

  mainControls.style.left = constrainedX + 'px';
  mainControls.style.top = constrainedY + 'px';
}

function stopControlsDrag() {
  if (isControlsDragging) {
    isControlsDragging = false;
    mainControls.style.transition = 'opacity 0.3s ease';
  }
}

function handleMouseMove() {
  showControls();
  resetHideTimeout();
}

function showControls() {
  if (!isControlsVisible) {
    isControlsVisible = true;
    floatingBtn.classList.remove('fade-out');
    floatingBtn.classList.add('fade-in');
    mainControls.classList.remove('fade-out');
    mainControls.classList.add('fade-in');
  }
}

function hideControls() {
  if (isControlsVisible && !optionsPanel.classList.contains('hidden')) {
    return;
  }
  
  isControlsVisible = false;
  floatingBtn.classList.remove('fade-in');
  floatingBtn.classList.add('fade-out');
  mainControls.classList.remove('fade-in');
  mainControls.classList.add('fade-out');
}

function resetHideTimeout() {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
  }
  
  hideTimeout = setTimeout(() => {
    hideControls();
  }, 3000);
}

// Video Control Functions
function togglePlayPause() {
  if (videoPlayer.paused) {
    videoPlayer.play();
  } else {
    videoPlayer.pause();
  }
}

function updatePlayPauseButton() {
  if (isPlaying) {
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
  } else {
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
  }
}

function stopVideo() {
  videoPlayer.pause();
  videoPlayer.currentTime = 0;
  isPlaying = false;
  updatePlayPauseButton();
}

function seekVideo(seconds) {
  videoPlayer.currentTime += seconds;
}

function updateProgress() {
  if (videoPlayer.duration) {
    const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    progressBar.value = progress;
    currentTimeEl.textContent = formatTime(videoPlayer.currentTime);
    durationEl.textContent = formatTime(videoPlayer.duration);
  }
}

function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function onVideoLoaded() {
  durationEl.textContent = formatTime(videoPlayer.duration);
  infoDuration.textContent = formatTime(videoPlayer.duration);
  infoResolution.textContent = `${videoPlayer.videoWidth}x${videoPlayer.videoHeight}`;
  
  mainControls.classList.remove('hidden');
  welcomeScreen.classList.add('hidden');
}

function onVideoEnded() {
  if (currentIndex < playlistItems.length - 1) {
    playVideoAtIndex(currentIndex + 1);
  } else {
    isPlaying = false;
    updatePlayPauseButton();
  }
}

function onVideoError(e) {
  // Ignore video errors when not in video mode (image/audio mode)
  if (currentMediaType !== 'video') {
    console.log('Ignoring video error in non-video mode');
    return;
  }

  console.error('Video error:', e);
  isPlaying = false;
  updatePlayPauseButton();

  // Only try next if this is actually a video
  if (currentIndex < playlistItems.length - 1) {
    console.log('Trying next video...');
    playVideoAtIndex(currentIndex + 1);
  }
}

function onImageError(e) {
  console.error('Image error:', e);
  
  // Try to play next item if current one fails
  if (currentIndex < playlistItems.length - 1) {
    console.log('Trying next item...');
    playVideoAtIndex(currentIndex + 1);
  }
}

function onImageLoaded() {
  console.log('Image loaded successfully');
  // Keep mainControls hidden for images - only show floating button
  welcomeScreen.classList.add('hidden');
}

function setPlaybackSpeed(speed) {
  videoPlayer.playbackRate = speed;
  speedValue.textContent = speed.toFixed(1);
  
  speedBtns.forEach(btn => {
    btn.classList.remove('active');
    if (parseFloat(btn.dataset.speed) === speed) {
      btn.classList.add('active');
    }
  });
}

// Playlist Functions
async function addFolder() {
  const result = await ipcRenderer.invoke('select-folder');
  if (result) {
    const { folderPath, files } = result;
    const startIndex = playlistItems.length;
    files.forEach(file => {
      if (!playlistItems.includes(file)) {
        playlistItems.push(file);
      }
    });
    updatePlaylistUI();

    // Auto-play first file if playlist was empty
    if (startIndex === 0 && playlistItems.length > 0) {
      playVideoAtIndex(0);
    }
  }
}

async function addFiles() {
  const files = await ipcRenderer.invoke('select-files');
  if (files) {
    const startIndex = playlistItems.length;
    files.forEach(file => {
      if (!playlistItems.includes(file)) {
        playlistItems.push(file);
      }
    });
    updatePlaylistUI();

    // Auto-play first file if playlist was empty
    if (startIndex === 0 && playlistItems.length > 0) {
      playVideoAtIndex(0);
    }
  }
}

function clearPlaylist() {
  playlistItems = [];
  currentIndex = -1;
  updatePlaylistUI();
  
  // Stop current media
  videoPlayer.pause();
  videoPlayer.currentTime = 0;
  videoPlayer.src = '';
  imagePlayer.src = '';
  
  // Show welcome screen
  mainControls.classList.add('hidden');
  welcomeScreen.classList.remove('hidden');
  videoPlayer.classList.add('hidden');
  imagePlayer.classList.add('hidden');
  
  currentMediaType = null;
}

function updatePlaylistUI() {
  playlist.innerHTML = '';
  playlistItems.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = `playlist-item ${index === currentIndex ? 'active' : ''}`;
    item.innerHTML = `
      <span class="playlist-item-name">${getFileName(file)}</span>
      <button class="playlist-item-remove" data-index="${index}">×</button>
    `;
    
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('playlist-item-remove')) {
        playVideoAtIndex(index);
      }
    });
    
    const removeBtn = item.querySelector('.playlist-item-remove');
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromPlaylist(index);
    });
    
    playlist.appendChild(item);
  });
}

function getFileName(path) {
  return path.split('/').pop().split('\\').pop();
}

function playVideoAtIndex(index) {
  if (index >= 0 && index < playlistItems.length) {
    currentIndex = index;
    loadVideo(playlistItems[index]);
    updatePlaylistUI();
  }
}

function getMediaType(filePath) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif', '.tiff', '.svg'];
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma'];
  const ext = path.extname(filePath).toLowerCase();
  if (imageExtensions.includes(ext)) return 'image';
  if (audioExtensions.includes(ext)) return 'audio';
  return 'video';
}

function loadVideo(filePath) {
  console.log('=== LOAD MEDIA START ===');
  console.log('File path:', filePath);
  
  const mediaType = getMediaType(filePath);
  currentMediaType = mediaType;
  console.log('Media type:', mediaType);
  
  // Hide both elements first
  videoPlayer.classList.add('hidden');
  imagePlayer.classList.add('hidden');
  
  // Stop video if playing
  videoPlayer.pause();
  videoPlayer.currentTime = 0;
  videoPlayer.src = '';
  
  if (mediaType === 'image') {
    // Load image
    console.log('Loading image:', filePath);
    const mediaUrl = 'media://' + encodeURIComponent(filePath);
    console.log('Image media URL:', mediaUrl);
    imagePlayer.src = mediaUrl;
    imagePlayer.classList.remove('hidden');

    // Only stop slideshow if not currently running (i.e., manual navigation)
    // Don't stop it when slideshow is navigating
    if (!isSlideshowRunning) {
      stopSlideshow();
    }

    // Reset image transform state
    imageZoom = 1;
    imageRotation = 0;
    imagePanX = 0;
    imagePanY = 0;
    updateImageTransform();

    // Hide all controls except floating button
    mainControls.classList.add('hidden');
    welcomeScreen.classList.add('hidden');

    updateVideoInfo(filePath);
  } else if (mediaType === 'audio') {
    // Load audio
    console.log('Loading audio:', filePath);
    const mediaUrl = 'media://' + encodeURIComponent(filePath);
    console.log('Audio media URL:', mediaUrl);
    videoPlayer.src = mediaUrl;
    videoPlayer.classList.remove('hidden');

    // Hide video-specific controls (progress, forward/backward)
    forwardBtn.classList.add('hidden');
    backwardBtn.classList.add('hidden');
    progressBar.classList.add('hidden');
    currentTimeEl.classList.add('hidden');
    durationEl.classList.add('hidden');

    // Show audio-specific controls (play/pause, stop, volume)
    playPauseBtn.classList.remove('hidden');
    stopBtn.classList.remove('hidden');

    mainControls.classList.remove('hidden');
    welcomeScreen.classList.add('hidden');

    videoPlayer.load();
    videoPlayer.play().then(() => {
      console.log('Audio play() succeeded');
    }).catch(err => {
      console.error('Error playing audio:', err);
    });

    updateVideoInfo(filePath);
  } else {
    // Load video
    console.log('Loading video:', filePath);
    const mediaUrl = 'media://' + encodeURIComponent(filePath);
    console.log('Video media URL:', mediaUrl);
    videoPlayer.src = mediaUrl;
    videoPlayer.classList.remove('hidden');

    // Show video-specific controls
    playPauseBtn.classList.remove('hidden');
    stopBtn.classList.remove('hidden');
    forwardBtn.classList.remove('hidden');
    backwardBtn.classList.remove('hidden');
    progressBar.classList.remove('hidden');
    currentTimeEl.classList.remove('hidden');
    durationEl.classList.remove('hidden');
    
    videoPlayer.load();
    
    videoPlayer.play().then(() => {
      console.log('Video play() succeeded');
    }).catch(err => {
      console.error('Error playing video:', err);
    });
    
    updateVideoInfo(filePath);
  }
  
  if (!playlistItems.includes(filePath)) {
    playlistItems.push(filePath);
    currentIndex = playlistItems.length - 1;
    updatePlaylistUI();
  } else {
    currentIndex = playlistItems.indexOf(filePath);
    updatePlaylistUI();
  }
  
  console.log('=== LOAD MEDIA END ===');
}

async function updateVideoInfo(filePath) {
  const info = await ipcRenderer.invoke('get-file-info', filePath);
  if (info) {
    infoName.textContent = info.name;
    infoPath.textContent = info.path;
    infoSize.textContent = info.sizeFormatted;
  }
}

function removeFromPlaylist(index) {
  playlistItems.splice(index, 1);
  
  if (index === currentIndex) {
    if (playlistItems.length > 0) {
      const newIndex = Math.min(index, playlistItems.length - 1);
      playVideoAtIndex(newIndex);
    } else {
      stopVideo();
      videoPlayer.src = '';
      mainControls.classList.add('hidden');
      welcomeScreen.classList.remove('hidden');
      currentIndex = -1;
    }
  } else if (index < currentIndex) {
    currentIndex--;
  }
  
  updatePlaylistUI();
}

// Keyboard Shortcuts
function handleKeyboard(e) {
  if (e.target.tagName === 'INPUT') return;

  // Image-specific shortcuts
  if (currentMediaType === 'image') {
    switch(e.key) {
      case 'ArrowLeft':
        if (e.shiftKey) {
          // Rotate left
          e.preventDefault();
          imageRotation -= 90;
          updateImageTransform();
        } else {
          // Previous image
          e.preventDefault();
          navigateImage(-1);
        }
        break;
      case 'ArrowRight':
        if (e.shiftKey) {
          // Rotate right
          e.preventDefault();
          imageRotation += 90;
          updateImageTransform();
        } else {
          // Next image
          e.preventDefault();
          navigateImage(1);
        }
        break;
      case 'a':
      case 'A':
        if (e.shiftKey && e.ctrlKey) {
          // Shift + Ctrl + A - Add folder
          e.preventDefault();
          addFolder();
        } else if (e.shiftKey) {
          // Shift + A - Add files
          e.preventDefault();
          addFiles();
        } else {
          // Previous image
          e.preventDefault();
          navigateImage(-1);
        }
        break;
      case 's':
        e.preventDefault();
        navigateImage(1);
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
        imageZoom = 1;
        imageRotation = 0;
        imagePanX = 0;
        imagePanY = 0;
        updateImageTransform();
        break;
      case ' ':
        // Toggle slideshow
        e.preventDefault();
        toggleSlideshow();
        break;
    }
    return;
  }

  // Video-specific shortcuts
  switch(e.key) {
    case ' ':
      e.preventDefault();
      togglePlayPause();
      break;
    case 'ArrowLeft':
      seekVideo(-5);
      break;
    case 'ArrowRight':
      seekVideo(5);
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
        addFolder();
      } else if (e.shiftKey) {
        // Shift + A - Add files
        e.preventDefault();
        addFiles();
      }
      break;
  }
}

// Inverse Scrollbar
function setupInverseScrollbar() {
  const scrollableElements = document.querySelectorAll('.playlist, .panel-content');
  
  scrollableElements.forEach(element => {
    element.addEventListener('wheel', (e) => {
      const maxScrollLeft = element.scrollWidth - element.clientWidth;
      const maxScrollTop = element.scrollHeight - element.clientHeight;
      
      if (e.deltaY !== 0) {
        const newScrollLeft = element.scrollLeft - e.deltaY;
        element.scrollLeft = Math.max(0, Math.min(newScrollLeft, maxScrollLeft));
        e.preventDefault();
      }
    }, { passive: false });
  });
}

setTimeout(setupInverseScrollbar, 100);

// Console Functions
function toggleConsole() {
  isConsoleEnabled = consoleToggle.checked;
  
  if (isConsoleEnabled) {
    // Override console methods
    console.log = (...args) => {
      originalConsole.log(...args);
      addLogEntry('log', args);
    };
    console.error = (...args) => {
      originalConsole.error(...args);
      addLogEntry('error', args);
    };
    console.warn = (...args) => {
      originalConsole.warn(...args);
      addLogEntry('warn', args);
    };
    console.info = (...args) => {
      originalConsole.info(...args);
      addLogEntry('info', args);
    };
    addLogEntry('info', ['Consola de depuración activada']);
  } else {
    // Restore original console methods
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
  }
}

function addLogEntry(type, args) {
  const timestamp = new Date().toLocaleTimeString();
  const message = args.map(arg => {
    if (typeof arg === 'object') {
      return JSON.stringify(arg, null, 2);
    }
    return String(arg);
  }).join(' ');
  
  consoleLogs.push({ timestamp, type, message });
  
  if (isConsoleEnabled) {
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.innerHTML = `<span class="log-time">[${timestamp}]</span>${escapeHtml(message)}`;
    debugConsole.appendChild(entry);
    debugConsole.scrollTop = debugConsole.scrollHeight;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function copyLogs() {
  const text = consoleLogs.map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`).join('\n');
  navigator.clipboard.writeText(text).then(() => {
    addLogEntry('info', ['Logs copiados al portapapeles']);
  }).catch(err => {
    originalConsole.error('Error copying logs:', err);
  });
}

function clearLogs() {
  consoleLogs = [];
  debugConsole.innerHTML = '';
  addLogEntry('info', ['Consola limpiada']);
}

// Slideshow functions
function toggleSlideshow() {
  if (isSlideshowRunning) {
    stopSlideshow();
  } else {
    startSlideshow();
  }
}

function startSlideshow() {
  if (playlistItems.length <= 1) {
    console.log('Not enough images for slideshow');
    return;
  }

  isSlideshowRunning = true;
  console.log('Starting slideshow');

  slideshowInterval = setInterval(() => {
    navigateImage(1, true); // true = this is slideshow navigation
  }, 6000); // 6 seconds
}

function stopSlideshow() {
  isSlideshowRunning = false;
  console.log('Stopping slideshow');

  if (slideshowInterval) {
    clearInterval(slideshowInterval);
    slideshowInterval = null;
  }
}

// Image viewer functions
function navigateImage(direction, isSlideshowNavigation = false) {
  if (playlistItems.length === 0) return;

  // Stop slideshow when navigating manually (not from slideshow)
  if (!isSlideshowNavigation) {
    stopSlideshow();
  }

  let newIndex = currentIndex + direction;
  if (newIndex < 0) newIndex = playlistItems.length - 1;
  if (newIndex >= playlistItems.length) newIndex = 0;

  playVideoAtIndex(newIndex);
}

function updateImageTransform() {
  imagePlayer.style.transform = `scale(${imageZoom}) rotate(${imageRotation}deg) translate(${imagePanX}px, ${imagePanY}px)`;
}

function handleWheel(e) {
  if (currentMediaType === 'image') {
    if (isScrollPressed) {
      // Pan with scroll wheel pressed
      e.preventDefault();
      imagePanX -= e.deltaX;
      imagePanY -= e.deltaY;
      updateImageTransform();
    } else {
      // Zoom with scroll
      e.preventDefault();
      const zoomSpeed = 0.1;
      if (e.deltaY < 0) {
        // Scroll up - zoom in
        imageZoom = Math.min(imageZoom + zoomSpeed, 10);
      } else {
        // Scroll down - zoom out
        imageZoom = Math.max(imageZoom - zoomSpeed, 0.1);
      }
      updateImageTransform();
    }
  } else if (currentMediaType === 'video' || currentMediaType === 'audio') {
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

function handleMouseDown(e) {
  if (e.button === 1) { // Middle mouse button (scroll wheel)
    isScrollPressed = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    e.preventDefault();
  }
}

function handleMouseUp(e) {
  if (e.button === 1) {
    isScrollPressed = false;
  }
}

function handleMouseMovePan(e) {
  if (isScrollPressed && currentMediaType === 'image') {
    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;
    imagePanX += deltaX;
    imagePanY += deltaY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    updateImageTransform();
  }
}

init();
