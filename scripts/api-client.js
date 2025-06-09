// Enhanced API Client for DeepSeek V3-0324
window.API_CLIENT = {
  
  // Main API call method
  callDeepSeekAPI: async function(messages, options = {}) {
    const payload = {
      model: window.CONFIG.currentModel,
      messages: messages,
      temperature: options.temperature || window.CONFIG.temperature,
      top_p: options.topP || window.CONFIG.topP,
      top_k: options.topK || window.CONFIG.topK,
      max_tokens: options.maxTokens || window.CONFIG.maxTokens,
      stream: options.stream !== undefined ? options.stream : false
    };
    
    try {
      const response = await fetch('/api/chat', {
        method: "POST",
        headers: {
          "Accept": options.stream ? "text/event-stream" : "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: response.statusText || "Unknown error" };
        }
        throw new Error(`DeepSeek API Error: ${response.status} - ${errorData.fault?.faultstring || errorData.message || 'Unknown error'}`);
      }
      
      if (options.stream) {
        return response;
      } else {
        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error("Invalid DeepSeek API response format");
        }
        
        return {
          content: data.choices[0].message.content || "",
          usage: data.usage
        };
      }
    } catch (error) {
      window.ERROR_HANDLER.handleError(error, 'API_CLIENT.callDeepSeekAPI');
      throw error;
    }
  },

  // Streaming API call with real-time updates
  callDeepSeekAPIWithStreaming: async function(messages, messageIndex, stage = '') {
    if (!window.CONFIG.enableStreaming) {
      return await this.callDeepSeekAPI(messages);
    }
    
    try {
      const response = await this.callDeepSeekAPI(messages, { stream: true });
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let usage = null;
      
      const thread = window.APP_STATE.threads.find(t => t.id === window.APP_STATE.currentThreadId);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                const delta = parsed.choices[0].delta;
                if (delta.content) {
                  fullContent += delta.content;
                  
                  // Update the message in real-time
                  if (thread && thread.messages[messageIndex]) {
                    thread.messages[messageIndex].content = fullContent;
                    thread.messages[messageIndex].isStreaming = true;
                    
                    // Trigger UI update
                    if (window.UI && window.UI.renderCurrentThreadMessages) {
                      window.UI.renderCurrentThreadMessages();
                    }
                  }
                }
              }
              
              if (parsed.usage) {
                usage = parsed.usage;
              }
            } catch (e) {
              // Skip invalid JSON
              continue;
            }
          }
        }
      }
      
      // Mark streaming as complete
      if (thread && thread.messages[messageIndex]) {
        thread.messages[messageIndex].isStreaming = false;
        if (window.UI && window.UI.renderCurrentThreadMessages) {
          window.UI.renderCurrentThreadMessages();
        }
      }
      
      return {
        content: fullContent,
        usage: usage
      };
      
    } catch (error) {
      window.ERROR_HANDLER.handleError(error, 'API_CLIENT.callDeepSeekAPIWithStreaming');
      throw error;
    }
  },

  // Enhanced CoD message processing
  sendEnhancedCoDMessage: async function(message) {
    const adaptiveSettings = window.COMPLEXITY_ANALYZER.getAdaptiveSettings(message);
    
    // Add user message to thread
    window.THREAD_MANAGER.addMessageToCurrentThread(
      message, 
      "user", 
      false, 
      window.APP_STATE.attachedFiles.map(f => ({name: f.name, type: f.type, size: f.size})),
      window.APP_STATE.attachedImages.map(img => ({name: img.name, type: img.type, size: img.size}))
    );
    
    const imagesToSend = [...window.APP_STATE.attachedImages];
    window.APP_STATE.attachedFiles = [];
    window.APP_STATE.attachedImages = [];
    
    if (window.UI && window.UI.clearAttachedFiles) {
      window.UI.clearAttachedFiles();
    }
    
    const thread = window.APP_STATE.threads.find(t => t.id === window.APP_STATE.currentThreadId);
    const startTime = performance.now();
    
    if (window.UI && window.UI.showProgress) {
      window.UI.showProgress(true, 0);
    }
    
    // Show adaptive notification if reasoning was adapted
    if (adaptiveSettings.adapted && adaptiveSettings.reasoning && window.UI && window.UI.showNotification) {
      window.UI.showNotification(adaptiveSettings.reasoning, 4000);
    }
    
    try {
      // STAGE 1: Analysis + Initial CoD with Streaming
      window.THREAD_MANAGER.addMessageToCurrentThread(
        "🔍 Stage 1: Analyzing problem and applying Chain of Draft methodology...", 
        "bot", 
        false, 
        [], 
        [], 
        'enhanced_cod_stage1', 
        'Stage 1: Analysis + Chain of Draft'
      );
      
      if (window.UI && window.UI.showProgress) {
        window.UI.showProgress(true, 25);
      }
      
      let placeholderIndex = thread.messages.length - 1;
      
      // Build Stage 1 messages
      let stage1Messages = [
        { 
          role: "system", 
          content: window.ENHANCED_PROMPTS.stage1_analysis_cod(adaptiveSettings.wordLimit)
        },
        { 
          role: "user", 
          content: `Please analyze and solve this problem using enhanced Chain of Draft methodology:\n\n${message}` 
        }
      ];
      
      // Add images if available (vision models only)
      if (window.CONFIG.isVisionModel && imagesToSend.length > 0) {
        stage1Messages = await this.buildMessagesWithImages(stage1Messages, imagesToSend);
      }
      
      const stage1Result = await this.callDeepSeekAPIWithStreaming(stage1Messages, placeholderIndex, 'Stage 1');
      const stage1EndTime = performance.now();
      
      thread.messages[placeholderIndex] = {
        content: stage1Result.content,
        sender: "bot",
        isPlaceholder: false,
        timestamp: new Date(),
        wordCount: window.COMPLEXITY_ANALYZER.countWords(stage1Result.content),
        stageType: 'enhanced_cod_stage1',
        stageInfo: "Stage 1: Analysis + Chain of Draft",
        reasoning: adaptiveSettings.adapted ? adaptiveSettings.reasoning : null,
        wordLimit: adaptiveSettings.wordLimit,
        durationSeconds: ((stage1EndTime - startTime) / 1000).toFixed(2),
        totalTokens: stage1Result.usage?.total_tokens
      };
      
      if (window.UI && window.UI.renderCurrentThreadMessages) {
        window.UI.renderCurrentThreadMessages();
      }
      
      if (window.UI && window.UI.showProgress) {
        window.UI.showProgress(true, 50);
      }
      
      // Brief pause between stages
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // STAGE 2: Deep Verification + Final Answer with Streaming
      window.THREAD_MANAGER.addMessageToCurrentThread(
        "🔬 Stage 2: Deep verification and comprehensive analysis...", 
        "bot", 
        false, 
        [], 
        [], 
        'enhanced_verification', 
        'Stage 2: Verification + Final Answer'
      );
      
      if (window.UI && window.UI.showProgress) {
        window.UI.showProgress(true, 75);
      }
      
      placeholderIndex = thread.messages.length - 1;
      
      // Build Stage 2 messages with Stage 1 context
      const stage2Messages = [
        { 
          role: "system", 
          content: window.ENHANCED_PROMPTS.stage2_verification()
        },
        { 
          role: "user", 
          content: `Original Problem: ${message}\n\nSTAGE 1 ANALYSIS AND COD RESULTS:\n${stage1Result.content}\n\nPlease perform Stage 2 verification and provide the final comprehensive answer.` 
        }
      ];
      
      const stage2Result = await this.callDeepSeekAPIWithStreaming(stage2Messages, placeholderIndex, 'Stage 2');
      const endTime = performance.now();
      
      thread.messages[placeholderIndex] = {
        content: stage2Result.content,
        sender: "bot",
        isPlaceholder: false,
        timestamp: new Date(),
        wordCount: window.COMPLEXITY_ANALYZER.countWords(stage2Result.content),
        stageType: 'enhanced_verification',
        stageInfo: "Stage 2: Verification + Final Answer",
        durationSeconds: ((endTime - stage1EndTime) / 1000).toFixed(2),
        totalTokens: stage2Result.usage?.total_tokens,
        totalProcessingTime: ((endTime - startTime) / 1000).toFixed(2)
      };
      
      if (window.UI && window.UI.renderCurrentThreadMessages) {
        window.UI.renderCurrentThreadMessages();
      }
      
      if (window.UI && window.UI.showProgress) {
        window.UI.showProgress(true, 100);
      }
      
      setTimeout(() => {
        if (window.UI && window.UI.showProgress) {
          window.UI.showProgress(false);
        }
      }, 1000);
      
      if (window.UI && window.UI.showNotification) {
        window.UI.showNotification(`Enhanced CoD completed with ${adaptiveSettings.wordLimit} words/step!`);
      }
      
    } catch (error) {
      window.ERROR_HANDLER.handleError(error, 'API_CLIENT.sendEnhancedCoDMessage');
      
      if (window.UI && window.UI.showProgress) {
        window.UI.showProgress(false);
      }
      
      const placeholderIndex = thread.messages.length - 1;
      if (placeholderIndex >= 0) {
        thread.messages[placeholderIndex] = {
          content: `Error in enhanced CoD processing: ${error.message}`,
          sender: "bot",
          isPlaceholder: false,
          timestamp: new Date(),
          wordCount: 0
        };
        
        if (window.UI && window.UI.renderCurrentThreadMessages) {
          window.UI.renderCurrentThreadMessages();
        }
      }
    }
  },

  // Standard message processing
  sendStandardMessage: async function(message) {
    window.THREAD_MANAGER.addMessageToCurrentThread(message, "user", false, [], []);
    window.THREAD_MANAGER.addMessageToCurrentThread("Thinking...", "bot", true);
    
    const thread = window.APP_STATE.threads.find(t => t.id === window.APP_STATE.currentThreadId);
    const placeholderIndex = thread.messages.length - 1;
    const startTime = performance.now();
    
    try {
      const messages = [{ role: "user", content: message }];
      
      if (window.CONFIG.enableStreaming) {
        const response = await this.callDeepSeekAPIWithStreaming(messages, placeholderIndex, 'Standard');
        const endTime = performance.now();
        
        thread.messages[placeholderIndex] = {
          content: response.content,
          sender: "bot",
          isPlaceholder: false,
          timestamp: new Date(),
          wordCount: window.COMPLEXITY_ANALYZER.countWords(response.content),
          durationSeconds: ((endTime - startTime) / 1000).toFixed(2),
          totalTokens: response.usage?.total_tokens
        };
      } else {
        const response = await this.callDeepSeekAPI(messages);
        const endTime = performance.now();
        
        thread.messages[placeholderIndex] = {
          content: response.content,
          sender: "bot",
          isPlaceholder: false,
          timestamp: new Date(),
          wordCount: window.COMPLEXITY_ANALYZER.countWords(response.content),
          durationSeconds: ((endTime - startTime) / 1000).toFixed(2),
          totalTokens: response.usage?.total_tokens
        };
      }
      
      if (window.UI && window.UI.renderCurrentThreadMessages) {
        window.UI.renderCurrentThreadMessages();
      }
      
    } catch (error) {
      window.ERROR_HANDLER.handleError(error, 'API_CLIENT.sendStandardMessage');
      
      thread.messages[placeholderIndex] = {
        content: `Error: ${error.message}`,
        sender: "bot",
        isPlaceholder: false,
        timestamp: new Date(),
        wordCount: 0
      };
      
      if (window.UI && window.UI.renderCurrentThreadMessages) {
        window.UI.renderCurrentThreadMessages();
      }
    }
  },

  // Main message sending dispatcher
  sendMessage: async function(message) {
    if (window.APP_STATE.isProcessing) {
      if (window.UI && window.UI.showNotification) {
        window.UI.showNotification("Please wait for the current request to complete.");
      }
      return;
    }
    
    window.APP_STATE.isProcessing = true;
    
    try {
      if (window.CONFIG.reasoningMethod === "standard") {
        await this.sendStandardMessage(message);
      } else if (window.CONFIG.reasoningMethod === "enhanced_cod") {
        await this.sendEnhancedCoDMessage(message);
      }
    } finally {
      window.APP_STATE.isProcessing = false;
    }
  },

  // Helper function for building messages with images (future use)
  buildMessagesWithImages: async function(messages, images) {
    // Implementation for vision models when available
    // For now, DeepSeek V3-0324 doesn't support vision
    return messages;
  }
};
