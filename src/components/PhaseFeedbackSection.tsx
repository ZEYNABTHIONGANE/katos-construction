import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import VoiceRecorderButton from './VoiceRecorderButton';
import StepFeedbackList from './StepFeedbackList';
import { feedbackService } from '../services/feedbackService';
import { useClientAuth } from '../hooks/useClientAuth';
import { VoiceNoteFeedback } from '../types/firebase';

interface PhaseFeedbackSectionProps {
  chantierId: string;
  phaseId: string;
  stepId?: string;
  title?: string;
  currentUserId?: string;
}

export default function PhaseFeedbackSection({ chantierId, phaseId, stepId, title, currentUserId: propUserId }: PhaseFeedbackSectionProps) {
  const { session } = useClientAuth();
  const [feedbacks, setFeedbacks] = useState<VoiceNoteFeedback[]>([]);
  const [uploading, setUploading] = useState(false);
  const [text, setText] = useState('');

  // Determine effective user ID
  const effectiveUserId = propUserId || session?.clientData?.userId || session?.clientId;

  useEffect(() => {
    if (!effectiveUserId) return;

    const unsubscribe = feedbackService.subscribeToStepFeedbacks(
      chantierId,
      phaseId,
      (newFeedbacks) => {
        setFeedbacks(newFeedbacks);
      },
      stepId
    );
    return () => unsubscribe();
  }, [chantierId, phaseId, stepId, effectiveUserId]);

  const handleRecordingComplete = async (uri: string, duration: number) => {
    if (!effectiveUserId) return;

    setUploading(true);
    try {
      const audioUrl = await feedbackService.uploadAudioFile(uri, chantierId);
      await feedbackService.createVoiceNote(
        chantierId,
        phaseId,
        effectiveUserId,
        audioUrl,
        duration,
        stepId
      );
    } catch (error: any) {
      console.error('Failed to send voice note', error);
      Alert.alert(
        'Erreur d\'envoi',
        'Impossible d\'envoyer la note vocale. Veuillez vérifier votre connexion. ' +
        (error.message ? `\nDétails: ${error.message}` : '')
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSendText = async () => {
    if (!text.trim() || !effectiveUserId) return;

    const messageToSend = text.trim();
    setText(''); // Optimistic clear

    try {
      await feedbackService.createTextMessage(
        chantierId,
        phaseId,
        effectiveUserId,
        messageToSend,
        stepId
      );
    } catch (error) {
      console.error("Failed to send text", error);
      setText(messageToSend); // Restore on error
    }
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      <StepFeedbackList
        feedbacks={feedbacks}
        currentUserId={effectiveUserId}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Écrire un message..."
          placeholderTextColor="#999"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
        />

        {text.trim().length > 0 ? (
          <TouchableOpacity onPress={handleSendText} style={styles.sendButton} disabled={!effectiveUserId}>
            <MaterialIcons name="send" size={24} color="#2B2E83" />
          </TouchableOpacity>
        ) : (
          <View style={styles.micContainer}>
            <VoiceRecorderButton
              onRecordingComplete={handleRecordingComplete}
              isLoading={uploading}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 10,
  },
  title: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
    fontFamily: 'FiraSans_600SemiBold',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minHeight: 50,
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#333',
  },
  sendButton: {
    padding: 10,
  },
  micContainer: {
    // Adjust if needed to align mic button
  }
});
