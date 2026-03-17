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
  const [chipsUsed, setChipsUsed] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

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
    setChipsUsed(true);
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

  const showChips = chips.length > 0 && !chipsUsed && messages.length === 0;

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
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.overlayDismiss} onPress={onClose} />
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Sef'im</Text>
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
            >
              <MaterialCommunityIcons name="close" size={24} color="#374151" />
            </Pressable>
          </View>

          {/* Q&A chips */}
          {showChips && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsRow}
              contentContainerStyle={styles.chipsContent}
            >
              {chips.map((qa, idx) => (
                <Pressable
                  key={idx}
                  style={styles.chip}
                  onPress={() => handleChipPress(qa)}
                  accessibilityRole="button"
                >
                  <Text style={styles.chipText}>{qa.question}</Text>
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
                    ? styles.userBubble
                    : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.role === 'user' && styles.userMessageText,
                  ]}
                >
                  {msg.text}
                </Text>
              </View>
            ))}
            {isLoading && (
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <Text style={styles.loadingText}>Sef'im dusunuyor...</Text>
              </View>
            )}
          </ScrollView>

          {/* Input row */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={text}
              onChangeText={setText}
              placeholder="Bir soru sor..."
              placeholderTextColor="#9CA3AF"
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <Pressable
              style={styles.sendButton}
              onPress={handleSend}
              accessibilityRole="button"
              accessibilityLabel="Gonder"
            >
              <MaterialCommunityIcons name="send" size={22} color="#E07B39" />
            </Pressable>
            <Pressable
              style={[styles.micButton, isRecording && styles.micButtonActive]}
              onPress={handleMicPress}
              accessibilityRole="button"
              accessibilityLabel="Sesli soru"
            >
              <MaterialCommunityIcons
                name="microphone"
                size={22}
                color={isRecording ? '#FFFFFF' : '#E07B39'}
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  overlayDismiss: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  // Chips
  chipsRow: {
    maxHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  chipsContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    backgroundColor: '#FEF3EC',
    borderWidth: 1,
    borderColor: '#E07B39',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    color: '#E07B39',
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
    backgroundColor: '#E07B39',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
  },
  messageText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
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
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  sendButton: {
    padding: 8,
  },
  micButton: {
    padding: 8,
    borderRadius: 20,
  },
  micButtonActive: {
    backgroundColor: '#EF4444',
  },
});
