import { describe, it, expect } from 'vitest';
import { 
  calculateCampaignCost, 
  parseLatencyString, 
  formatMessageCount, 
  filterFAQByQuery,
  formatKESCurrency,
  getScrollAnimationClass
} from './utils';

describe('Trackom B2B SaaS Logic Test Suite', () => {
  it('correctly calculates tiers of campaign volume cost in KES', () => {
    // Basic tier (< 10k messages)
    expect(calculateCampaignCost(1000)).toBe(850); // 1000 * 0.85 = 850
    
    // Starter tier (10k <= v < 100k)
    expect(calculateCampaignCost(10000)).toBe(8000); // 10000 * 0.80 = 8000
    
    // Growth tier (100k <= v < 1M)
    expect(calculateCampaignCost(100000)).toBe(60000); // 100000 * 0.60 = 60000
    
    // High-volume Enterprise tier (>= 1M)
    expect(calculateCampaignCost(2000000)).toBe(900000); // 2000000 * 0.45 = 900000
  });

  it('applies the 10% promotional discount tier correctly', () => {
    const originalCost = calculateCampaignCost(50000, false);
    const discountedCost = calculateCampaignCost(50000, true);
    
    expect(discountedCost).toBe(originalCost * 0.9);
  });

  it('handles negative or zero volume inputs', () => {
    expect(calculateCampaignCost(0)).toBe(0);
    expect(calculateCampaignCost(-10)).toBe(0);
  });

  it('parses latency strings into raw numbers', () => {
    expect(parseLatencyString('< 200ms')).toBe(200);
    expect(parseLatencyString('120 milliseconds')).toBe(120);
    expect(parseLatencyString('0')).toBe(0);
  });

  it('formats large numbers cleanly for dashboard display', () => {
    expect(formatMessageCount(12000000000)).toBe('12B+');
    expect(formatMessageCount(45000000)).toBe('45M+');
    expect(formatMessageCount(5000)).toBe('5,000');
  });

  it('correctly filters B2B FAQs based on a search query', () => {
    const mockFaqs = [
      { question: 'What is the pricing?', answer: 'Pricing starts at KES 0.80.' },
      { question: 'What are rate limits?', answer: 'Default limits are high.' },
      { question: 'How is data synced?', answer: 'Using Webhooks and API.' }
    ];

    // Empty query returns all results
    expect(filterFAQByQuery(mockFaqs, '')).toHaveLength(3);
    expect(filterFAQByQuery(mockFaqs, '   ')).toHaveLength(3);

    // Filter by question keyword
    const pricingResult = filterFAQByQuery(mockFaqs, 'pricing');
    expect(pricingResult).toHaveLength(1);
    expect(pricingResult[0].question).toBe('What is the pricing?');

    // Filter by answer keyword
    const syncResult = filterFAQByQuery(mockFaqs, 'webhooks');
    expect(syncResult).toHaveLength(1);
    expect(syncResult[0].question).toBe('How is data synced?');

    // Mismatched search returns empty
    const mismatch = filterFAQByQuery(mockFaqs, 'not-present');
    expect(mismatch).toHaveLength(0);
  });

  it('formats KES currency values correctly', () => {
    expect(formatKESCurrency(1250.5)).toBe('KES 1,250.50');
    expect(formatKESCurrency(0)).toBe('KES 0.00');
  });

  it('returns appropriate scroll animation class names', () => {
    expect(getScrollAnimationClass('slide-up')).toContain('translate-y-8');
    expect(getScrollAnimationClass('fade')).toContain('opacity-0');
  });
});
