import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../src/auth/supabase';
import { useAppTheme } from '@/contexts/ThemeContext';

type Mode = 'signup' | 'signin';

export default function SignUpScreen() {
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { colors } = useAppTheme();

  function clearMessages() {
    setError(null);
    setSuccessMessage(null);
  }

  function validate(): string | null {
    if (!email.includes('@')) {
      return 'Please enter a valid email address.';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    if (mode === 'signup' && password !== confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  }

  async function handleSubmit() {
    clearMessages();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        setSuccessMessage('Check your email to confirm your account.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          // Do not reveal whether it was email or password that was wrong
          setError('Invalid email or password.');
          return;
        }
        router.replace('/(tabs)');
      }
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    clearMessages();
    setMode((prev) => (prev === 'signup' ? 'signin' : 'signup'));
  }

  function handleBack() {
    router.back();
  }

  const isSignUp = mode === 'signup';
  const title = isSignUp ? 'Create account' : 'Sign in';
  const submitLabel = isSignUp ? 'Sign up' : 'Sign in';
  const toggleLabel = isSignUp
    ? 'Already have an account? Sign in'
    : 'No account? Sign up';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.keyboardView, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Text style={[styles.backText, { color: colors.tint }]}>← Back</Text>
        </Pressable>

        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

        {/* Email */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            value={email}
            onChangeText={(v) => { clearMessages(); setEmail(v); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            placeholder="you@example.com"
            placeholderTextColor={colors.placeholder}
            editable={!loading}
          />
        </View>

        {/* Password */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            value={password}
            onChangeText={(v) => { clearMessages(); setPassword(v); }}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            textContentType={isSignUp ? 'newPassword' : 'password'}
            placeholder="Min 8 characters"
            placeholderTextColor={colors.placeholder}
            editable={!loading}
          />
        </View>

        {/* Confirm Password — sign-up mode only */}
        {isSignUp && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              value={confirmPassword}
              onChangeText={(v) => { clearMessages(); setConfirmPassword(v); }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              placeholder="Repeat password"
              placeholderTextColor={colors.placeholder}
              editable={!loading}
            />
          </View>
        )}

        {/* Error / Success messages */}
        {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}
        {successMessage ? (
          <Text style={[styles.successText, { color: colors.success }]}>{successMessage}</Text>
        ) : null}

        {/* Submit */}
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            { backgroundColor: colors.tint },
            (loading || !!successMessage) && { opacity: 0.5 },
            pressed && !loading && { opacity: 0.85 },
          ]}
          onPress={handleSubmit}
          disabled={loading || !!successMessage}
          accessibilityLabel={submitLabel}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color={colors.onTint} />
          ) : (
            <Text style={[styles.submitText, { color: colors.onTint }]}>{submitLabel}</Text>
          )}
        </Pressable>

        {/* Toggle mode */}
        <Pressable
          onPress={toggleMode}
          disabled={loading}
          style={styles.toggleButton}
          accessibilityRole="button"
        >
          <Text style={[styles.toggleText, { color: colors.textSub }]}>{toggleLabel}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 24,
  },
  backText: {
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 32,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
  },
  successText: {
    fontSize: 14,
    marginBottom: 16,
  },
  submitButton: {
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
  },
  toggleText: {
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
