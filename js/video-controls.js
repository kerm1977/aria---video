// Video Control Functions
global.togglePlayPause = function() {
  if (videoPlayer.paused) {
    videoPlayer.play();
  } else {
    videoPlayer.pause();
  }
}

global.updatePlayPauseButton = function() {
  if (global.isPlaying) {
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
  } else {
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
  }
}

global.stopVideo = function() {
  videoPlayer.pause();
  videoPlayer.currentTime = 0;
  global.isPlaying = false;
  global.updatePlayPauseButton();
}

global.seekVideo = function(seconds) {
  videoPlayer.currentTime += seconds;
}

global.updateProgress = function() {
  if (videoPlayer.duration) {
    const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    progressBar.value = progress;
    currentTimeEl.textContent = global.formatTime(videoPlayer.currentTime);
    durationEl.textContent = global.formatTime(videoPlayer.duration);
  }
}

global.formatTime = function(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

global.onVideoLoaded = function() {
  durationEl.textContent = global.formatTime(videoPlayer.duration);
  infoDuration.textContent = global.formatTime(videoPlayer.duration);
  infoResolution.textContent = `${videoPlayer.videoWidth}x${videoPlayer.videoHeight}`;
  
  mainControls.classList.remove('hidden');
  welcomeScreen.classList.add('hidden');
}

global.onVideoEnded = function() {
  if (global.currentIndex < global.playlistItems.length - 1) {
    global.playVideoAtIndex(global.currentIndex + 1);
  } else {
    global.isPlaying = false;
    global.updatePlayPauseButton();
  }
}

global.onVideoError = function(e) {
  // Ignore video errors when not in video mode (image/audio mode)
  if (global.currentMediaType !== 'video') {
    console.log('Ignoring video error in non-video mode');
    return;
  }

  console.error('Video error:', e);
  global.isPlaying = false;
  global.updatePlayPauseButton();

  // Only try next if this is actually a video
  if (global.currentIndex < global.playlistItems.length - 1) {
    console.log('Trying next video...');
    global.playVideoAtIndex(currentIndex + 1);
  }
}

global.setPlaybackSpeed = function(speed) {
  videoPlayer.playbackRate = speed;
  speedValue.textContent = speed.toFixed(1);
  
  speedBtns.forEach(btn => {
    btn.classList.remove('active');
    if (parseFloat(btn.dataset.speed) === speed) {
      btn.classList.add('active');
    }
  });
}

global.handleSpeedSlider = function() {
  const speed = parseFloat(speedSlider.value);
  global.setPlaybackSpeed(speed);
}

global.handleSpeedBtn = function(e) {
  const speed = parseFloat(e.target.dataset.speed);
  speedSlider.value = speed;
  global.setPlaybackSpeed(speed);
}

global.handleProgressChange = function() {
  const time = (progressBar.value / 100) * videoPlayer.duration;
  videoPlayer.currentTime = time;
}

global.handleVolumeChange = function() {
  videoPlayer.volume = volumeSlider.value;
}
