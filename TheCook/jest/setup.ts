// jest/setup.ts — Force resolution of expo's lazy globals before tests run.
//
// Root cause: jest-expo installs globals lazily via expo/src/winter/runtime.native.ts.
// When jest tears down after a real it() test run, it iterates Object.keys(envGlobal)
// in resetModules(). At that point isInsideTestCode === false (set by leaveTestCode
// after the last test). Accessing enumerable lazy getters triggers require() calls
// which fail with "You are trying to import a file outside of the scope of the test code."
//
// Fix: force ALL lazy expo globals to resolve here (setupFilesAfterEnv — runs before
// each test file, with isInsideTestCode === undefined, bypassing the false-check).
// After resolution, the lazy getter is replaced by a concrete value and Object.keys
// at teardown no longer triggers require() calls.
//
// References: jest-runtime/build/index.js resetModules(), leaveTestCode()
//             expo/src/winter/runtime.native.ts (lazy installs)
//             jest-circus/build/jestAdapterInit.js (enterTestCode/leaveTestCode events)

void (globalThis as Record<string, unknown>).TextDecoder;
void (globalThis as Record<string, unknown>).TextDecoderStream;
void (globalThis as Record<string, unknown>).TextEncoderStream;
void (globalThis as Record<string, unknown>).URL;
void (globalThis as Record<string, unknown>).URLSearchParams;
void (globalThis as Record<string, unknown>).__ExpoImportMetaRegistry;
void (globalThis as Record<string, unknown>).structuredClone;

// expo-image has native code that crashes in jest without a mock.
// Provide a lightweight substitute so downstream component tests can render.
jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: View,
    ImageBackground: View,
  };
});
