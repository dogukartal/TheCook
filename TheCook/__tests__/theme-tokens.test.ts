import { Colors } from '../constants/theme';

describe('Theme Token Parity', () => {
  test('Colors.light and Colors.dark have identical token keys', () => {
    const lightKeys = Object.keys(Colors.light).sort();
    const darkKeys = Object.keys(Colors.dark).sort();
    expect(lightKeys).toEqual(darkKeys);
  });

  test('no token value is undefined', () => {
    for (const [key, value] of Object.entries(Colors.light)) {
      expect(value).toBeDefined();
    }
    for (const [key, value] of Object.entries(Colors.dark)) {
      expect(value).toBeDefined();
    }
  });

  test('both modes have at least 20 tokens', () => {
    expect(Object.keys(Colors.light).length).toBeGreaterThanOrEqual(20);
    expect(Object.keys(Colors.dark).length).toBeGreaterThanOrEqual(20);
  });

  test('cardBorder token exists in both modes (UX-01)', () => {
    expect(Colors.light.cardBorder).toBeDefined();
    expect(Colors.dark.cardBorder).toBeDefined();
  });
});
