/**
 * Estimates the campaign delivery cost based on volume (in KES).
 */
export function calculateCampaignCost(volume: number, discountApplied: boolean = false): number {
  if (volume <= 0) return 0;
  
  // KES pricing tiers
  let rate = 0.85; // Base/small volume rate
  
  if (volume >= 1000000) {
    rate = 0.45; // High-volume Enterprise tier
  } else if (volume >= 100000) {
    rate = 0.60; // Growth tier
  } else if (volume >= 10000) {
    rate = 0.80; // Starter tier
  }
  
  const rawCost = volume * rate;
  return discountApplied ? rawCost * 0.9 : rawCost; // 10% discount for promo
}

/**
 * Strips formatting to get the raw numeric rate or value
 */
export function parseLatencyString(latencyStr: string): number {
  const match = latencyStr.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * Formats a message count for display
 */
export function formatMessageCount(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(0) + 'B+';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(0) + 'M+';
  }
  return num.toLocaleString();
}

/**
 * Searches B2B FAQ items for a specific query keyword
 */
export function filterFAQByQuery<T extends { question: string; answer: string }>(
  faqs: T[],
  query: string
): T[] {
  if (!query) return faqs;
  const cleanQuery = query.toLowerCase().trim();
  return faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(cleanQuery) ||
      faq.answer.toLowerCase().includes(cleanQuery)
  );
}

/**
 * Formats an amount in KES currency.
 */
export function formatKESCurrency(amount: number): string {
  return 'KES ' + amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Returns the CSS class names for scroll transitions.
 */
export function getScrollAnimationClass(type: 'fade' | 'slide-up' | 'slide-left' | 'slide-right'): string {
  switch (type) {
    case 'slide-up': return 'translate-y-8 opacity-0 transition-all duration-700 ease-out';
    case 'slide-left': return '-translate-x-8 opacity-0 transition-all duration-700 ease-out';
    case 'slide-right': return 'translate-x-8 opacity-0 transition-all duration-700 ease-out';
    case 'fade':
    default:
      return 'opacity-0 transition-opacity duration-700 ease-out';
  }
}
