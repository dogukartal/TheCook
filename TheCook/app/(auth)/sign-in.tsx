import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { supabase } from '../../src/auth/supabase';
import { useAppTheme } from '@/contexts/ThemeContext';
import { GOOGLE_BRAND_BLUE } from '@/constants/palette';

export default function SignInScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useAppTheme();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });
  }, []);

  function clearError() {
    setError(null);
  }

  async function handleAppleSignIn() {
    clearError();
    setLoading(true);
    try {
      // Generate nonce: raw nonce goes to Supabase, hashed nonce goes to Apple
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        setError('Apple Sign In failed — no identity token received.');
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Capture fullName immediately — Apple only returns it on first sign-in
      const firstName = credential.fullName?.givenName;
      const lastName = credential.fullName?.familyName;
      if (firstName || lastName) {
        const fullName = [firstName, lastName].filter(Boolean).join(' ');
        await supabase.auth.updateUser({ data: { full_name: fullName } });
      }

      router.replace('/(tabs)');
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      // User cancelled — silently ignore
      if (error?.code === 'ERR_CANCELED') {
        return;
      }
      setError(error?.message ?? 'Apple Sign In failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    clearError();
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        setError('Google Sign In failed — no ID token received.');
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.replace('/(tabs)');
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      // User cancelled — silently ignore
      if (
        error?.code === statusCodes.SIGN_IN_CANCELLED ||
        error?.code === String(statusCodes.SIGN_IN_CANCELLED)
      ) {
        return;
      }
      setError(error?.message ?? 'Google Sign In failed.');
    } finally {
      setLoading(false);
    }
  }

  function handleEmailPress() {
    clearError();
    router.push('/(auth)/sign-up');
  }

  function handleSkip() {
    router.replace('/(tabs)');
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.appName, { color: colors.text }]}>TheCook</Text>
        <Text style={[styles.tagline, { color: colors.textSub }]}>Your kitchen companion</Text>
      </View>

      {loading && (
        <ActivityIndicator
          size="large"
          color={colors.tint}
          style={styles.spinner}
        />
      )}

      {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}

      <View style={styles.authButtons}>
        {/* Apple Sign In — iOS only */}
        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={
              AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={8}
            style={styles.appleButton}
            onPress={handleAppleSignIn}
          />
        )}

        {/* Google Sign In */}
        <Pressable
          style={({ pressed }) => [
            styles.googleButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { backgroundColor: colors.card },
          ]}
          onPress={handleGoogleSignIn}
          disabled={loading}
          accessibilityLabel="Sign in with Google"
          accessibilityRole="button"
        >
          <Text style={[styles.googleIcon, { color: GOOGLE_BRAND_BLUE }]}>G</Text>
          <Text style={[styles.googleButtonText, { color: colors.text }]}>Sign in with Google</Text>
        </Pressable>

        {/* Email */}
        <Pressable
          style={({ pressed }) => [
            styles.emailButton,
            { backgroundColor: colors.tint },
            pressed && !loading && { opacity: 0.85 },
          ]}
          onPress={handleEmailPress}
          disabled={loading}
          accessibilityLabel="Sign in with email"
          accessibilityRole="button"
        >
          <Text style={[styles.emailButtonText, { color: colors.onTint }]}>Sign in with email</Text>
        </Pressable>
      </View>

      {/* Skip */}
      <Pressable
        onPress={handleSkip}
        disabled={loading}
        style={styles.skipButton}
        accessibilityLabel="Continue without account"
        accessibilityRole="button"
      >
        <Text style={[styles.skipText, { color: colors.textSub }]}>Continue without account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    marginTop: 8,
  },
  spinner: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  authButtons: {
    gap: 12,
  },
  appleButton: {
    width: '100%',
    height: 52,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    height: 52,
    borderWidth: 1,
    gap: 10,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emailButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 8,
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 32,
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
