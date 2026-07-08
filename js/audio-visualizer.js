// Audio Visualizer and Playback Controls

let audioContext;
let analyser;
let dataArray;
let source;
let animationId;

// Playback state
global.isShuffle = false;
global.repeatMode = 'none'; // 'none', 'all', 'one'
global.loopA = null;
global.loopB = null;

// Initialize audio visualizer
function initAudioVisualizer() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      
      source = audioContext.createMediaElementSource(videoPlayer);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      console.log('Audio visualizer initialized');
    } catch (e) {
      console.error('Error initializing audio visualizer:', e);
    }
  }
}

// Draw audio visualizer
function drawVisualizer() {
  const canvas = document.getElementById('audioVisualizer');
  const ctx = canvas.getContext('2d');
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  function draw() {
    animationId = requestAnimationFrame(draw);
    
    analyser.getByteFrequencyData(dataArray);
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = (canvas.width / dataArray.length) * 2.5;
    let barHeight;
    let x = 0;
    
    for (let i = 0; i < dataArray.length; i++) {
      barHeight = dataArray[i] * 2;
      
      // Neon colors
      const hue = (i / dataArray.length) * 360;
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.shadowBlur = 20;
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
      
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      
      x += barWidth + 1;
    }
  }
  
  draw();
}

// Stop visualizer
function stopVisualizer() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

// Show/hide audio visualizer
function showAudioVisualizer(show) {
  const canvas = document.getElementById('audioVisualizer');
  const songTitle = document.getElementById('songTitle');
  
  if (show) {
    canvas.classList.remove('hidden');
    songTitle.classList.remove('hidden');
    initAudioVisualizer();
    drawVisualizer();
    
    // Show song title
    if (global.playlistItems[global.currentIndex]) {
      songTitle.textContent = global.getFileName(global.playlistItems[global.currentIndex]);
    }
  } else {
    canvas.classList.add('hidden');
    songTitle.classList.add('hidden');
    stopVisualizer();
  }
}

// Shuffle playlist
global.toggleShuffle = function() {
  global.isShuffle = !global.isShuffle;
  const shuffleBtn = document.getElementById('shuffleBtn');
  
  if (global.isShuffle) {
    shuffleBtn.classList.add('active');
  } else {
    shuffleBtn.classList.remove('active');
  }
}

// Repeat mode
global.toggleRepeat = function() {
  const modes = ['none', 'all', 'one'];
  const currentIndex = modes.indexOf(global.repeatMode);
  global.repeatMode = modes[(currentIndex + 1) % modes.length];
  
  const repeatBtn = document.getElementById('repeatBtn');
  repeatBtn.classList.remove('active');
  
  if (global.repeatMode === 'all') {
    repeatBtn.classList.add('active');
  } else if (global.repeatMode === 'one') {
    repeatBtn.classList.add('active');
    repeatBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path><text x="12" y="16" text-anchor="middle" font-size="8" fill="currentColor">1</text></svg>';
  } else {
    repeatBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>';
  }
}

// Set loop point A
global.setLoopA = function() {
  global.loopA = videoPlayer.currentTime;
  const loopABtn = document.getElementById('loopABtn');
  loopABtn.classList.add('loop-a-active');
  console.log('Loop A set at:', global.loopA);
}

// Set loop point B
global.setLoopB = function() {
  global.loopB = videoPlayer.currentTime;
  const loopBBtn = document.getElementById('loopBBtn');
  loopBBtn.classList.add('loop-b-active');
  console.log('Loop B set at:', global.loopB);
}

// Clear loop A-B
global.clearLoopAB = function() {
  global.loopA = null;
  global.loopB = null;
  const loopABtn = document.getElementById('loopABtn');
  const loopBBtn = document.getElementById('loopBBtn');
  loopABtn.classList.remove('loop-a-active');
  loopBBtn.classList.remove('loop-b-active');
  console.log('Loop A-B cleared');
}

// Handle loop A-B during playback
videoPlayer.addEventListener('timeupdate', function() {
  if (global.loopA !== null && global.loopB !== null) {
    if (videoPlayer.currentTime >= global.loopB) {
      videoPlayer.currentTime = global.loopA;
      videoPlayer.play();
    }
  }
});

// Get next index with shuffle/repeat
global.getNextIndex = function(currentIndex) {
  if (global.playlistItems.length === 0) return -1;
  
  if (global.repeatMode === 'one') {
    return currentIndex;
  }
  
  if (global.isShuffle) {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * global.playlistItems.length);
    } while (nextIndex === currentIndex && global.playlistItems.length > 1);
    return nextIndex;
  }
  
  let nextIndex = currentIndex + 1;
  if (nextIndex >= global.playlistItems.length) {
    if (global.repeatMode === 'all') {
      nextIndex = 0;
    } else {
      return -1; // End of playlist
    }
  }
  return nextIndex;
}

// Get previous index with shuffle/repeat
global.getPreviousIndex = function(currentIndex) {
  if (global.playlistItems.length === 0) return -1;
  
  if (global.repeatMode === 'one') {
    return currentIndex;
  }
  
  if (global.isShuffle) {
    let prevIndex;
    do {
      prevIndex = Math.floor(Math.random() * global.playlistItems.length);
    } while (prevIndex === currentIndex && global.playlistItems.length > 1);
    return prevIndex;
  }
  
  let prevIndex = currentIndex - 1;
  if (prevIndex < 0) {
    if (global.repeatMode === 'all') {
      prevIndex = global.playlistItems.length - 1;
    } else {
      return -1; // Beginning of playlist
    }
  }
  return prevIndex;
}

// Update navigatePlaylist to use shuffle/repeat
global.navigatePlaylist = function(direction) {
  if (global.playlistItems.length === 0) return;
  
  let newIndex;
  if (direction > 0) {
    newIndex = global.getNextIndex(global.currentIndex);
  } else {
    newIndex = global.getPreviousIndex(global.currentIndex);
  }
  
  if (newIndex >= 0 && newIndex < global.playlistItems.length) {
    global.playVideoAtIndex(newIndex, true);
  }
}

// Handle media end with repeat - only for audio, not for images
videoPlayer.addEventListener('ended', function() {
  // Only auto-advance for audio, not for videos or images
  if (global.currentMediaType !== 'audio') {
    return;
  }
  
  if (global.repeatMode === 'one') {
    videoPlayer.currentTime = 0;
    videoPlayer.play();
  } else {
    const nextIndex = global.getNextIndex(global.currentIndex);
    if (nextIndex >= 0) {
      global.playVideoAtIndex(nextIndex, true);
    }
  }
});
