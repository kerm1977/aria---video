// UI Control Functions
global.toggleOptionsPanel = function() {
  optionsPanel.classList.toggle('hidden');
  if (!optionsPanel.classList.contains('hidden')) {
    global.showControls();
  } else {
    global.resetHideTimeout();
  }
};

global.toggleSection = function(section, btn) {
  const content = document.getElementById(section + '-section');
  if (content) {
    content.classList.toggle('collapsed');
    btn.classList.toggle('collapsed');
  }
};

// Main controls dragging functions
global.startControlsDrag = function(e) {
  if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;

  global.isControlsDragging = true;

  // Get current position accounting for transform
  const rect = mainControls.getBoundingClientRect();
  global.controlsDragOffsetX = e.clientX - rect.left;
  global.controlsDragOffsetY = e.clientY - rect.top;

  // Remove transform and set explicit position
  mainControls.style.transform = 'none';
  mainControls.style.left = rect.left + 'px';
  mainControls.style.top = rect.top + 'px';
  mainControls.style.bottom = 'auto';
  mainControls.style.transition = 'none';
};

global.dragControls = function(e) {
  if (!global.isControlsDragging) return;

  e.preventDefault();

  const newX = e.clientX - global.controlsDragOffsetX;
  const newY = e.clientY - global.controlsDragOffsetY;

  // Constrain to viewport (accounting for titlebar)
  const maxX = window.innerWidth - mainControls.offsetWidth;
  const maxY = window.innerHeight - mainControls.offsetHeight - 32; // 32px for titlebar

  const constrainedX = Math.max(0, Math.min(newX, maxX));
  const constrainedY = Math.max(32, Math.min(newY, maxY + 32)); // Below titlebar

  mainControls.style.left = constrainedX + 'px';
  mainControls.style.top = constrainedY + 'px';
};

global.stopControlsDrag = function() {
  if (global.isControlsDragging) {
    global.isControlsDragging = false;
    mainControls.style.transition = 'opacity 0.3s ease';
  }
};

global.handleMouseMove = function() {
  global.showControls();
  global.resetHideTimeout();
};

global.showControls = function() {
  if (!global.isControlsVisible) {
    global.isControlsVisible = true;
    floatingBtn.classList.remove('fade-out');
    floatingBtn.classList.add('fade-in');
    mainControls.classList.remove('fade-out');
    mainControls.classList.add('fade-in');
  }
};

global.hideControls = function() {
  if (global.isControlsVisible && !optionsPanel.classList.contains('hidden')) {
    return;
  }
  
  global.isControlsVisible = false;
  floatingBtn.classList.remove('fade-in');
  floatingBtn.classList.add('fade-out');
  mainControls.classList.remove('fade-in');
  mainControls.classList.add('fade-out');
};

global.resetHideTimeout = function() {
  if (global.hideTimeout) {
    clearTimeout(global.hideTimeout);
  }
  
  global.hideTimeout = setTimeout(() => {
    global.hideControls();
  }, 3000);
};

// Inverse Scrollbar
global.setupInverseScrollbar = function() {
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
};
