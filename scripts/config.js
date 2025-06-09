// Enhanced Configuration for DeepSeek V3-0324
window.CONFIG = {
  // Model Configuration - Fixed to DeepSeek V3-0324
  currentModel: "accounts/fireworks/models/deepseek-v3-0324",
  isVisionModel: false, // DeepSeek V3-0324 doesn't have vision capabilities
  
  // Enhanced Reasoning Configuration
  reasoningMethod: "enhanced_cod", // New enhanced method
  codWordLimit: 5, // Start with research-proven optimal
  reasoningEnhancement: "fixed", // "adaptive" or "fixed"
  
  // Two-Stage API Configuration
  enableTwoStageAPI: true,
  stage1_analysis: true,
  stage2_verification: true,
  
  // Reflection Configuration
  reflectionSettings: {
    enableSelfVerification: true,
    enableErrorDetection: true,
    enableAlternativeSearch: true,
    enableConfidenceAssessment: true,
    verificationDepth: "standard" // basic, standard, deep, research
  },
  
  // Generation Parameters (DeepSeek V3-0324 optimized)
  temperature: 0.3, // DeepSeek's optimal temperature
  topP: 0.9,
  topK: 40,
  maxTokens: 8192,
  enableStreaming: true,
  
  // Application Settings
  debug: false,
  maxRetries: 3,
  retryDelay: 1000,
  
  // UI Configuration
  animationsEnabled: true,
  autoScroll: true,
  compactMode: false,
  
  // File Upload Limits
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxImages: 30,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedFileTypes: ['text/plain', 'text/csv', 'application/pdf', 'application/json']
};

// Enhanced Prompts for DeepSeek V3-0324
window.ENHANCED_PROMPTS = {
  // Stage 1: Analysis + Initial CoD
  stage1_analysis_cod: (wordLimit) => `You are DeepSeek V3-0324, an advanced reasoning model. This is STAGE 1 of a two-stage enhanced reasoning process.

CRITICAL INSTRUCTIONS:
1. First, analyze the problem complexity and structure
2. Then apply Chain of Draft (CoD) methodology with EXACTLY ${wordLimit} words per step
3. Provide initial reflection on your reasoning
4. End with a draft solution

FORMAT:
#### PROBLEM ANALYSIS
[Analyze complexity, identify key components, determine approach]

#### CHAIN OF DRAFT STEPS
CoD Step 1: [${wordLimit} words maximum]
CoD Step 2: [${wordLimit} words maximum]
CoD Step 3: [${wordLimit} words maximum]
[Continue as needed...]

#### INITIAL REFLECTION
[Reflect on reasoning quality, identify potential issues, assess confidence]

#### DRAFT SOLUTION
[Provide initial solution based on CoD analysis]

Remember: This is STAGE 1. Be thorough but prepare for STAGE 2 verification.`,

  // Stage 2: Deep Verification + Final Answer
  stage2_verification: () => `You are DeepSeek V3-0324 in STAGE 2 of enhanced reasoning. You will now perform deep verification and provide the final comprehensive answer.

Your task:
1. CRITICALLY EXAMINE the Stage 1 analysis and CoD steps
2. VERIFY each reasoning step for accuracy and logical consistency
3. CHECK for mathematical errors, logical fallacies, or incomplete reasoning
4. EXPLORE alternative approaches if needed
5. ASSESS confidence levels and identify uncertainties
6. PROVIDE a comprehensive final answer

VERIFICATION CHECKLIST:
□ Are all CoD steps logically sound?
□ Are there any mathematical or computational errors?
□ Are assumptions clearly stated and reasonable?
□ Have alternative approaches been considered?
□ Is the reasoning complete and comprehensive?
□ Are there any gaps or weaknesses in the logic?

FORMAT:
#### STAGE 2 VERIFICATION
[Critical analysis of Stage 1 reasoning]

#### ERROR DETECTION & CORRECTION
[Identify and correct any errors found]

#### ALTERNATIVE APPROACH ANALYSIS
[Consider alternative solution paths]

#### CONFIDENCE ASSESSMENT
[Evaluate confidence levels and identify uncertainties]

#### FINAL COMPREHENSIVE ANSWER
[Definitive, well-reasoned solution with full explanation]

#### REFLECTION SUMMARY
[Key insights, lessons learned, and reasoning quality assessment]`
};

