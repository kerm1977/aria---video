// Media loading functions
global.getMediaType = function(filePath) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif', '.tiff', '.svg'];
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma'];
  const ext = path.extname(filePath).toLowerCase();
  if (imageExtensions.includes(ext)) return 'image';
  if (audioExtensions.includes(ext)) return 'audio';
  return 'video';
}

global.loadVideo = function(filePath) {
  console.log('=== LOAD MEDIA START ===');
  console.log('File path:', filePath);
  
  const mediaType = global.getMediaType(filePath);
  global.currentMediaType = mediaType;
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
    if (!global.isSlideshowRunning) {
      global.stopSlideshow();
    }

    // Reset image transform state
    global.imageZoom = 1;
    global.imageRotation = 0;
    global.imagePanX = 0;
    global.imagePanY = 0;
    global.updateImageTransform();

    // Hide all controls except floating button
    mainControls.classList.add('hidden');
    welcomeScreen.classList.add('hidden');

    global.updateVideoInfo(filePath);
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

    global.updateVideoInfo(filePath);
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
    mainControls.classList.remove('hidden');
    welcomeScreen.classList.add('hidden');
    global.updateVideoInfo(filePath);
  }
  console.log('=== LOAD MEDIA END ===');
}

global.playVideoAtIndex = function(index) {
  if (index >= 0 && index < global.playlistItems.length) {
    global.currentIndex = index;
    global.loadVideo(global.playlistItems[index]);
    global.updatePlaylistUI();
  }
}

global.updateVideoInfo = function(filePath) {
  infoName.textContent = global.getFileName(filePath);
  infoPath.textContent = filePath;
  
  ipcRenderer.invoke('get-file-info', filePath).then(info => {
    infoSize.textContent = global.formatFileSize(info.size);
  }).catch(err => {
    console.error('Error getting file info:', err);
  });
}

global.formatFileSize = function(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
