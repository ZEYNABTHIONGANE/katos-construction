import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Text } from 'react-native';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';

interface VoiceRecorderButtonProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  isLoading?: boolean;
}

export default function VoiceRecorderButton({ onRecordingComplete, isLoading = false }: VoiceRecorderButtonProps) {
  const [recording, setRecording] = useState<Audio.Recording | undefined>(undefined);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  async function startRecording() {
    try {
      console.log('Requesting permission..');
      const permission = await requestPermission();
      if (permission.status !== 'granted') {
          Alert.alert('Permission refusée', 'Vous devez autoriser l\'accès au micro pour envoyer une note vocale. Allez dans les réglages pour l\'activer.');
          return;
      }

      console.log('Setting audio mode..');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync( 
         Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (err: any) {
      console.error('Failed to start recording', err);
      // More specific error message for session activation failure
      if (err.message && err.message.includes('Session activation failed')) {
         Alert.alert('Erreur micro', 'Impossible d\'activer la session audio. Veuillez redémarrer l\'application. Si le problème persiste, une nouvelle version (build) peut être nécessaire.');
      } else {
         Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement.');
      }
    }
  }

  async function stopRecording() {
    console.log('Stopping recording..');
    if (!recording) return;

    setIsRecording(false); // Stop timer visually first
    
    try {
        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
        });
        const uri = recording.getURI(); 
        const status = await recording.getStatusAsync();
        const durationMillis = status.durationMillis;
        
        console.log('Recording stopped and stored at', uri);
        
        setRecording(undefined);
        if (uri) {
            // Confirm send? Or just send automatically? 
            // For whatsapp style, usually slide to cancel, but simple tap/hold is easier for MVP.
            // Let's assume simple tap-to-start / tap-to-stop for reliability or simple hold.
            // Implementing Tap-to-Start / Tap-to-Stop behavior as it's more accessible than hold for some.
            // User requested "intuitive type message vocal whatsapp" -> usually hold.
            // But let's stick to simple Press In / Press Out for Hold behavior if we want WhatsApp style.
            
            onRecordingComplete(uri, durationMillis / 1000);
        }
    } catch (error) {
        console.error('Failed to stop recording', error);
    }
  }

  return (
    <View style={styles.container}>
      {isRecording && <Text style={styles.timer}>{new Date(duration * 1000).toISOString().substr(14, 5)}</Text>}
      
      <TouchableOpacity
        style={[styles.button, isRecording && styles.recordingButton]}
        onLongPress={startRecording}
        onPressOut={() => {
            if (isRecording) {
                stopRecording();
            }
        }}
        // Add minimal delay to prevent accidental triggers? 
        // LongPress usually has 500ms delay. 
        // Let's also support simple Press if user prefers toggle? 
        // No, strict WhatsApp style is Hold.
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <MaterialIcons 
            name={isRecording ? "mic" : "mic-none"} 
            size={24} 
            color="#FFF" 
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2B2E83', // Primary branding color
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  recordingButton: {
    backgroundColor: '#F44336', // Red when recording
    transform: [{ scale: 1.1 }],
  },
  timer: {
    marginRight: 8,
    fontSize: 14,
    color: '#F44336',
    fontFamily: 'FiraSans_600SemiBold',
  }
});