// Application State
window.APP_STATE = {
  threads: [],
  currentThreadId: null,
  threadCounter: 1,
  attachedFiles: [],
  attachedImages: [],
  isProcessing: false,
  lastError: null
};

// Adaptive Complexity Analysis
window.COMPLEXITY_ANALYZER = {
  analyzeComplexity: function(message) {
    const complexity = {
      // Basic indicators
      hasMath: /[\d\+\-\*\/\=\(\)\^\%√∫∑∏]/.test(message),
      hasLogic: /\b(if|then|else|because|therefore|since|implies|prove|logic|reasoning|analyze|compare|evaluate|assess)\b/i.test(message),
      multiStep: /\b(first|next|then|after|finally|step|calculate|find|determine|process|stages?|phases?)\b/i.test(message),
      
      // Research indicators
      hasResearch: /\b(research|study|investigate|explore|examine|review|analysis|synthesis|comprehensive|methodology)\b/i.test(message),
      hasScientific: /\b(hypothesis|theory|experiment|data|statistical|scientific|empirical|peer.review|literature)\b/i.test(message),
      
      // Technical indicators
      hasCoding: /\b(code|programming|algorithm|function|class|variable|debug|implement|develop|software)\b/i.test(message),
      hasEngineering: /\b(design|optimization|system|architecture|performance|efficiency|scalability)\b/i.test(message),
      
      // Advanced indicators
      hasPhilosophy: /\b(ethics|moral|philosophical|ontology|epistemology|metaphysics|consciousness)\b/i.test(message),
      hasEconomics: /\b(economic|financial|market|trade|investment|fiscal|monetary|GDP|inflation)\b/i.test(message),
      hasMedicine: /\b(medical|clinical|diagnosis|treatment|patient|therapy|pharmaceutical|biological)\b/i.test(message),
      
      // Complexity metrics
      wordCount: this.countWords(message),
      sentenceCount: (message.match(/[.!?]+/g) || []).length,
      questionWords: (message.match(/\b(what|how|why|when|where|which|who)\b/gi) || []).length,
      isLong: message.length > 300,
      hasMultipleQuestions: (message.match(/\?/g) || []).length > 1
    };

    // Enhanced scoring system
    let score = 0;
    if (complexity.hasMath) score += 2;
    if (complexity.hasLogic) score += 1;
    if (complexity.multiStep) score += 1;
    if (complexity.hasResearch) score += 3;
    if (complexity.hasScientific) score += 2;
    if (complexity.hasCoding) score += 1;
    if (complexity.hasEngineering) score += 1;
    if (complexity.hasPhilosophy) score += 2;
    if (complexity.hasEconomics) score += 1;
    if (complexity.hasMedicine) score += 2;
    if (complexity.isLong) score += 1;
    if (complexity.hasMultipleQuestions) score += 1;
    if (complexity.questionWords > 3) score += 1;
    if (complexity.sentenceCount > 10) score += 1;

    // Determine complexity level
    if (score >= 8) {
      complexity.level = 'research_grade';
      complexity.recommendedWordLimit = 15;
      complexity.recommendedVerification = 'research';
    } else if (score >= 6) {
      complexity.level = 'highly_complex';
      complexity.recommendedWordLimit = 12;
      complexity.recommendedVerification = 'deep';
    } else if (score >= 4) {
      complexity.level = 'complex';
      complexity.recommendedWordLimit = 8;
      complexity.recommendedVerification = 'standard';
    } else if (score >= 2) {
      complexity.level = 'moderate';
      complexity.recommendedWordLimit = 5;
      complexity.recommendedVerification = 'standard';
    } else {
      complexity.level = 'simple';
      complexity.recommendedWordLimit = 5;
      complexity.recommendedVerification = 'basic';
    }

    complexity.score = score;
    return complexity;
  },

  countWords: function(text) {
    if (!text) return 0;
    const textWithoutCode = text.replace(/```[\s\S]*?```/g, '');
    let processedText = textWithoutCode.replace(/\b\w+\s*=\s*[\d\w+\-*/()]+/g, "EQUATION").replace(/\b\d+\/\d+\b/g, "FRACTION").replace(/[+\-*/=<>]+/g, " ");
    return processedText.split(/\s+/).filter(word => word.length > 0).length;
  },

  getAdaptiveSettings: function(message) {
    if (window.CONFIG.reasoningEnhancement !== 'adaptive') {
      return {
        method: window.CONFIG.reasoningMethod,
        wordLimit: window.CONFIG.codWordLimit,
        verificationDepth: window.CONFIG.reflectionSettings.verificationDepth,
        adapted: false
      };
    }

    const complexity = this.analyzeComplexity(message);
    let adaptedWordLimit = complexity.recommendedWordLimit;
    let adaptedVerification = complexity.recommendedVerification;
    let reasoning = '';

    switch (complexity.level) {
      case 'research_grade':
        reasoning = 'Research-grade complexity detected - using extensive CoD steps with deep verification';
        break;
      case 'highly_complex':
        reasoning = 'Highly complex problem detected - using expanded CoD with comprehensive verification';
        break;
      case 'complex':
        reasoning = 'Complex problem detected - using moderate CoD expansion with standard verification';
        break;
      case 'moderate':
        reasoning = 'Moderate complexity detected - using balanced CoD approach';
        break;
      case 'simple':
        reasoning = 'Simple problem detected - using concise CoD steps';
        break;
    }

    return {
      method: window.CONFIG.reasoningMethod,
      wordLimit: adaptedWordLimit,
      verificationDepth: adaptedVerification,
      complexity: complexity,
      adapted: adaptedWordLimit !== window.CONFIG.codWordLimit || adaptedVerification !== window.CONFIG.reflectionSettings.verificationDepth,
      reasoning: reasoning
    };
  }
};

