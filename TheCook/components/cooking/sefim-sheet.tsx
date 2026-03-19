import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from '@jamsch/expo-speech-recognition';

import { useAppTheme } from '@/contexts/ThemeContext';
import type { SefimQA } from '@/src/types/recipe';
import type { SefimMessage } from '@/src/hooks/useSefim';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SefimSheetProps {
  visible: boolean;
  onClose: () => void;
  chips: SefimQA[];
  messages: SefimMessage[];
  isLoading: boolean;
  onChipTap: (qa: SefimQA) => void;
  onSendQuestion: (text: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SefimSheet({
  visible,
  onClose,
  chips,
  messages,
  isLoading,
  onChipTap,
  onSendQuestion,
}: SefimSheetProps) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const { isDark, colors } = useAppTheme();

  // -------------------------------------------------------------------------
  // Auto-scroll to bottom when messages change
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, isLoading]);

  // -------------------------------------------------------------------------
  // Speech recognition events
  // -------------------------------------------------------------------------

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript) {
      setText(transcript);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setIsRecording(false);
  });

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendQuestion(trimmed);
    setText('');
  }

  function handleChipPress(qa: SefimQA) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChipTap(qa);
  }

  async function handleMicPress() {
    if (isRecording) {
      ExpoSpeechRecognitionModule.stop();
      setIsRecording(false);
      return;
    }

    const { granted } = await ExpoSpeechRecognitionModule.getPermissionsAsync();
    if (!granted) {
      const { granted: newGranted } =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!newGranted) {
        Alert.alert('Mikrofon izni gerekli', 'Ses tanima icin mikrofon erisimi gereklidir.');
        return;
      }
    }

    setIsRecording(true);
    ExpoSpeechRecognitionModule.start({
      lang: 'tr-TR',
      interimResults: false,
    });
  }

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  const askedQuestions = new Set(
    messages.filter((m) => m.role === 'user' && m.isChip).map((m) => m.text),
  );
  const availableChips = chips.filter((qa) => !askedQuestions.has(qa.question));
  const showChips = availableChips.length > 0;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.overlayDismiss} onPress={onClose} />
        <View style={[styles.sheetContainer, { backgroundColor: isDark ? colors.card : colors.background }]}>
          {/* Handle bar */}
          <View style={styles.handleBarRow}>
            <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Sef'im</Text>
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
            >
              <MaterialCommunityIcons name="close" size={24} color={colors.textSub} />
            </Pressable>
          </View>

          {/* Q&A chips */}
          {showChips && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.chipsRow, { borderBottomColor: colors.border }]}
              contentContainerStyle={styles.chipsContent}
            >
              {availableChips.map((qa, idx) => (
                <Pressable
                  key={idx}
                  style={[styles.chip, { backgroundColor: colors.tintBg, borderColor: colors.tint }]}
                  onPress={() => handleChipPress(qa)}
                  accessibilityRole="button"
                >
                  <Text style={[styles.chipText, { color: colors.tint }]}>{qa.question}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* Messages area */}
          <ScrollView
            ref={scrollRef}
            style={styles.messagesArea}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg, idx) => (
              <View
                key={idx}
                style={[
                  styles.messageBubble,
                  msg.role === 'user'
                    ? [styles.userBubble, { backgroundColor: colors.tint }]
                    : [styles.assistantBubble, { backgroundColor: colors.card }],
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    { color: colors.text },
                    msg.role === 'user' && { color: colors.onTint },
                  ]}
                >
                  {msg.text}
                </Text>
              </View>
            ))}
            {isLoading && (
              <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: colors.card }]}>
                <Text style={[styles.loadingText, { color: colors.textSub }]}>Sef'im dusunuyor...</Text>
              </View>
            )}
          </ScrollView>

          {/* Input row */}
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              value={text}
              onChangeText={setText}
              placeholder="Bir soru sor..."
              placeholderTextColor={colors.textMuted}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <Pressable
              style={styles.sendButton}
              onPress={handleSend}
              accessibilityRole="button"
              accessibilityLabel="Gonder"
            >
              <MaterialCommunityIcons name="send" size={22} color={colors.tint} />
            </Pressable>
            <Pressable
              style={[styles.micButton, isRecording && { backgroundColor: colors.error }]}
              onPress={handleMicPress}
              accessibilityRole="button"
              accessibilityLabel="Sesli soru"
            >
              <MaterialCommunityIcons
                name="microphone"
                size={22}
                color={isRecording ? colors.onTint : colors.tint}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayDismiss: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  handleBarRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  // Chips
  chipsRow: {
    height: 56,
    flexShrink: 0,
    borderBottomWidth: 1,
  },
  chipsContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Messages
  messagesArea: {
    flexGrow: 1,
    minHeight: 120,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendButton: {
    padding: 8,
  },
  micButton: {
    padding: 8,
    borderRadius: 20,
  },
});
