/**
 * Input validation utilities for AI API calls
 * Validates parameters before sending requests to prevent wasted tokens and bad requests
 */

/**
 * Validates AI call parameters
 * @param {Object} params - Parameters to validate
 * @returns {Object} - { isValid: boolean, error?: string }
 */
export function validateAICall(params) {
  const { provider, apiKey, systemPrompt, userPrompt, temperature, maxTokens } = params;

  // Validate provider
  if (!provider) {
    return { isValid: false, error: "Provider not specified" };
  }
  if (!["groq", "gemini"].includes(provider)) {
    return { isValid: false, error: `Unknown provider: ${provider}` };
  }

  // Validate API key
  if (!apiKey || typeof apiKey !== "string") {
    return { isValid: false, error: `${provider} API key is required` };
  }
  if (apiKey.trim().length === 0) {
    return { isValid: false, error: `${provider} API key cannot be empty` };
  }

  // Validate system prompt
  if (!systemPrompt || typeof systemPrompt !== "string") {
    return { isValid: false, error: "System prompt is required" };
  }
  if (systemPrompt.trim().length === 0) {
    return { isValid: false, error: "System prompt cannot be empty" };
  }

  // Validate user prompt
  if (!userPrompt || typeof userPrompt !== "string") {
    return { isValid: false, error: "User prompt is required" };
  }
  if (userPrompt.trim().length === 0) {
    return { isValid: false, error: "User prompt cannot be empty" };
  }

  // Validate temperature
  if (temperature !== undefined && temperature !== null) {
    if (typeof temperature !== "number") {
      return { isValid: false, error: "Temperature must be a number" };
    }
    if (temperature < 0 || temperature > 2) {
      return { isValid: false, error: "Temperature must be between 0 and 2" };
    }
  }

  // Validate maxTokens
  if (maxTokens !== undefined && maxTokens !== null) {
    if (typeof maxTokens !== "number") {
      return { isValid: false, error: "Max tokens must be a number" };
    }
    if (maxTokens < 1 || maxTokens > 32000) {
      return { isValid: false, error: "Max tokens must be between 1 and 32000" };
    }
  }

  return { isValid: true };
}

/**
 * Validates search call parameters
 * @param {Object} params - Parameters to validate
 * @returns {Object} - { isValid: boolean, error?: string }
 */
export function validateSearchCall(params) {
  const { provider, apiKey, systemPrompt, userPrompt } = params;

  // Validate provider
  if (!provider) {
    return { isValid: false, error: "Provider not specified" };
  }
  if (!["groq", "gemini"].includes(provider)) {
    return { isValid: false, error: `Unknown provider: ${provider}` };
  }

  // Validate API key
  if (!apiKey || typeof apiKey !== "string") {
    return { isValid: false, error: `${provider} API key is required` };
  }
  if (apiKey.trim().length === 0) {
    return { isValid: false, error: `${provider} API key cannot be empty` };
  }

  // Validate system prompt
  if (!systemPrompt || typeof systemPrompt !== "string") {
    return { isValid: false, error: "System prompt is required" };
  }
  if (systemPrompt.trim().length === 0) {
    return { isValid: false, error: "System prompt cannot be empty" };
  }

  // Validate user prompt
  if (!userPrompt || typeof userPrompt !== "string") {
    return { isValid: false, error: "User prompt is required" };
  }
  if (userPrompt.trim().length === 0) {
    return { isValid: false, error: "User prompt cannot be empty" };
  }

  return { isValid: true };
}

/**
 * Validates messages array for multi-turn conversations
 * @param {Array} messages - Array of messages
 * @returns {Object} - { isValid: boolean, error?: string }
 */
export function validateMessages(messages) {
  if (!Array.isArray(messages)) {
    return { isValid: false, error: "Messages must be an array" };
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg.role || !msg.content) {
      return { isValid: false, error: `Message ${i} must have role and content` };
    }
    if (!["user", "assistant", "system"].includes(msg.role)) {
      return { isValid: false, error: `Message ${i} has invalid role: ${msg.role}` };
    }
    if (typeof msg.content !== "string" || msg.content.trim().length === 0) {
      return { isValid: false, error: `Message ${i} content cannot be empty` };
    }
  }

  return { isValid: true };
}
