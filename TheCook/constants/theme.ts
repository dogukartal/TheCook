/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#E8834A';
const tintColorDark = '#E8834A';

export const Colors = {
  light: {
    text: '#1A1A18',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#9CA3AF',
    tabIconDefault: 'rgba(26,26,24,0.35)',
    tabIconSelected: tintColorLight,
    surface: '#F5F4F0',
    card: '#F0EDE8',
    border: 'rgba(0,0,0,0.08)',
    textSub: 'rgba(26,26,24,0.5)',
    textMuted: 'rgba(26,26,24,0.28)',
  },
  dark: {
    text: '#F0EDE6',
    background: '#0C0C0A',
    tint: tintColorDark,
    icon: '#5A5A56',
    tabIconDefault: '#5A5A56',
    tabIconSelected: tintColorDark,
    surface: '#111110',
    card: '#161614',
    border: 'rgba(255,255,255,0.07)',
    textSub: 'rgba(240,237,230,0.45)',
    textMuted: 'rgba(240,237,230,0.25)',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
