const { ipcRenderer } = require('electron');
const path = require('path');

// Load modules (they define global functions)
require('./js/state');
require('./js/video-controls');
require('./js/playlist');
require('./js/media-loader');
require('./js/image-viewer');
require('./js/ui-controls');
require('./js/keyboard-shortcuts');
require('./js/console');

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
const previousBtn = document.getElementById('previousBtn');
const nextBtn = document.getElementById('nextBtn');
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

// Initialize
function init() {
  setupEventListeners();
  global.updatePlayPauseButton();
  global.setupInverseScrollbar();
  global.setupSearch();
}

function setupEventListeners() {
  floatingBtn.addEventListener('click', global.toggleOptionsPanel);
  closePanel.addEventListener('click', () => optionsPanel.classList.add('hidden'));

  playPauseBtn.addEventListener('click', global.togglePlayPause);
  stopBtn.addEventListener('click', global.stopVideo);
  forwardBtn.addEventListener('click', () => global.seekVideo(10));
  backwardBtn.addEventListener('click', () => global.seekVideo(-10));
  previousBtn.addEventListener('click', () => global.navigatePlaylist(-1));
  nextBtn.addEventListener('click', () => global.navigatePlaylist(1));

  videoPlayer.addEventListener('timeupdate', global.updateProgress);
  videoPlayer.addEventListener('loadedmetadata', global.onVideoLoaded);
  videoPlayer.addEventListener('ended', global.onVideoEnded);
  videoPlayer.addEventListener('error', global.onVideoError);
  videoPlayer.addEventListener('play', () => {
    global.isPlaying = true;
    global.updatePlayPauseButton();
  });
  videoPlayer.addEventListener('pause', () => {
    global.isPlaying = false;
    global.updatePlayPauseButton();
  });

  imagePlayer.addEventListener('error', global.onImageError);
  imagePlayer.addEventListener('load', global.onImageLoaded);

  progressBar.addEventListener('input', global.handleProgressChange);
  volumeSlider.addEventListener('input', global.handleVolumeChange);
  speedSlider.addEventListener('input', global.handleSpeedSlider);

  speedBtns.forEach(btn => {
    btn.addEventListener('click', global.handleSpeedBtn);
  });

  addFolderBtn.addEventListener('click', global.addFolder);
  addFilesBtn.addEventListener('click', global.addFiles);
  clearPlaylistBtn.addEventListener('click', global.clearPlaylist);

  ipcRenderer.on('open-file', (event, filePath) => {
    global.loadVideo(filePath);
  });

  document.addEventListener('keydown', global.handleKeyboard);
  document.addEventListener('mousemove', global.handleMouseMove);
  document.addEventListener('click', global.handleMouseMove);

  // Image viewer mouse events
  document.addEventListener('wheel', global.handleWheel, { passive: false });
  document.addEventListener('mousedown', global.handleMouseDown);
  document.addEventListener('mouseup', global.handleMouseUp);
  document.addEventListener('mousemove', global.handleMouseMovePan);

  // Console controls
  consoleToggle.addEventListener('change', global.toggleConsole);
  copyConsole.addEventListener('click', global.copyLogs);
  clearConsole.addEventListener('click', global.clearLogs);

  // Collapse buttons
  document.querySelectorAll('.collapse-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const section = btn.dataset.section;
      global.toggleSection(section, btn);
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

  // Section header click
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', () => {
      const btn = header.querySelector('.collapse-btn');
      const section = btn.dataset.section;
      global.toggleSection(section, btn);
    });
  });

  // Double click on image player for fullscreen toggle + slideshow
  imagePlayer.addEventListener('dblclick', () => {
    if (global.currentMediaType === 'image') {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        global.stopSlideshow();
      } else {
        document.documentElement.requestFullscreen();
        if (!global.isSlideshowRunning) {
          global.startSlideshow();
        }
      }
    }
  });

  // Double click on video player for fullscreen toggle
  videoPlayer.addEventListener('dblclick', () => {
    if (global.currentMediaType === 'video' || global.currentMediaType === 'audio') {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    }
  });

  // Main controls dragging
  mainControls.addEventListener('mousedown', global.startControlsDrag);
  document.addEventListener('mousemove', global.dragControls);
  document.addEventListener('mouseup', global.stopControlsDrag);
}

// Start app
init();
