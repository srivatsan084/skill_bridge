/**
 * Formatting and utility helpers for SkillBridge
 */

/**
 * Format percentage value
 */
export function formatPercentage(value) {
  if (value == null) return '0%';
  return `${Math.round(value)}%`;
}

/**
 * Truncate text cleanly with ellipsis
 */
export function truncate(text, maxChars = 100) {
  if (!text) return '';
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}...`;
}

/**
 * Get color variant for skill priority
 */
export function getPriorityVariant(priority) {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'rose';
    case 'medium':
      return 'amber';
    case 'low':
      return 'slate';
    default:
      return 'blue';
  }
}
