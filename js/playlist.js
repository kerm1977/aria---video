// Playlist Functions
global.addFolder = async function() {
  const result = await ipcRenderer.invoke('select-folder');
  if (result) {
    const { folderPath, files } = result;
    const startIndex = global.playlistItems.length;
    files.forEach(file => {
      if (!global.playlistItems.includes(file)) {
        global.playlistItems.push(file);
      }
    });
    global.updatePlaylistUI();

    // Auto-play first file from new folder
    if (global.playlistItems.length > 0) {
      global.playVideoAtIndex(startIndex);
    }
  }
}

global.addFiles = async function() {
  const files = await ipcRenderer.invoke('select-files');
  if (files) {
    const startIndex = global.playlistItems.length;
    files.forEach(file => {
      if (!global.playlistItems.includes(file)) {
        global.playlistItems.push(file);
      }
    });
    global.updatePlaylistUI();

    // Auto-play first file from new files
    if (global.playlistItems.length > 0) {
      global.playVideoAtIndex(startIndex);
    }
  }
}

global.clearPlaylist = function() {
  global.playlistItems = [];
  global.currentIndex = -1;
  global.updatePlaylistUI();
  
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
  
  global.currentMediaType = null;
}

global.updatePlaylistUI = function() {
  playlist.innerHTML = '';
  global.playlistItems.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = `playlist-item ${index === global.currentIndex ? 'active' : ''}`;
    item.innerHTML = `
      <span class="playlist-item-name">${global.getFileName(file)}</span>
      <button class="playlist-item-remove" data-index="${index}">×</button>
    `;
    
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('playlist-item-remove')) {
        global.playVideoAtIndex(index);
      }
    });
    
    const removeBtn = item.querySelector('.playlist-item-remove');
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      global.removeFromPlaylist(index);
    });
    
    playlist.appendChild(item);
  });
}

global.getFileName = function(path) {
  return path.split('/').pop().split('\\').pop();
}

global.removeFromPlaylist = function(index) {
  global.playlistItems.splice(index, 1);
  
  if (index === global.currentIndex) {
    if (global.playlistItems.length > 0) {
      global.playVideoAtIndex(Math.min(index, global.playlistItems.length - 1));
    } else {
      global.clearPlaylist();
    }
  } else if (index < global.currentIndex) {
    global.currentIndex--;
  }
  
  global.updatePlaylistUI();
}
