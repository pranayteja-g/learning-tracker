/**
 * Robust JSON parsing utility with multiple fallback strategies.
 * Handles:
 * - JSON wrapped in markdown code blocks
 * - Truncated/partial JSON responses from APIs
 * - Both object and array responses
 * - Salvaging complete objects from truncated arrays
 */

/**
 * Parse JSON with multiple fallback strategies
 * @param {string} text - Raw text that may contain JSON
 * @param {object} options - Configuration options
 * @returns {object|array} - Parsed JSON
 * @throws {Error} - If parsing fails completely
 */
export function safeParseJSON(text, options = {}) {
  const { throwOnError = true, salvagePartial = true } = options;

  if (!text || typeof text !== "string") {
    if (throwOnError) throw new Error("Invalid input: expected non-empty string");
    return null;
  }

  // Clean markdown code blocks
  let cleaned = text
    .replace(/```json\n?/gi, "")
    .replace(/```\n?/g, "")
    .trim();

  if (!cleaned) {
    if (throwOnError) throw new Error("Empty JSON string after cleanup");
    return null;
  }

  // Strategy 1: Try full parse
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    // Continue to fallback strategies
  }

  // Strategy 2: Extract first complete JSON object or array
  try {
    const firstBrace = cleaned.indexOf("{");
    const firstBracket = cleaned.indexOf("[");
    const isArray = firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace);

    if (isArray) {
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) return JSON.parse(match[0]);
    } else {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    }
  } catch (_) {
    // Continue to salvage strategy
  }

  // Strategy 3: Salvage complete objects from truncated array
  if (salvagePartial && cleaned.trimStart().startsWith("[")) {
    try {
      const items = [];
      const objRx = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
      let m;
      while ((m = objRx.exec(cleaned)) !== null) {
        try {
          items.push(JSON.parse(m[0]));
        } catch (_) {
          // Skip unparseable objects
        }
      }
      if (items.length > 0) {
        console.warn(`[safeParseJSON] Salvaged ${items.length} items from truncated response`);
        return items;
      }
    } catch (_) {
      // Fall through to error
    }
  }

  // All strategies failed
  if (throwOnError) {
    throw new Error("Couldn't parse AI response. Please try again.");
  }
  return null;
}

/**
 * Parse JSON with a simpler approach (for simple responses)
 * @param {string} text - Raw text containing JSON
 * @returns {object} - Parsed JSON
 * @throws {Error} - If parsing fails
 */
export function simpleSafeParseJSON(text) {
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error("Couldn't parse AI response. Please try again.");
  }
}
