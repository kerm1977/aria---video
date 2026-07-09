// Media loading functions
global.getMediaType = function(filePath) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif', '.tiff', '.svg'];
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma'];
  const ext = path.extname(filePath).toLowerCase();
  if (imageExtensions.includes(ext)) return 'image';
  if (audioExtensions.includes(ext)) return 'audio';
  return 'video';
}

global.loadVideo = function(filePath, forceSameWindow = false) {
  console.log('=== LOAD MEDIA START ===');
  console.log('File path:', filePath);
  console.log('forceSameWindow:', forceSameWindow);
  
  const mediaType = global.getMediaType(filePath);
  console.log('Media type:', mediaType);

  // Check if media is currently playing, if so open in new window (unless forced to use same window)
  const isMediaPlaying = !videoPlayer.paused || global.currentMediaType === 'image' || global.currentMediaType === 'audio';
  console.log('isMediaPlaying:', isMediaPlaying);
  console.log('currentMediaType:', global.currentMediaType);
  console.log('videoPlayer.paused:', videoPlayer.paused);
  
  if (isMediaPlaying && global.currentMediaType !== null && !forceSameWindow) {
    console.log('Media is currently playing, opening in new window');
    ipcRenderer.send('open-new-window', filePath);
    return;
  }

  global.currentMediaType = mediaType;
  global.isTranscoding = false;
  
  // When forcing same window, just reset the player state without waiting for pause
  if (forceSameWindow) {
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
    videoPlayer.src = '';
  }
  
  // Hide both elements first
  videoPlayer.classList.add('hidden');
  imagePlayer.classList.add('hidden');
  
  // Stop video if playing - use a promise to wait for pause to complete
  const pausePromise = videoPlayer.pause();
  if (pausePromise !== undefined) {
    pausePromise.then(() => {
      videoPlayer.currentTime = 0;
      videoPlayer.src = '';
    }).catch(() => {
      // Ignore pause errors
      videoPlayer.currentTime = 0;
      videoPlayer.src = '';
    });
  } else {
    videoPlayer.currentTime = 0;
    videoPlayer.src = '';
  }
  
  // Remove image error listener temporarily
  imagePlayer.onerror = null;
  
  if (mediaType === 'image') {
    // Load image
    console.log('Loading image:', filePath);
    const mediaUrl = 'media://' + encodeURIComponent(filePath);
    console.log('Image media URL:', mediaUrl);
    
    // Stop audio/video playback completely
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
    videoPlayer.src = '';
    
    // Hide audio visualizer and stop it
    showAudioVisualizer(false);
    
    // Stop any slideshow
    global.stopSlideshow();
    
    imagePlayer.src = mediaUrl;
    imagePlayer.classList.remove('hidden');

    // Restore image error listener
    imagePlayer.onerror = global.onImageError;

    // Reset image transform state
    global.imageZoom = 1;
    global.imageRotation = 0;
    global.imagePanX = 0;
    global.imagePanY = 0;
    global.updateImageTransform();

    // Hide all controls except floating button
    mainControls.classList.add('hidden');
    welcomeScreen.classList.add('hidden');
    
    // Hide navigation buttons
    previousBtn.classList.add('hidden');
    nextBtn.classList.add('hidden');

    global.updateVideoInfo(filePath);
  } else if (mediaType === 'audio') {
    // Load audio
    console.log('Loading audio:', filePath);
    const mediaUrl = 'media://' + encodeURIComponent(filePath);
    console.log('Audio media URL:', mediaUrl);
    
    // Stop slideshow
    global.stopSlideshow();
    
    videoPlayer.src = mediaUrl;
    videoPlayer.classList.remove('hidden');

    // Hide video-specific controls (forward/backward only)
    forwardBtn.classList.add('hidden');
    backwardBtn.classList.add('hidden');
    // Show progress bar for audio
    progressBar.classList.remove('hidden');
    currentTimeEl.classList.remove('hidden');
    durationEl.classList.remove('hidden');

    // Show audio-specific controls (play/pause, stop, volume, next/previous, shuffle, repeat, loop)
    playPauseBtn.classList.remove('hidden');
    stopBtn.classList.remove('hidden');
    previousBtn.classList.remove('hidden');
    nextBtn.classList.remove('hidden');
    document.getElementById('shuffleBtn').classList.remove('hidden');
    document.getElementById('repeatBtn').classList.remove('hidden');
    document.getElementById('loopABtn').classList.remove('hidden');
    document.getElementById('loopBBtn').classList.remove('hidden');

    mainControls.classList.remove('hidden');
    welcomeScreen.classList.add('hidden');

    // Show audio visualizer
    showAudioVisualizer(true);

    videoPlayer.load();
    
    // Wait for pause to complete before playing
    const playPromise = videoPlayer.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log('Audio play() succeeded');
      }).catch(err => {
        console.error('Error playing audio:', err);
      });
    }

    global.updateVideoInfo(filePath);
  } else {
    // Load video
    console.log('Loading video:', filePath);
    
    // Stop slideshow
    global.stopSlideshow();
    
    // Hide image player
    imagePlayer.classList.add('hidden');
    imagePlayer.src = '';
    
    // Check if file is MKV and needs transcoding
    const ext = filePath.toLowerCase().split('.').pop();
    if (ext === 'mkv') {
      console.log('MKV file detected, starting instantaneous FFmpeg stream');
      global.isTranscoding = false; // We stream it instantly, no need to block
      
      // Stop any existing FFmpeg process
      if (window.electronAPI) {
        window.electronAPI.stopFFmpeg();
      }
      
      // Start FFmpeg transcode
      window.electronAPI.startFFmpegTranscode(filePath).then(result => {
        console.log('FFmpeg stream result:', result);
        const mediaUrl = result.url;
        console.log('Video media URL:', mediaUrl);
        
        videoPlayer.src = mediaUrl;
        videoPlayer.classList.remove('hidden');

        // Get video duration for display only (not for forcing videoPlayer.duration)
        window.electronAPI.getVideoDuration(filePath).then(duration => {
          if (duration) {
            console.log('Video duration from ffprobe:', duration);
            // Store duration for display purposes only
            global.videoDuration = duration;
          }
        });

        // Show video-specific controls (including shuffle, repeat, loop)
        playPauseBtn.classList.remove('hidden');
        stopBtn.classList.remove('hidden');
        forwardBtn.classList.remove('hidden');
        backwardBtn.classList.remove('hidden');
        previousBtn.classList.remove('hidden');
        nextBtn.classList.remove('hidden');
        progressBar.classList.remove('hidden');
        currentTimeEl.classList.remove('hidden');
        durationEl.classList.remove('hidden');
        document.getElementById('shuffleBtn').classList.remove('hidden');
        document.getElementById('repeatBtn').classList.remove('hidden');
        document.getElementById('loopABtn').classList.remove('hidden');
        document.getElementById('loopBBtn').classList.remove('hidden');
        
        // Hide audio visualizer
        showAudioVisualizer(false);
        
        videoPlayer.load();
        
        // Wait for pause to complete before playing
        const playPromise = videoPlayer.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('Video play() succeeded');
          }).catch(err => {
            console.error('Error playing video:', err);
          });
        }
        mainControls.classList.remove('hidden');
        welcomeScreen.classList.add('hidden');
        global.updateVideoInfo(filePath);
      }).catch(err => {
        console.error('FFmpeg transcode error:', err);
        
        // Fallback to direct loading
        const mediaUrl = 'media://' + encodeURIComponent(filePath);
        videoPlayer.src = mediaUrl;
        videoPlayer.classList.remove('hidden');

        // Show video-specific controls (including shuffle, repeat, loop)
        playPauseBtn.classList.remove('hidden');
        stopBtn.classList.remove('hidden');
        forwardBtn.classList.remove('hidden');
        backwardBtn.classList.remove('hidden');
        previousBtn.classList.remove('hidden');
        nextBtn.classList.remove('hidden');
        progressBar.classList.remove('hidden');
        currentTimeEl.classList.remove('hidden');
        durationEl.classList.remove('hidden');
        document.getElementById('shuffleBtn').classList.remove('hidden');
        document.getElementById('repeatBtn').classList.remove('hidden');
        document.getElementById('loopABtn').classList.remove('hidden');
        document.getElementById('loopBBtn').classList.remove('hidden');
        
        // Hide audio visualizer
        showAudioVisualizer(false);
        
        videoPlayer.load();
        
        // Wait for pause to complete before playing
        const playPromise = videoPlayer.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('Video play() succeeded');
          }).catch(err => {
            console.error('Error playing video:', err);
          });
        }
        mainControls.classList.remove('hidden');
        welcomeScreen.classList.add('hidden');
        global.updateVideoInfo(filePath);
      });
    } else {
      // Load directly for non-MKV videos
      const mediaUrl = 'media://' + encodeURIComponent(filePath);
      console.log('Video media URL:', mediaUrl);
      
      videoPlayer.src = mediaUrl;
      videoPlayer.classList.remove('hidden');

      // Show video-specific controls (including shuffle, repeat, loop)
      playPauseBtn.classList.remove('hidden');
      stopBtn.classList.remove('hidden');
      forwardBtn.classList.remove('hidden');
      backwardBtn.classList.remove('hidden');
      previousBtn.classList.remove('hidden');
      nextBtn.classList.remove('hidden');
      progressBar.classList.remove('hidden');
      currentTimeEl.classList.remove('hidden');
      durationEl.classList.remove('hidden');
      document.getElementById('shuffleBtn').classList.remove('hidden');
      document.getElementById('repeatBtn').classList.remove('hidden');
      document.getElementById('loopABtn').classList.remove('hidden');
      document.getElementById('loopBBtn').classList.remove('hidden');
      
      // Hide audio visualizer
      showAudioVisualizer(false);
      
      videoPlayer.load();
      
      // Wait for pause to complete before playing
      const playPromise = videoPlayer.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('Video play() succeeded');
        }).catch(err => {
          console.error('Error playing video:', err);
        });
      }
      mainControls.classList.remove('hidden');
      welcomeScreen.classList.add('hidden');
      global.updateVideoInfo(filePath);
    }
  }
  console.log('=== LOAD MEDIA END ===');
}

global.playVideoAtIndex = function(index, forceSameWindow = false) {
  if (index >= 0 && index < global.playlistItems.length) {
    global.currentIndex = index;
    global.loadVideo(global.playlistItems[index], forceSameWindow);
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
