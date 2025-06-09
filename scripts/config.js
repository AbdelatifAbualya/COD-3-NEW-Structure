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
  
  // Generation Parameters (DeepSeek V3-0
