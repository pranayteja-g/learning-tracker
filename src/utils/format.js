/**
 * Utility functions for formatting numbers and other values
 */

/**
 * Format large numbers for display (1000 -> "1k", 1500 -> "1.5k")
 * @param {number} n - Number to format
 * @returns {string} - Formatted number
 */
export function formatNumber(n) {
  if (n >= 1000) {
    return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return String(n);
}

/**
 * Format percentage with optional decimal places
 * @param {number} value - Number representing percentage (0-100)
 * @param {number} decimals - Number of decimal places (default 0)
 * @returns {string} - Formatted percentage with % symbol
 */
export function formatPercent(value, decimals = 0) {
  return (Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals) + "%";
}

/**
 * Format time duration in milliseconds to readable format
 * @param {number} ms - Duration in milliseconds
 * @returns {string} - Human readable duration (e.g., "2h 30m", "45s")
 */
export function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format seconds to MM:SS time format
 * @param {number} seconds - Total seconds
 * @returns {string} - Formatted time (e.g., "02:45", "01:05")
 */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
