import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
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
}

export default function PhaseFeedbackSection({ chantierId, phaseId, stepId, title }: PhaseFeedbackSectionProps) {
  const { session } = useClientAuth();
  const [feedbacks, setFeedbacks] = useState<VoiceNoteFeedback[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = feedbackService.subscribeToStepFeedbacks(
      chantierId,
      phaseId,
      (newFeedbacks) => {
        setFeedbacks(newFeedbacks);
      },
      stepId
    );
    return () => unsubscribe();
  }, [chantierId, phaseId, stepId]);

  const handleRecordingComplete = async (uri: string, duration: number) => {
    // Determine the sender ID: use userId if available, otherwise clientId
    const senderId = session?.clientData?.userId || session?.clientId;
    if (!senderId) return;
    
    setUploading(true);
    try {
      const audioUrl = await feedbackService.uploadAudioFile(uri, chantierId);
      await feedbackService.createVoiceNote(
        chantierId,
        phaseId,
        senderId,
        audioUrl,
        duration,
        stepId
      );
    } catch (error) {
      console.error('Failed to send voice note', error);
    } finally {
      setUploading(false);
    }
  };

  const currentUserId = session?.clientData?.userId || session?.clientId;

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <StepFeedbackList 
        feedbacks={feedbacks} 
        currentUserId={currentUserId} 
      />
      
      <View style={styles.controls}>
         <Text style={styles.hintText}>Maintenir pour enregistrer une note</Text>
         <VoiceRecorderButton 
            onRecordingComplete={handleRecordingComplete} 
            isLoading={uploading}
         />
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
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 5,
  },
  hintText: {
      fontSize: 10,
      color: '#CCC',
      marginRight: 10,
      fontStyle: 'italic',
  }
});
