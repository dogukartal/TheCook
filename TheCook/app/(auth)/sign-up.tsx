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

type Mode = 'signup' | 'signin';

export default function SignUpScreen() {
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      style={styles.keyboardView}
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
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>{title}</Text>

        {/* Email */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(v) => { clearMessages(); setEmail(v); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            placeholder="you@example.com"
            placeholderTextColor="#AAAAAA"
            editable={!loading}
          />
        </View>

        {/* Password */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={(v) => { clearMessages(); setPassword(v); }}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            textContentType={isSignUp ? 'newPassword' : 'password'}
            placeholder="Min 8 characters"
            placeholderTextColor="#AAAAAA"
            editable={!loading}
          />
        </View>

        {/* Confirm Password — sign-up mode only */}
        {isSignUp && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={(v) => { clearMessages(); setConfirmPassword(v); }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              placeholder="Repeat password"
              placeholderTextColor="#AAAAAA"
              editable={!loading}
            />
          </View>
        )}

        {/* Error / Success messages */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {successMessage ? (
          <Text style={styles.successText}>{successMessage}</Text>
        ) : null}

        {/* Submit */}
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            (loading || !!successMessage) && styles.submitButtonDisabled,
            pressed && !loading && styles.submitButtonPressed,
          ]}
          onPress={handleSubmit}
          disabled={loading || !!successMessage}
          accessibilityLabel={submitLabel}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>{submitLabel}</Text>
          )}
        </Pressable>

        {/* Toggle mode */}
        <Pressable
          onPress={toggleMode}
          disabled={loading}
          style={styles.toggleButton}
          accessibilityRole="button"
        >
          <Text style={styles.toggleText}>{toggleLabel}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: '#FAFAF8',
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
    color: '#E8612C',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 32,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3C3C3C',
    marginBottom: 6,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    marginBottom: 16,
  },
  successText: {
    color: '#2E7D32',
    fontSize: 14,
    marginBottom: 16,
  },
  submitButton: {
    height: 52,
    backgroundColor: '#E8612C',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#F5B89A',
  },
  submitButtonPressed: {
    backgroundColor: '#D4551F',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
  },
  toggleText: {
    fontSize: 15,
    color: '#6B6B6B',
    textDecorationLine: 'underline',
  },
});
