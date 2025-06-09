// UI Components and Rendering for Enhanced CoD Studio
window.UI = {
  
  // Initialize UI components
  init: function() {
    this.setupTabNavigation();
    this.setupSliders();
    this.setupFileHandlers();
    this.hideLoadingIndicator();
  },

  // Hide the loading indicator
  hideLoadingIndicator: function() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
      setTimeout(() => {
        loadingIndicator.classList.add('loading-fade-out');
        setTimeout(() => {
          loadingIndicator.style.display = 'none';
        }, 500);
      }, 1000);
    }
  },

  // Show notification to user
  showNotification: function(message, duration = 3000) {
    const notification = document.getElementById("statusNotification");
    if (notification) {
      notification.textContent = message;
      notification.classList.add("opacity-100");
      setTimeout(() => { 
        notification.classList.remove("opacity-100"); 
      }, duration);
    }
  },
  
  // Show/hide progress bar
  showProgress: function(show = true, percentage = 0) {
    const container = document.getElementById("progressContainer");
    const bar = document.getElementById("progressBar");
    
    if (container && bar) {
      if (show) {
        container.classList.remove("hidden");
        bar.style.width = `${percentage}%`;
      } else {
        container.classList.add("hidden");
        bar.style.width = "0%";
      }
    }
  },

  // Render current thread messages
  renderCurrentThreadMessages: function() {
    const chatMessagesDiv = document.getElementById("chatMessages");
    if (!chatMessagesDiv) return;
    
    chatMessagesDiv.innerHTML = "";
    const thread = window.APP_STATE.threads.find(t => t.id === window.APP_STATE.currentThreadId);
    
    if (thread) {
      thread.messages.forEach(msg => {
        const messageDiv = document.createElement("div");
        
        if (msg.sender === "user") {
          messageDiv.className = "flex justify-end message-user";
          const msgContent = document.createElement("div");
          msgContent.className = "max-w-[90%] deepseek-gradient text-white p-4 rounded-2xl rounded-tr-sm shadow-md";
          msgContent.innerHTML = this.transformMessage(msg.content);
          if (msg.files && msg.files.length > 0) this.addFilesToMessage(msgContent, msg.files);
          if (msg.images && msg.images.length > 0) this.addImagesToMessage(msgContent, msg.images);
          messageDiv.appendChild(msgContent);
        } else { // Bot message
          messageDiv.className = "flex justify-start message-bot";
          const msgContent = document.createElement("div");
          msgContent.className = "max-w-[90%] bg-dark-700 border border-dark-500 p-4 rounded-2xl rounded-tl-sm shadow-md";
          
          if (msg.isPlaceholder) {
            msgContent.classList.add("opacity-70");
            msgContent.innerHTML = `<div class="flex items-center gap-2"><svg class="animate-spin h-4 w-4 text-deepseek-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>${msg.content}</div>`;
          } else if (msg.isStreaming) {
            msgContent.classList.add("streaming");
            msgContent.innerHTML = this.transformMessage(msg.content); 
            msgContent.innerHTML += `<div class="text-deepseek-400 text-xs mt-2 streaming-indicator">Generating</div>`;
          } else {
            // Handle different enhanced CoD stage types
            if (msg.stageType === 'enhanced_cod_stage1') {
              msgContent.innerHTML = this.formatEnhancedCoDStage(msg.content, msg.wordLimit || window.CONFIG.codWordLimit, 1);
            } else if (msg.stageType === 'enhanced_verification') {
              msgContent.innerHTML = this.formatEnhancedVerification(msg.content);
            } else {
              msgContent.innerHTML = this.transformMessage(msg.content);
            }
            
            // Add adaptive reasoning notification
            if (msg.reasoning) {
              const adaptiveNotification = document.createElement("div");
              adaptiveNotification.className = "mt-2 px-3 py-2 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg text-xs reflection-indicator";
              adaptiveNotification.innerHTML = `<span class="text-purple-300">🧠 Adaptive:</span> <span class="text-purple-100">${msg.reasoning}</span>`;
              msgContent.appendChild(adaptiveNotification);
            }
            
            // Add stage indicator
            if (msg.stageInfo) {
              const stageIndicator = document.createElement("div");
              stageIndicator.className = "mt-2 px-2 py-1 bg-deepseek-900/20 border border-deepseek-800/30 rounded text-xs text-deepseek-400";
              stageIndicator.innerHTML = `<span class="stage-indicator">📍</span> ${msg.stageInfo}`;
              msgContent.appendChild(stageIndicator);
            }
          }
          
          if (!msg.isPlaceholder && !msg.isStreaming) {
            const statsDiv = document.createElement("div");
            statsDiv.className = "mt-3 pt-2 border-t border-dark-600/50 text-xs text-gray-400 flex flex-wrap gap-x-4 gap-y-1 items-center";
            
            let statsAdded = false;
            if (msg.wordCount !== undefined) {
              const wordStat = document.createElement('span');
              wordStat.innerHTML = `Words: <span class="text-gray-300">${msg.wordCount}</span>`;
              statsDiv.appendChild(wordStat);
              statsAdded = true;
            }

            if (msg.totalTokens !== undefined) {
              const tokenStat = document.createElement('span');
              tokenStat.innerHTML = `Tokens: <span class="text-teal-300 font-medium">${msg.totalTokens}</span>`;
              statsDiv.appendChild(tokenStat);
              statsAdded = true;
            }

            if (msg.durationSeconds !== undefined) {
              const timeStat = document.createElement('span');
              timeStat.innerHTML = `Time: <span class="text-amber-400 font-medium">${msg.durationSeconds}s</span>`;
              statsDiv.appendChild(timeStat);
              statsAdded = true;
            }

            if (msg.totalProcessingTime !== undefined) {
              const totalTimeStat = document.createElement('span');
              totalTimeStat.innerHTML = `Total: <span class="text-deepseek-400 font-medium">${msg.totalProcessingTime}s</span>`;
              statsDiv.appendChild(totalTimeStat);
              statsAdded = true;
            }

            if (statsAdded) {
              msgContent.appendChild(statsDiv);
            }
          }
          messageDiv.appendChild(msgContent);
        }
        chatMessagesDiv.appendChild(messageDiv);
      });
      chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
    }
    
    if (typeof hljs !== 'undefined') { 
      document.querySelectorAll('pre code').forEach((block) => hljs.highlightElement(block)); 
    }
    this.addCodeCopyButtons();
  },

  // Format enhanced CoD stage content
  formatEnhancedCoDStage: function(content, wordLimit, stageNum = 1) {
    if (!content) return '';
    
    let html = '';
    const sections = content.split('####');
    
    // CoD Steps
    if (sections.length > 0) {
      const codSteps = sections[0].trim();
      if (codSteps) {
        html += '<div class="cod-steps bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4">';
        html += `<div class="text-green-300 font-semibold mb-3 flex items-center gap-2">
                   <span>⚡</span>
                   <span>Enhanced Chain of Draft (${wordLimit} words max)</span>
                   <span class="bg-green-600/20 text-green-300 text-xs px-2 py-1 rounded-full ml-auto">STAGE ${stageNum}</span>
                 </div>`;
        
        const steps = codSteps.split('\n').filter(line => line.trim());
        let stepCounter = 1;
        
        steps.forEach(step => {
          if (step.trim().toLowerCase().startsWith('cod step') || step.trim().match(/^\d+\./)) {
            const stepContent = step.replace(/^(cod step \d+:|^\d+\.)/i, '').trim();
            const wordCount = window.COMPLEXITY_ANALYZER.countWords(stepContent);
            const isWithinLimit = wordCount <= wordLimit;
            
            html += `<div class="flex items-start mb-3 cod-step">
                       <span class="flex items-center justify-center min-w-8 h-8 mr-3 rounded-full ${isWithinLimit ? 'bg-green-700 text-green-100' : 'bg-yellow-700 text-yellow-100'} text-sm font-bold">${stepCounter++}</span>
                       <div class="flex-1">
                         <span class="text-green-100 font-mono text-sm">${stepContent}</span>
                         <div class="text-xs ${isWithinLimit ? 'text-green-400' : 'text-yellow-400'} mt-1">${wordCount}/${wordLimit} words</div>
                       </div>
                     </div>`;
          }
        });
        
        html += '</div>';
      }
    }
    
    // Initial Reflection
    if (sections.length > 1) {
      const reflection = sections[1].replace(/INITIAL REFLECTION/i, '').trim();
      if (reflection) {
        html += '<div class="reflection-block bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 mb-4">';
        html += '<div class="text-purple-300 font-semibold mb-3 flex items-center gap-2">';
        html += '<span>🤔</span><span>Initial Reflection</span>';
        html += '</div>';
        html += '<div class="text-purple-100 text-sm">' + this.transformMessage(reflection) + '</div>';
        html += '</div>';
      }
    }
    
    // Draft Solution
    if (sections.length > 2) {
      const solution = sections[2].replace(/DRAFT SOLUTION/i, '').trim();
      if (solution) {
        html += '<div class="draft-solution bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">';
        html += '<div class="text-orange-300 font-semibold mb-3 flex items-center gap-2">';
        html += '<span>💡</span><span>Draft Solution</span>';
        html += '</div>';
        html += '<div class="text-orange-100 text-sm">' + this.transformMessage(solution) + '</div>';
        html += '</div>';
      }
    }
    
    return html;
  },
  
  // Format enhanced verification content
  formatEnhancedVerification: function(content) {
    if (!content) return '';
    
    let html = '';
    const sections = content.split('####');
    
    // Stage 2 Verification
    if (sections.length > 1) {
      const verification = sections[1].replace(/STAGE 2 VERIFICATION/i, '').trim();
      if (verification) {
        html += '<div class="verification-block bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4 mb-4">';
        html += '<div class="text-indigo-300 font-semibold mb-3 flex items-center gap-2">';
        html += '<span>🔍</span><span>Stage 2 Verification</span>';
        html += '<span class="bg-indigo-600/20 text-indigo-300 text-xs px-2 py-1 rounded-full ml-auto">STAGE 2</span>';
        html += '</div>';
        html += '<div class="text-indigo-100 text-sm">' + this.transformMessage(verification) + '</div>';
        html += '</div>';
      }
    }
    
    // Error Detection
    if (sections.length > 2) {
      const errorDetection = sections[2].replace(/ERROR DETECTION & CORRECTION/i, '').trim();
      if (errorDetection) {
        html += '<div class="error-detection bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">';
        html += '<div class="text-red-300 font-semibold mb-3 flex items-center gap-2">';
        html += '<span>🐛</span><span>Error Detection & Correction</span>';
        html += '</div>';
        html += '<div class="text-red-100 text-sm">' + this.transformMessage(errorDetection) + '</div>';
        html += '</div>';
      }
    }
    
    // Alternative Approach Analysis
    if (sections.length > 3) {
      const alternative = sections[3].replace(/ALTERNATIVE APPROACH ANALYSIS/i, '').trim();
      if (alternative) {
        html += '<div class="alternative-analysis bg-teal-900/20 border border-teal-500/30 rounded-lg p-4 mb-4">';
        html += '<div class="text-teal-300 font-semibold mb-3 flex items-center gap-2">';
        html += '<span>🔄</span><span>Alternative Approach Analysis</span>';
        html += '</div>';
        html += '<div class="text-teal-100 text-sm">' + this.transformMessage(alternative) + '</div>';
        html += '</div>';
      }
    }
    
    // Confidence Assessment
    if (sections.length > 4) {
      const confidence = sections[4].replace(/CONFIDENCE ASSESSMENT/i, '').trim();
      if (confidence) {
        html += '<div class="confidence-assessment bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">';
        html += '<div class="text-yellow-300 font-semibold mb-3 flex items-center gap-2">';
        html += '<span>📊</span><span>Confidence Assessment</span>';
        html += '</div>';
        html += '<div class="text-yellow-100 text-sm">' + this.transformMessage(confidence) + '</div>';
        html += '</div>';
      }
    }
    
    // Final Comprehensive Answer
    if (sections.length > 5) {
      const answer = sections[5].replace(/FINAL COMPREHENSIVE ANSWER/i, '').trim();
      if (answer) {
        html += '<div class="final-answer bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4 mb-4">';
        html += '<div class="text-emerald-300 font-semibold mb-3 flex items-center gap-2">';
        html += '<span>✅</span><span>Final Comprehensive Answer</span>';
        html += '<span class="bg-emerald-600/20 text-emerald-300 text-xs px-2 py-1 rounded-full ml-auto">VERIFIED</span>';
        html += '</div>';
        html += '<div class="text-emerald-100">' + this.transformMessage(answer) + '</div>';
        html += '</div>';
      }
    }
    
    // Reflection Summary
    if (sections.length > 6) {
      const reflectionSummary = sections[6].replace(/REFLECTION SUMMARY/i, '').trim();
      if (reflectionSummary) {
        html += '<div class="reflection-summary bg-gray-900/20 border border-gray-500/30 rounded-lg p-4">';
        html += '<div class="text-gray-300 font-semibold mb-3 flex items-center gap-2">';
        html += '<span>📝</span><span>Reflection Summary</span>';
        html += '</div>';
        html += '<div class="text-gray-100 text-sm">' + this.transformMessage(reflectionSummary) + '</div>';
        html += '</div>';
      }
    }
    
    return html;
  },

  // Transform message content (markdown support)
  transformMessage: function(content) {
    if (!content) return '';
    
    if (typeof marked !== 'undefined') {
      try {
        return marked.parse(content);
      } catch (e) {
        console.warn('Marked.js error:', e);
        return content.replace(/\n/g, '<br>');
      }
    } else {
      return content.replace(/```([\s\S]*?)```/g, (match, codeContent) => {
        let language = ''; 
        const lines = codeContent.split('\n');
        if (lines.length > 0 && !lines[0].includes(' ')) { 
          language = lines[0].trim(); 
          lines.shift(); 
        }
        return `<pre><code class="${language}">${lines.join('\n')}</code></pre>`;
      }).replace(/\n/g, '<br>');
    }
  },

  // Add code copy buttons
  addCodeCopyButtons: function() {
    document.querySelectorAll('pre code').forEach(code => {
      if (code.parentElement.classList.contains('relative')) return;
      
      const pre = code.parentElement; 
      const container = document.createElement('div');
      container.className = 'relative mb-4 rounded-lg overflow-hidden'; 
      pre.parentNode.insertBefore(container, pre); 
      container.appendChild(pre);
      
      const language = code.className.match(/language-([^\s]+)/)?.[1];
      if (language && language !== 'plaintext') { 
        const langBadge = document.createElement('div'); 
        langBadge.className = 'absolute top-2 left-2 bg-dark-900/80 text-xs py-1 px-2 rounded text-gray-400'; 
        langBadge.textContent = language; 
        container.appendChild(langBadge); 
      }
      
      pre.className = 'bg-dark-900 rounded-lg p-4 overflow-x-auto text-sm';
      
      const copyBtn = document.createElement('button'); 
      copyBtn.className = 'absolute top-2 right-2 bg-dark-900/80 text-gray-400 hover:text-white text-xs py-1 px-2 rounded transition-colors'; 
      copyBtn.textContent = 'Copy';
      
      copyBtn.addEventListener('click', () => { 
        navigator.clipboard.writeText(code.textContent || '').then(() => { 
          copyBtn.textContent = 'Copied!'; 
          copyBtn.classList.add('text-green-400'); 
          setTimeout(() => { 
            copyBtn.textContent = 'Copy'; 
            copyBtn.classList.remove('text-green-400'); 
          }, 2000); 
        }).catch(() => { 
          copyBtn.textContent = 'Failed'; 
          copyBtn.classList.add('text-red-400'); 
          setTimeout(() => { 
            copyBtn.textContent = 'Copy'; 
            copyBtn.classList.remove('text-red-400'); 
          }, 2000); 
        }); 
      });
      
      container.appendChild(copyBtn);
    });
  },

  // Add files to message display
  addFilesToMessage: function(msgContent, files) {
    const filesDiv = document.createElement('div'); 
    filesDiv.className = 'mt-2 text-xs text-gray-300 italic';
    filesDiv.textContent = `(${files.length} file(s) attached)`; 
    msgContent.appendChild(filesDiv);
  },
  
  // Add images to message display
  addImagesToMessage: function(msgContent, images) {
    const imagesDiv = document.createElement('div'); 
    imagesDiv.className = 'mt-2 text-xs text-purple-300 italic flex items-center gap-1';
    imagesDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>(${images.length} image(s) sent)`; 
    msgContent.appendChild(imagesDiv);
  },

  // Clear attached files display
  clearAttachedFiles: function() {
    const attachedFilesContainer = document.getElementById('attachedFiles');
    const imagePreviewArea = document.getElementById('imagePreviewArea');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    
    if (attachedFilesContainer) {
      attachedFilesContainer.innerHTML = '';
      attachedFilesContainer.classList.add('hidden');
    }
    
    if (imagePreviewArea) {
      imagePreviewArea.classList.add('hidden');
    }
    
    if (imagePreviewContainer) {
      imagePreviewContainer.innerHTML = '';
    }
  },

  // Setup tab navigation
  setupTabNavigation: function() {
    const tabButtons = document.querySelectorAll('.tab-btn'); 
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        tabButtons.forEach(btn => { 
          btn.classList.remove('bg-deepseek-500', 'text-white'); 
          btn.classList.add('text-gray-400'); 
        });
        tabContents.forEach(content => { 
          content.classList.add('hidden'); 
        });
        
        button.classList.add('bg-deepseek-500', 'text-white'); 
        button.classList.remove('text-gray-400');
        
        const tabId = button.getAttribute('data-tab'); 
        const tabContent = document.getElementById(tabId);
        if (tabContent) { 
          tabContent.classList.remove('hidden'); 
        }
      });
    });
  },
  
  // Setup range sliders
  setupSliders: function() {
    document.querySelectorAll('input[type="range"]').forEach(slider => {
      const valueDisplay = document.getElementById(`${slider.id}Value`);
      if (valueDisplay) { 
        valueDisplay.textContent = slider.value; 
        this.updateRangeColor(slider); 
        slider.addEventListener('input', () => { 
          valueDisplay.textContent = slider.value; 
          this.updateRangeColor(slider); 
        });
      }
    });
  },
  
  // Update range slider colors
  updateRangeColor: function(slider) { 
    const min = parseFloat(slider.min) || 0; 
    const max = parseFloat(slider.max) || 1; 
    const value = parseFloat(slider.value) || 0; 
    const percent = ((value - min) / (max - min)) * 100; 
    slider.style.setProperty('--value-percent', `${percent}%`);
  },

  // Setup file upload handlers
  setupFileHandlers: function() {
    this.handleImageInput();
    this.handleFileInput();
  },

  // Handle image uploads
  handleImageInput: function() {
    const imageInput = document.getElementById('imageInput');
    const imagePreviewArea = document.getElementById('imagePreviewArea');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    
    if (!imageInput || !imagePreviewArea || !imagePreviewContainer) return;
    
    imageInput.addEventListener('change', (event) => {
      try {
        const files = event.target.files;
        const maxFileSize = window.CONFIG.maxFileSize;
        const maxImages = window.CONFIG.maxImages;
        
        if (window.APP_STATE.attachedImages.length + files.length > maxImages) {
          this.showNotification(`Maximum ${maxImages} images allowed per request`);
          return;
        }
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          if (!file.type.startsWith('image/')) {
            this.showNotification(`${file.name} is not an image file`);
            continue;
          }
          
          if (file.size > maxFileSize) {
            this.showNotification(`Image ${file.name} is too large (max 10MB)`);
            continue;
          }
          
          if (window.APP_STATE.attachedImages.some(img => img.name === file.name && img.size === file.size)) {
            this.showNotification(`Image ${file.name} already attached`);
            continue;
          }
          
          window.APP_STATE.attachedImages.push(file);
          this.createImagePreview(file, imagePreviewContainer);
        }
        
        if (window.APP_STATE.attachedImages.length > 0) {
          imagePreviewArea.classList.remove('hidden');
        }
        
        imageInput.value = '';
      } catch (error) {
        window.ERROR_HANDLER.handleError(error, 'UI.handleImageInput');
        this.showNotification('Error uploading images.');
      }
    });
  },

  // Create image preview
  createImagePreview: function(file, container) {
    const imagePreview = document.createElement('div');
    imagePreview.className = 'relative bg-dark-700 rounded-lg border border-dark-600 overflow-hidden';
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.className = 'w-16 h-16 object-cover';
      img.src = e.target.result;
      
      const overlay = document.createElement('div');
      overlay.className = 'absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center';
      
      const removeButton = document.createElement('button');
      removeButton.className = 'bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition';
      removeButton.innerHTML = '×';
      removeButton.addEventListener('click', () => {
        window.APP_STATE.attachedImages = window.APP_STATE.attachedImages.filter(f => f !== file);
        imagePreview.remove();
        if (window.APP_STATE.attachedImages.length === 0) {
          document.getElementById('imagePreviewArea').classList.add('hidden');
        }
      });
      
      overlay.appendChild(removeButton);
      imagePreview.appendChild(img);
      imagePreview.appendChild(overlay);
      
      const fileName = document.createElement('div');
      fileName.className = 'absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs p-1 truncate';
      fileName.textContent = file.name.length > 12 ? file.name.substring(0, 9) + '...' : file.name;
      imagePreview.appendChild(fileName);
    };
    
    reader.readAsDataURL(file);
    container.appendChild(imagePreview);
  },

  // Handle file uploads
  handleFileInput: function() {
    const fileInput = document.getElementById('fileInput');
    const attachedFilesContainer = document.getElementById('attachedFiles');
    if (!fileInput || !attachedFilesContainer) return;
    
    fileInput.addEventListener('change', (event) => {
      try {
        const files = event.target.files;
        const maxFileSize = window.CONFIG.maxFileSize;
        
        if (files.length > 0) {
          attachedFilesContainer.classList.remove('hidden');
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.size > maxFileSize) { 
              this.showNotification(`File ${file.name} is too large (max 10MB)`); 
              continue; 
            }
            if (window.APP_STATE.attachedFiles.some(f => f.name === file.name && f.size === file.size)) { 
              this.showNotification(`File ${file.name} already attached`); 
              continue; 
            }
            window.APP_STATE.attachedFiles.push(file);
            this.createFilePreview(file, attachedFilesContainer);
          }
          fileInput.value = '';
        }
      } catch (error) { 
        window.ERROR_HANDLER.handleError(error, 'UI.handleFileInput');
        this.showNotification('Error uploading file.'); 
      }
    });
  },

  // Create file preview
  createFilePreview: function(file, container) {
    const filePreview = document.createElement('div');
    filePreview.className = 'relative bg-dark-700 rounded-lg p-2 border border-dark-600';
    
    const icon = document.createElement('div'); 
    icon.className = 'w-16 h-16 flex items-center justify-center bg-dark-600 rounded text-2xl'; 
    icon.textContent = this.getFileIcon(file.type); 
    filePreview.appendChild(icon);
    
    const fileName = document.createElement('div'); 
    fileName.className = 'mt-1 text-xs text-gray-400 text-center truncate w-16'; 
    fileName.textContent = file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name; 
    filePreview.appendChild(fileName);
    
    const removeButton = document.createElement('button'); 
    removeButton.className = 'absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs'; 
    removeButton.textContent = '×';
    removeButton.addEventListener('click', () => { 
      window.APP_STATE.attachedFiles = window.APP_STATE.attachedFiles.filter(f => f !== file); 
      filePreview.remove(); 
      if (window.APP_STATE.attachedFiles.length === 0) container.classList.add('hidden'); 
    });
    
    filePreview.appendChild(removeButton); 
    container.appendChild(filePreview);
  },

  // Get file type icon
  getFileIcon: function(fileType) {
    if (fileType.startsWith('image/')) return '🖼️'; 
    if (fileType.startsWith('text/')) return '📄'; 
    if (fileType.includes('pdf')) return '📑'; 
    if (fileType.includes('word') || fileType.includes('document')) return '📝'; 
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'; 
    if (fileType.includes('audio')) return '🎵'; 
    if (fileType.includes('video')) return '🎬'; 
    return '📦';
  }
};
