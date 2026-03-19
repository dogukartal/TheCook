// Mock AsyncStorage (required by ThemeContext -> feed-section import chain)
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

import { calculateCardWidth } from '@/components/ui/feed-section';

// ---------------------------------------------------------------------------
// Constants mirroring feed-section.tsx
// ---------------------------------------------------------------------------

const HORIZONTAL_PADDING = 16;
const CARD_GAP = 12;

/**
 * Helper: compute the visible peek of the 3rd card.
 * usable = screenWidth - 2 * padding
 * Two full cards + their gaps = 2 * cardWidth + 1 * gap  (gap between card 1-2)
 * peek = usable - (2 * cardWidth + gap)
 */
function peekWidth(screenWidth: number): number {
  const cardWidth = calculateCardWidth(screenWidth);
  const usable = screenWidth - 2 * HORIZONTAL_PADDING;
  return usable - (2 * cardWidth + CARD_GAP);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('calculateCardWidth', () => {
  test('iPhone 15 (393px): shows ~2.3 cards with peek >= 25px', () => {
    const cardWidth = calculateCardWidth(393);
    const peek = peekWidth(393);
    // Card width should be reasonable (145-160px range)
    expect(cardWidth).toBeGreaterThanOrEqual(145);
    expect(cardWidth).toBeLessThanOrEqual(160);
    // Peek of the 3rd card should be at least 25px
    expect(peek).toBeGreaterThanOrEqual(25);
  });

  test('iPhone SE (375px): still shows meaningful 3rd card peek >= 20px', () => {
    const cardWidth = calculateCardWidth(375);
    const peek = peekWidth(375);
    expect(cardWidth).toBeGreaterThanOrEqual(140);
    expect(cardWidth).toBeLessThanOrEqual(160);
    expect(peek).toBeGreaterThanOrEqual(20);
  });

  test('iPhone Pro Max (430px): no more than 2.5 cards visible', () => {
    const cardWidth = calculateCardWidth(430);
    const usable = 430 - 2 * HORIZONTAL_PADDING;
    // 2.5 cards means: 2.5 * cardWidth + 1.5 * gap <= usable
    const visibleCards = (usable + CARD_GAP) / (cardWidth + CARD_GAP);
    expect(visibleCards).toBeLessThanOrEqual(2.5);
    expect(visibleCards).toBeGreaterThanOrEqual(2.2);
  });

  test('returns integer value (Math.floor)', () => {
    expect(Number.isInteger(calculateCardWidth(393))).toBe(true);
    expect(Number.isInteger(calculateCardWidth(375))).toBe(true);
    expect(Number.isInteger(calculateCardWidth(430))).toBe(true);
  });
});
