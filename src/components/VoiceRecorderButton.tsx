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
  const startTimeRef = React.useRef<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        // Update visual timer only, not used for final calculation
        if (startTimeRef.current) {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            setDuration(elapsed);
        }
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
      
      startTimeRef.current = Date.now();
      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (err: any) {
      console.error('Failed to start recording', err);
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

    setIsRecording(false); // Stop visually
    
    try {
        const status = await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
        });
        const uri = recording.getURI(); 
        
        // Calculate duration locally for reliability
        let finalDuration = 0;
        if (startTimeRef.current) {
            finalDuration = (Date.now() - startTimeRef.current) / 1000;
        }

        // Fallback to hardware duration if local failed for some reason, or verify?
        // Actually, local calculation is more robust against "0" hardware bugs.
        // But status.durationMillis is the *exact* audio file length.
        // Let's take the MAX of both to be safe? Or simple localized fallback.
        const hardwareDuration = status.durationMillis / 1000;
        
        if (hardwareDuration > 0) {
            finalDuration = hardwareDuration;
        } else if (finalDuration === 0) {
             // If both are 0, that's proper 0.
             console.warn('Duration 0 detected');
        }

        console.log('Recording stopped. Hardware Duration:', hardwareDuration, 'Local Calc:', finalDuration);
        
        startTimeRef.current = null;
        setRecording(undefined);
        
        if (uri && finalDuration > 0) {
            // Ensure we never send 0 duration
            onRecordingComplete(uri, finalDuration);
        } else if (uri) {
             // Fallback minimal duration if something went really wrong but we have file
             onRecordingComplete(uri, 1);
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
