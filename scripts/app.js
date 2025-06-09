// Main Application Logic for Enhanced CoD Studio
window.THREAD_MANAGER = {
  
  // Create a new thread
  createNewThread: function() {
    const newThread = {
      id: Date.now(),
      name: `Research Session ${window.APP_STATE.threadCounter++}`,
      messages: [],
      reasoning_sessions: [],
      metadata: {
        created: new Date().toISOString(),
        model: window.CONFIG.currentModel,
        reasoning_method: window.CONFIG.reasoningMethod
      }
    };
    window.APP_STATE.threads.push(newThread);
    window.APP_STATE.currentThreadId = newThread.id;
    this.updateThreadList();
    window.UI.renderCurrentThreadMessages();
    window.UI.showNotification("New research session created");
    this.saveThreadsToStorage();
  },
  
  // Update thread list display
  updateThreadList: function() {
    const threadList = document.getElementById("threadList");
    if (threadList) {
      threadList.innerHTML = "";
      window.APP_STATE.threads.forEach(thread => {
        const li = document.createElement("li");
        li.className = "px-4 py-3 rounded-xl cursor-pointer hover:bg-dark-600 transition-all duration-200 border border-dark-500/50";
        
        if (thread.id === window.APP_STATE.currentThreadId) {
          li.classList.add("bg-dark-600/50", "text-deepseek-300", "border-deepseek-500/50");
        } else {
          li.classList.add("text-gray-300", "hover:border-deepseek-500/50");
        }
        
        li.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-deepseek-500/20 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-deepseek-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white truncate">${thread.name}</p>
              <p class="text-xs text-gray-400">${this.formatTimeAgo(thread.metadata.created)}</p>
            </div>
          </div>
        `;
        
        li.addEventListener("click", () => {
          window.APP_STATE.currentThreadId = thread.id;
          window.UI.renderCurrentThreadMessages();
          this.updateThreadList();
        });
        threadList.appendChild(li);
      });
    }
    
    // Update mobile thread list
    const mobileThreadList = document.getElementById("mobileThreadList");
    if (mobileThreadList) {
      mobileThreadList.innerHTML = "";
      window.APP_STATE.threads.forEach(thread => {
        const li = document.createElement("li");
        li.textContent = thread.name;
        li.className = "px-3 py-2 rounded-md cursor-pointer hover:bg-dark-500 transition";
        if (thread.id === window.APP_STATE.currentThreadId) {
          li.classList.add("bg-dark-600", "text-deepseek-300");
        } else {
          li.classList.add("text-gray-300");
        }
        li.addEventListener("click", () => {
          window.APP_STATE.currentThreadId = thread.id;
          window.UI.renderCurrentThreadMessages();
          this.updateThreadList();
          document.getElementById("mobileSidebar").classList.remove("translate-x-0");
          document.getElementById("mobileSidebar").classList.add("-translate-x-full");
        });
        mobileThreadList.appendChild(li);
      });
    }
    
    // Update thread count
    const threadCountEl = document.getElementById("threadCount");
    if (threadCountEl) {
      threadCountEl.textContent = window.APP_STATE.threads.length;
    }
  },

  // Format time ago display
  formatTimeAgo: function(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  },

  // Add message to current thread
  addMessageToCurrentThread: function(content, sender, isPlaceholder = false, files = [], images = [], stageType = null, stageInfo = null, reasoning = null, wordLimit = null) {
    const thread = window.APP_STATE.threads.find(t => t.id === window.APP_STATE.currentThreadId);
    if (thread) {
      const wordCount = sender === "bot" && !isPlaceholder ? (window.COMPLEXITY_ANALYZER.countWords(content) || 0) : (window.COMPLEXITY_ANALYZER.countWords(content) || 0);
      
      thread.messages.push({
        content, 
        sender, 
        isPlaceholder, 
        timestamp: new Date(),
        wordCount,
        stageType,
        stageInfo,
        reasoning,
        wordLimit,
        files: files && files.length > 0 ? files.map(f => ({ name: f.name, type: f.type, size: f.size })) : undefined,
        images: images && images.length > 0 ? images.map(img => ({ name: img.name, type: img.type, size: img.size })) : undefined,
      });
      
      window.UI.renderCurrentThreadMessages();
      this.saveThreadsToStorage();
    }
  },

  // Clear current thread
  clearCurrentThread: function() {
    if (confirm("Clear all messages in this session?")) { 
      const thread = window.APP_STATE.threads.find(t => t.id === window.APP_STATE.currentThreadId); 
      if (thread) { 
        thread.messages = []; 
        window.UI.renderCurrentThreadMessages(); 
        window.UI.showNotification("Session cleared");
        this.saveThreadsToStorage();
      }
    }
  },

  // Delete current thread
  deleteCurrentThread: function() {
    if (confirm("Are you sure you want to delete this session?")) { 
      window.APP_STATE.threads = window.APP_STATE.threads.filter(thread => thread.id !== window.APP_STATE.currentThreadId);
      if (window.APP_STATE.threads.length > 0) {
        window.APP_STATE.currentThreadId = window.APP_STATE.threads[0].id;
      } else {
        this.createNewThread(); 
        return;
      }
      this.updateThreadList();
      window.UI.renderCurrentThreadMessages();
      window.UI.showNotification("Session deleted");
      this.saveThreadsToStorage();
    }
  },

  // Save threads to storage
  saveThreadsToStorage: function() {
    window.STORAGE.save('enhancedCodThreads', window.APP_STATE.threads);
    window.STORAGE.save('currentThreadId', window.APP_STATE.currentThreadId);
    window.STORAGE.save('threadCounter', window.APP_STATE.threadCounter);
  },

  // Load threads from storage
  loadThreadsFromStorage: function() {
    const savedThreads = window.STORAGE.load('enhancedCodThreads', []);
    const savedCurrentThreadId = window.STORAGE.load('currentThreadId', null);
    const savedThreadCounter = window.STORAGE.load('threadCounter', 1);
    
    window.APP_STATE.threads = savedThreads;
    window.APP_STATE.currentThreadId = savedCurrentThreadId;
    window.APP_STATE.threadCounter = savedThreadCounter;
    
    if (window.APP_STATE.threads.length === 0) {
      this.createNewThread();
    } else {
      this.updateThreadList();
      window.UI.renderCurrentThreadMessages();
    }
  }
};

window.SETTINGS_MANAGER = {
  
  // Open settings modal
  openSettingsModal: function() {
    // Set reasoning method
    const reasoningRadio = document.getElementById(`${window.CONFIG.reasoningMethod}`.replace('_', ''));
    if (reasoningRadio) reasoningRadio.checked = true;
    
    // Set CoD word limit
    const wordLimitRadio = document.getElementById(`cod${window.CONFIG.codWordLimit}Words`);
    if (wordLimitRadio) wordLimitRadio.checked = true;
    
    // Set reasoning enhancement
    const enhancementRadio = document.getElementById(`${window.CONFIG.reasoningEnhancement}${window.CONFIG.reasoningEnhancement === 'adaptive' ? 'Complexity' : 'Reasoning'}`);
    if (enhancementRadio) enhancementRadio.checked = true;
    
    // Set reflection settings
    document.getElementById('enableSelfVerification').checked = window.CONFIG.reflectionSettings.enableSelfVerification;
    document.getElementById('enableErrorDetection').checked = window.CONFIG.reflectionSettings.enableErrorDetection;
    document.getElementById('enableAlternativeSearch').checked = window.CONFIG.reflectionSettings.enableAlternativeSearch;
    document.getElementById('enableConfidenceAssessment').checked = window.CONFIG.reflectionSettings.enableConfidenceAssessment;
    document.getElementById('verificationDepth').value = window.CONFIG.reflectionSettings.verificationDepth;
    
    this.setSliderAndValue("temp", window.CONFIG.temperature); 
    this.setSliderAndValue("topP", window.CONFIG.topP); 
    this.setSliderAndValue("topK", window.CONFIG.topK); 
    this.setSliderAndValue("maxTokens", window.CONFIG.maxTokens);
    
    const streamingToggle = document.getElementById('streamingToggle'); 
    if (streamingToggle) streamingToggle.checked = window.CONFIG.enableStreaming;
    
    const modal = document.getElementById("settingsModal"); 
    if (modal) modal.style.display = "flex";
  },

  // Set slider value and display
  setSliderAndValue: function(id, value) { 
    const slider = document.getElementById(id); 
    const valueDisplay = document.getElementById(`${id}Value`); 
    if (slider) { 
      slider.value = value; 
      window.UI.updateRangeColor(slider); 
    } 
    if (valueDisplay) valueDisplay.textContent = value; 
  },
  
  // Close settings modal
  closeSettingsModal: function() { 
    const modal = document.getElementById("settingsModal"); 
    if (modal) modal.style.display = "none"; 
  },
  
  // Save settings
  saveSettings: function() {
    try {
      // Save reasoning method
      const reasoningRadios = document.getElementsByName("reasoningMethod"); 
      for (const radio of reasoningRadios) {
        if (radio.checked) window.CONFIG.reasoningMethod = radio.value;
      }
      
      // Save CoD word limit
      const wordLimitRadios = document.getElementsByName("codWordLimit"); 
      for (const radio of wordLimitRadios) {
        if (radio.checked) window.CONFIG.codWordLimit = parseInt(radio.value);
      }
      
      // Save reasoning enhancement
      const enhancementRadios = document.getElementsByName("reasoningEnhancement"); 
      for (const radio of enhancementRadios) {
        if (radio.checked) window.CONFIG.reasoningEnhancement = radio.value;
      }
      
      // Save reflection settings
      window.CONFIG.reflectionSettings.enableSelfVerification = document.getElementById('enableSelfVerification')?.checked || false;
      window.CONFIG.reflectionSettings.enableErrorDetection = document.getElementById('enableErrorDetection')?.checked || false;
      window.CONFIG.reflectionSettings.enableAlternativeSearch = document.getElementById('enableAlternativeSearch')?.checked || false;
      window.CONFIG.reflectionSettings.enableConfidenceAssessment = document.getElementById('enableConfidenceAssessment')?.checked || false;
      window.CONFIG.reflectionSettings.verificationDepth = document.getElementById('verificationDepth')?.value || 'standard';
      
      const streamingToggle = document.getElementById('streamingToggle'); 
      if (streamingToggle) { 
        window.CONFIG.enableStreaming = streamingToggle.checked; 
      }
      
      window.CONFIG.temperature = parseFloat(document.getElementById("temp").value); 
      window.CONFIG.topP = parseFloat(document.getElementById("topP").value); 
      window.CONFIG.topK = parseInt(document.getElementById("topK").value); 
      window.CONFIG.maxTokens = parseInt(document.getElementById("maxTokens").value);
      
      // Save to storage
      window.STORAGE.save("enhancedCodConfig", window.CONFIG);
      
      this.closeSettingsModal(); 
      window.UI.showNotification("Enhanced settings saved");
      
    } catch (error) {
      window.ERROR_HANDLER.handleError(error, 'SETTINGS_MANAGER.saveSettings');
      window.UI.showNotification("Error saving settings");
    }
  },

  // Load persisted settings
  loadPersistedSettings: function() {
    try {
      const savedConfig = window.STORAGE.load("enhancedCodConfig");
      if (savedConfig) {
        Object.assign(window.CONFIG, savedConfig);
      }
    } catch (error) {
      window.ERROR_HANDLER.handleError(error, 'SETTINGS_MANAGER.loadPersistedSettings');
    }
  }
};

window.EXPORT_MANAGER = {
  
  // Download current thread as TXT
  downloadCurrentThreadAsTxt: function() {
    const thread = window.APP_STATE.threads.find(t => t.id === window.APP_STATE.currentThreadId);
    if (!thread) { 
      window.UI.showNotification("Error: No active session found"); 
      return; 
    }
    
    let content = `Enhanced Chain of Draft Studio - DeepSeek V3-0324\n`;
    content += `Model: ${window.CONFIG.currentModel}\n`;
    content += `Reasoning: ${window.CONFIG.reasoningMethod.toUpperCase()}\n`;
    content += `Word Limit: ${window.CONFIG.codWordLimit} words per step\n`;
    content += `Verification Depth: ${window.CONFIG.reflectionSettings.verificationDepth}\n`;
    content += `Adaptive: ${window.CONFIG.reasoningEnhancement === 'adaptive' ? 'Enabled' : 'Disabled'}\n`;
    content += `Export Date: ${new Date().toLocaleString()}\n\n`;
    content += `${'='.repeat(60)}\n\n`;
    
    thread.messages.forEach(msg => {
      if (msg.isPlaceholder) return;
      const prefix = msg.sender.toUpperCase();
      content += `${prefix}:\n${msg.content}\n\n`;
      
      if (msg.sender === 'bot' && !msg.isPlaceholder && !msg.isStreaming) {
        if (msg.stageInfo) {
          content += `[${msg.stageInfo}]\n`;
        }
        if (msg.reasoning) {
          content += `[Adaptive Reasoning: ${msg.reasoning}]\n`;
        }
        if (msg.wordCount !== undefined) {
          content += `[Words: ${msg.wordCount}]\n`;
        }
        if (msg.totalTokens !== undefined) {
          content += `[Tokens: ${msg.totalTokens}]\n`;
        }
        if (msg.durationSeconds !== undefined) {
          content += `[Stage Time: ${msg.durationSeconds}s]\n`;
        }
        if (msg.totalProcessingTime !== undefined) {
          content += `[Total Time: ${msg.totalProcessingTime}s]\n`;
        }
        content += "\n";
      }
    });
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${thread.name}_Enhanced_CoD_DeepSeek.txt`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { 
      document.body.removeChild(a); 
      URL.revokeObjectURL(url); 
    }, 100);
    window.UI.showNotification("Enhanced research export downloaded");
  }
};

window.MOBILE_MANAGER = {
  
  // Initialize mobile navigation
  initMobileNavigation: function() {
    const mobileSidebarToggle = document.getElementById('mobileSidebarToggle'); 
    const mobileSidebar = document.getElementById('mobileSidebar'); 
    const closeMobileSidebar = document.getElementById('closeMobileSidebar');
    
    if (mobileSidebarToggle && mobileSidebar) {
      mobileSidebarToggle.addEventListener('click', () => { 
        mobileSidebar.classList.remove('-translate-x-full'); 
        mobileSidebar.classList.add('translate-x-0'); 
      });
    }
    
    if (closeMobileSidebar && mobileSidebar) {
      closeMobileSidebar.addEventListener('click', () => { 
        mobileSidebar.classList.remove('translate-x-0'); 
        mobileSidebar.classList.add('-translate-x-full'); 
      });
    }
    
    const mobileNewThreadBtn = document.getElementById('mobileNewThreadBtn');
    if (mobileNewThreadBtn) {
      mobileNewThreadBtn.addEventListener('click', () => { 
        window.THREAD_MANAGER.createNewThread(); 
        mobileSidebar.classList.remove('translate-x-0'); 
        mobileSidebar.classList.add('-translate-x-full'); 
      });
    }

    const mobileDeleteThreadBtn = document.getElementById('mobileDeleteThreadBtn');
    if (mobileDeleteThreadBtn) {
      mobileDeleteThreadBtn.addEventListener('click', () => {
        window.THREAD_MANAGER.deleteCurrentThread();
        mobileSidebar.classList.remove('translate-x-0'); 
        mobileSidebar.classList.add('-translate-x-full');
      });
    }

    const mobileDownloadTxtBtn = document.getElementById('mobileDownloadTxtBtn');
    if (mobileDownloadTxtBtn) {
      mobileDownloadTxtBtn.addEventListener('click', () => {
        window.EXPORT_MANAGER.downloadCurrentThreadAsTxt();
        mobileSidebar.classList.remove('translate-x-0'); 
        mobileSidebar.classList.add('-translate-x-full');
      });
    }

    const mobileClearThreadBtn = document.getElementById('mobileClearThreadBtn');
    if (mobileClearThreadBtn) {
      mobileClearThreadBtn.addEventListener('click', () => {
        window.THREAD_MANAGER.clearCurrentThread();
        mobileSidebar.classList.remove('translate-x-0'); 
        mobileSidebar.classList.add('-translate-x-full');
      });
    }
  }
};

// Main Application Class
window.APP = {
  
  // Initialize the application
  init: function() {
    window.PERFORMANCE.startTimer('App.init');
    
    try {
      // Load persisted settings
      window.SETTINGS_MANAGER.loadPersistedSettings();
      
      // Load threads from storage
      window.THREAD_MANAGER.loadThreadsFromStorage();
      
      // Initialize UI components
      window.UI.init();
      
      // Setup event listeners
      this.initEventListeners();
      
      // Initialize mobile navigation
      window.MOBILE_MANAGER.initMobileNavigation();
      
      window.PERFORMANCE.endTimer('App.init');
      
      console.log('Enhanced CoD Studio initialized successfully');
      
    } catch (error) {
      window.ERROR_HANDLER.handleError(error, 'APP.init');
      window.ERROR_HANDLER.showErrorBoundary(error);
    }
  },
  
  // Initialize event listeners
  initEventListeners: function() {
    const addListener = (id, event, handler, required = true) => { 
      const element = document.getElementById(id); 
      if (element) {
        element.addEventListener(event, handler); 
      } else if (required) {
        console.warn(`Required element "${id}" not found`); 
      }
    };
    
    // Settings
    addListener("openSettings", "click", window.SETTINGS_MANAGER.openSettingsModal.bind(window.SETTINGS_MANAGER)); 
    addListener("closeSettings", "click", window.SETTINGS_MANAGER.closeSettingsModal.bind(window.SETTINGS_MANAGER)); 
    addListener("closeModalX", "click", window.SETTINGS_MANAGER.closeSettingsModal.bind(window.SETTINGS_MANAGER)); 
    addListener("saveSettings", "click", window.SETTINGS_MANAGER.saveSettings.bind(window.SETTINGS_MANAGER));
    
    // Thread management
    addListener("newThreadBtn", "click", window.THREAD_MANAGER.createNewThread.bind(window.THREAD_MANAGER)); 
    addListener("clearThreadBtn", "click", window.THREAD_MANAGER.clearCurrentThread.bind(window.THREAD_MANAGER));
    addListener("deleteThreadBtn", "click", window.THREAD_MANAGER.deleteCurrentThread.bind(window.THREAD_MANAGER));
    
    // Export
    addListener("downloadTxtBtn", "click", window.EXPORT_MANAGER.downloadCurrentThreadAsTxt.bind(window.EXPORT_MANAGER));
    
    // Input handling
    const textarea = document.getElementById('userInput');
    if (textarea) { 
      textarea.addEventListener('input', () => { 
        textarea.style.height = 'auto'; 
        textarea.style.height = (textarea.scrollHeight) + 'px'; 
      }); 
      
      textarea.addEventListener('keydown', (e) => { 
        if (e.key === 'Enter' && !e.shiftKey) { 
          e.preventDefault(); 
          this.handleSendMessage();
        }
      });
    }
    
    addListener("sendBtn", "click", this.handleSendMessage.bind(this));
    
    // Modal handling
    window.addEventListener("click", (event) => { 
      const settingsModal = document.getElementById("settingsModal"); 
      if (settingsModal && event.target === settingsModal) {
        window.SETTINGS_MANAGER.closeSettingsModal(); 
      }
    });
    
    // Dark mode preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => { 
      if (event.matches) {
        document.documentElement.classList.add('dark'); 
      } else {
        document.documentElement.classList.remove('dark'); 
      }
    });
  },

  // Handle send message
  handleSendMessage: function() {
    const textarea = document.getElementById('userInput'); 
    if (textarea) { 
      const message = textarea.value.trim(); 
      if (message || window.APP_STATE.attachedFiles.length > 0 || window.APP_STATE.attachedImages.length > 0) { 
        window.API_CLIENT.sendMessage(message); 
        textarea.value = ''; 
        textarea.style.height = 'auto'; 
      }
    }
  }
};

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
  // Add slight delay to ensure all scripts are loaded
  setTimeout(() => {
    window.APP.init();
  }, 100);
});
