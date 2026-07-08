// Console Functions
global.toggleConsole = function() {
  global.isConsoleEnabled = consoleToggle.checked;
  
  if (global.isConsoleEnabled) {
    // Override console methods
    console.log = (...args) => {
      global.originalConsole.log(...args);
      global.addLogEntry('log', args);
    };
    console.error = (...args) => {
      global.originalConsole.error(...args);
      global.addLogEntry('error', args);
    };
    console.warn = (...args) => {
      global.originalConsole.warn(...args);
      global.addLogEntry('warn', args);
    };
    console.info = (...args) => {
      global.originalConsole.info(...args);
      global.addLogEntry('info', args);
    };
    global.addLogEntry('info', ['Consola de depuración activada']);
  } else {
    // Restore original console methods
    console.log = global.originalConsole.log;
    console.error = global.originalConsole.error;
    console.warn = global.originalConsole.warn;
    console.info = global.originalConsole.info;
  }
}

global.addLogEntry = function(type, args) {
  const timestamp = new Date().toLocaleTimeString();
  const message = args.map(arg => {
    if (typeof arg === 'object') {
      return JSON.stringify(arg, null, 2);
    }
    return String(arg);
  }).join(' ');
  
  global.consoleLogs.push({ timestamp, type, message });
  
  if (global.isConsoleEnabled) {
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.innerHTML = `<span class="log-time">[${timestamp}]</span>${global.escapeHtml(message)}`;
    debugConsole.appendChild(entry);
    debugConsole.scrollTop = debugConsole.scrollHeight;
  }
}

global.escapeHtml = function(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

global.copyLogs = function() {
  const text = global.consoleLogs.map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`).join('\n');
  navigator.clipboard.writeText(text).then(() => {
    global.addLogEntry('info', ['Logs copiados al portapapeles']);
  }).catch(err => {
    global.originalConsole.error('Error copying logs:', err);
  });
}

global.clearLogs = function() {
  global.consoleLogs = [];
  debugConsole.innerHTML = '';
  global.addLogEntry('info', ['Consola limpiada']);
}