// Error Handler
window.ERROR_HANDLER = {
  handleError: function(error, context = '') {
    console.error(`Error in ${context}:`, error);
    
    window.APP_STATE.lastError = {
      message: error.message,
      context: context,
      timestamp: new Date().toISOString()
    };

    // Show user-friendly error message
    if (window.UI && window.UI.showNotification) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        window.UI.showNotification('Network error. Please check your connection.', 5000);
      } else if (error.message.includes('API')) {
        window.UI.showNotification('API error. Please try again.', 5000);
      } else {
        window.UI.showNotification('An error occurred. Please try again.', 5000);
      }
    }

    // Log to external service in production
    if (!window.CONFIG.debug) {
      // Send to logging service
    }

    return false;
  },

  showErrorBoundary: function(error) {
    const errorBoundary = document.getElementById('errorBoundary');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorBoundary && errorMessage) {
      errorMessage.textContent = error.message || 'An unexpected error occurred.';
      errorBoundary.classList.remove('hidden');
    }
  }
};

// Storage Manager
window.STORAGE = {
  save: function(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Storage save error:', error);
      return false;
    }
  },

  load: function(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error('Storage load error:', error);
      return defaultValue;
    }
  },

  remove: function(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  },

  clear: function() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }
};

// Performance Monitor
window.PERFORMANCE = {
  startTimer: function(name) {
    if (window.CONFIG.debug) {
      console.time(name);
    }
  },

  endTimer: function(name) {
    if (window.CONFIG.debug) {
      console.timeEnd(name);
    }
  },

  mark: function(name) {
    if (window.CONFIG.debug && performance.mark) {
      performance.mark(name);
    }
  }
};

// Initialize error boundary
document.addEventListener('DOMContentLoaded', function() {
  const reloadButton = document.getElementById('reloadApp');
  if (reloadButton) {
    reloadButton.addEventListener('click', function() {
      location.reload();
    });
  }

  // Global error handler
  window.addEventListener('error', function(event) {
    window.ERROR_HANDLER.showErrorBoundary(event.error);
  });

  window.addEventListener('unhandledrejection', function(event) {
    window.ERROR_HANDLER.showErrorBoundary(new Error(event.reason));
  });
});
