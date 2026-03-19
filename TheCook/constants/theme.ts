/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1A1A18',
    background: '#FFFFFF',
    tint: '#E8834A',
    icon: '#9CA3AF',
    tabIconDefault: 'rgba(26,26,24,0.35)',
    tabIconSelected: '#E8834A',
    surface: '#F5F4F0',
    card: '#F0EDE8',
    border: 'rgba(0,0,0,0.08)',
    textSub: 'rgba(26,26,24,0.5)',
    textMuted: 'rgba(26,26,24,0.28)',

    // Brand / accent
    tintBg: '#FEF3EC',
    onTint: '#FFFFFF',

    // Text variants
    textSecondary: 'rgba(26,26,24,0.65)',

    // Card system (UX-01)
    cardBorder: 'rgba(0,0,0,0.06)',
    shadow: '#000000',

    // Semantic status
    success: '#16A34A',
    successBg: '#F0FDF4',
    warning: '#D97706',
    warningBg: '#FFFBEB',
    error: '#DC2626',
    errorBg: '#FEF2F2',

    // Interactive
    disabledIcon: '#D1D5DB',
    overlay: 'rgba(0,0,0,0.4)',

    // Skeleton / placeholder
    skeleton: '#E8E4DC',
    placeholder: 'rgba(26,26,24,0.35)',

    // Input
    inputBg: '#F5F4F0',

    // Dividers
    separator: 'rgba(0,0,0,0.05)',
  },
  dark: {
    text: '#F0EDE6',
    background: '#0C0C0A',
    tint: '#E8834A',
    icon: '#5A5A56',
    tabIconDefault: '#5A5A56',
    tabIconSelected: '#E8834A',
    surface: '#111110',
    card: '#161614',
    border: 'rgba(255,255,255,0.07)',
    textSub: 'rgba(240,237,230,0.45)',
    textMuted: 'rgba(240,237,230,0.25)',

    // Brand / accent
    tintBg: 'rgba(232,131,74,0.15)',
    onTint: '#FFFFFF',

    // Text variants
    textSecondary: 'rgba(240,237,230,0.65)',

    // Card system (UX-01)
    cardBorder: 'rgba(255,255,255,0.06)',
    shadow: '#000000',

    // Semantic status
    success: '#16A34A',
    successBg: 'rgba(22,163,74,0.12)',
    warning: '#FBBF24',
    warningBg: 'rgba(217,119,6,0.12)',
    error: '#EF4444',
    errorBg: 'rgba(239,68,68,0.1)',

    // Interactive
    disabledIcon: 'rgba(255,255,255,0.15)',
    overlay: 'rgba(0,0,0,0.4)',

    // Skeleton / placeholder
    skeleton: '#1E1E1B',
    placeholder: 'rgba(240,237,230,0.35)',

    // Input
    inputBg: '#1E1E1C',

    // Dividers
    separator: 'rgba(255,255,255,0.06)',
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
