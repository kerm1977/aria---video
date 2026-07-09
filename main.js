const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const http = require('http');
const url = require('url');

let mainWindow;
let ffmpegProcess = null;
let streamServerPort = 0;
let videoDurations = new Map(); // Cache for video durations

// Get video duration using ffprobe
function getVideoDuration(filePath) {
  return new Promise((resolve) => {
    exec(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, (error, stdout) => {
      if (error || !stdout) {
        resolve(null);
        return;
      }
      const duration = parseFloat(stdout.trim());
      if (isNaN(duration)) {
        resolve(null);
      } else {
        resolve(duration);
      }
    });
  });
}

const streamServer = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  if (parsedUrl.pathname === '/stream') {
    const filePath = parsedUrl.query.file;
    if (!filePath || !fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    if (ffmpegProcess) {
      ffmpegProcess.kill('SIGKILL');
      ffmpegProcess = null;
    }

    // Determine content type based on extension or transcode need
    const ext = path.extname(filePath).toLowerCase();
    
    // Set headers for progressive streaming
    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Transfer-Encoding': 'chunked',
      'Access-Control-Allow-Origin': '*'
    });

    console.log('Instant streaming:', filePath);

    // Get video duration for accurate progress bar
    getVideoDuration(filePath).then(duration => {
      if (duration) {
        videoDurations.set(filePath, duration);
        console.log('Video duration:', duration);
      }
    });

    ffmpegProcess = spawn('ffmpeg', [
      '-i', filePath,
      '-map', '0:v:0',
      '-map', '0:a:0',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-ac', '2',
      '-ar', '48000',
      '-sn',
      '-dn',
      '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
      '-f', 'mp4',
      'pipe:1'
    ]);

    ffmpegProcess.stdout.pipe(res);

    ffmpegProcess.stderr.on('data', (data) => {
      // Uncomment to debug FFmpeg stream
      // console.log(data.toString());
    });

    ffmpegProcess.on('close', () => {
      console.log('FFmpeg stream process closed');
      res.end();
    });

    req.on('close', () => {
      console.log('Client closed connection, killing FFmpeg');
      if (ffmpegProcess) {
        ffmpegProcess.kill('SIGKILL');
        ffmpegProcess = null;
      }
    });
  }
});

streamServer.listen(0, '127.0.0.1', () => {
  streamServerPort = streamServer.address().port;
  console.log('Stream server running on port:', streamServerPort);
});

function createWindow(filePath = null) {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'Aria - Player'
  });

  win.loadFile('index.html');

  win.on('closed', () => {
    if (win === mainWindow) {
      mainWindow = null;
    }
  });

  // If a file path is provided, load it after the window is ready
  if (filePath) {
    win.webContents.on('did-finish-load', () => {
      win.webContents.send('open-file', filePath);
    });
  }

  return win;
}

app.whenReady().then(() => {
  // Register custom protocol for local files
  protocol.registerFileProtocol('media', (request, callback) => {
    console.log('=== PROTOCOL HANDLER START ===');
    console.log('Request URL:', request.url);
    try {
      // Extract file path from media:// URL
      const filePath = decodeURIComponent(request.url.replace('media://', ''));
      console.log('Extracted file path:', filePath);
      
      // Check if file exists
      if (fs.existsSync(filePath)) {
        console.log('File exists, serving:', filePath);
        callback({ path: filePath });
      } else {
        console.error('File does not exist:', filePath);
        callback({ error: -2 }); // File not found
      }
    } catch (error) {
      console.error('Protocol handler error:', error);
      callback({ error: -3 }); // Other error
    }
    console.log('=== PROTOCOL HANDLER END ===');
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle file opening from command line or file association
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.webContents.send('open-file', filePath);
    mainWindow.focus();
  }
});

// IPC handlers
ipcMain.on('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    focusedWindow.close();
  }
});

ipcMain.on('open-new-window', (event, filePath) => {
  const newWindow = createWindow(filePath);
  newWindow.focus();
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const folderPath = result.filePaths[0];
    const files = getMediaFiles(folderPath);
    return { folderPath, files };
  }
  return null;
});

ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Media Files', extensions: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'heic', 'heif', 'tiff', 'svg'] },
      { name: 'Video Files', extensions: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'] },
      { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'] },
      { name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'heic', 'heif', 'tiff', 'svg'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths;
  }
  return null;
});

function getMediaFiles(folderPath) {
  const mediaExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif', '.tiff', '.svg'];
  const files = [];
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);

    // Sort items alphabetically for consistent order
    items.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else {
        const ext = path.extname(item).toLowerCase();
        if (mediaExtensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  scanDirectory(folderPath);
  return files;
}

ipcMain.handle('get-file-info', async (event, filePath) => {
  try {
    const stat = fs.statSync(filePath);
    return {
      name: path.basename(filePath),
      path: filePath,
      size: stat.size,
      sizeFormatted: formatFileSize(stat.size)
    };
  } catch (error) {
    return null;
  }
});

ipcMain.on('file-exists', (event, filePath) => {
  const exists = fs.existsSync(filePath);
  console.log('File exists check for:', filePath, 'Result:', exists);
  event.returnValue = exists;
});

// Stop any running FFmpeg process
ipcMain.on('stop-ffmpeg', () => {
  // Handled inherently by the new streaming model or existing process
});

ipcMain.handle('get-stream-port', () => {
  return streamServerPort;
});

ipcMain.handle('get-video-duration', async (event, filePath) => {
  const cached = videoDurations.get(filePath);
  if (cached) return cached;
  const duration = await getVideoDuration(filePath);
  if (duration) {
    videoDurations.set(filePath, duration);
  }
  return duration;
});

// Start FFmpeg transcode for MKV files
// This is kept for backward compatibility if called, but we'll use the local stream server
ipcMain.handle('start-ffmpeg-transcode', async (event, filePath) => {
  return new Promise((resolve) => {
    resolve({ url: `http://127.0.0.1:${streamServerPort}/stream?file=${encodeURIComponent(filePath)}`, isTranscoded: true });
  });
});

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
