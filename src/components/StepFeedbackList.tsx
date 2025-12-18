import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { VoiceNoteFeedback } from '../types/firebase';
import { useUserNames } from '../hooks/useUserNames';

interface StepFeedbackListProps {
  feedbacks: VoiceNoteFeedback[];
  currentUserId?: string; // To mark as read or distinguish own messages
}

export default function StepFeedbackList({ feedbacks, currentUserId }: StepFeedbackListProps) {
  const [sound, setSound] = useState<Audio.Sound>();
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  // Collect all unique user IDs to fetch names
  const userIds = Array.from(new Set(feedbacks.map(f => f.clientId)));
  const { getUserName } = useUserNames(userIds);

  async function playSound(uri: string, id: string) {
    try {
      if (sound) {
        await sound.unloadAsync();
        setPlayingId(null);
        // If clicking the same one, just stop.
        if (playingId === id) return; 
      }

      console.log('Loading Sound');
      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      setSound(newSound);
      setPlayingId(id);

      console.log('Playing Sound');
      await newSound.playAsync();

      newSound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
            setPlayingId(null);
            await newSound.unloadAsync();
        }
      });
    } catch (error) {
       console.error("Error playing audio", error);
    }
  }

  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading Sound');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const renderItem = ({ item }: { item: VoiceNoteFeedback }) => {
    const isMe = item.clientId === currentUserId;
    const isPlaying = playingId === item.id;
    const formattedDate = item.createdAt?.toDate?.()?.toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    }) || '';
    
    // Get sender name (or "Moi" if it's the current user, though checking clientId matches session uid is safer)
    const senderName = isMe ? 'Moi' : getUserName(item.clientId) || 'Utilisateur';

    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.otherMessage]}>
        <View style={[styles.bubble, isMe && styles.myBubble]}>
            <View style={styles.headerRow}>
                 <Text style={[styles.senderName, isMe && styles.textWhiteLight]}>{senderName}</Text>
                 <Text style={[styles.timestamp, isMe && styles.textWhiteLight]}>{formattedDate}</Text>
            </View>
            <View style={styles.contentRow}>
                <TouchableOpacity onPress={() => playSound(item.audioUrl, item.id)}>
                    <MaterialIcons 
                        name={isPlaying ? "stop-circle" : "play-circle-filled"} 
                        size={32} 
                        color={isMe ? "#FFF" : "#2B2E83"} 
                    />
                </TouchableOpacity>
                <View style={styles.waveformPlaceholder}>
                     {/* Visual filler for waveform */}
                     <View style={[styles.line, isMe ? styles.lineWhite : styles.lineBlue, { height: 10 }]} />
                     <View style={[styles.line, isMe ? styles.lineWhite : styles.lineBlue, { height: 20 }]} />
                     <View style={[styles.line, isMe ? styles.lineWhite : styles.lineBlue, { height: 15 }]} />
                     <View style={[styles.line, isMe ? styles.lineWhite : styles.lineBlue, { height: 25 }]} />
                     <View style={[styles.line, isMe ? styles.lineWhite : styles.lineBlue, { height: 12 }]} />
                </View>
                <Text style={[styles.duration, isMe ? styles.textWhite : styles.textBlue]}>
                    {Math.round(item.duration)}s
                </Text>
            </View>
        </View>
      </View>
    );
  };

  if (feedbacks.length === 0) return null; // Don't show anything if no feedbacks

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={feedbacks}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        scrollEnabled={false} // Nested inside scrollview usually
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '85%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  bubble: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    minWidth: 150,
  },
  myBubble: {
    backgroundColor: '#2B2E83', // Brand color for my messages
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  senderName: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#666',
      marginRight: 8,
  },
  timestamp: {
      fontSize: 10,
      color: '#999',
  },
  contentRow: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  waveformPlaceholder: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-evenly', // Distributed lines
      marginHorizontal: 10,
      height: 30, // Fixed height for lines
  },
  line: {
      width: 3,
      borderRadius: 1.5,
      backgroundColor: '#2B2E83',
  },
  lineBlue: {
      backgroundColor: '#2B2E83',
  },
  lineWhite: {
      backgroundColor: 'rgba(255,255,255,0.7)',
  },
  duration: {
      fontSize: 12,
      fontWeight: '600',
  },
  textBlue: {
      color: '#2B2E83',
  },
  textWhite: {
    color: '#FFF',
  },
  textWhiteLight: {
    color: 'rgba(255,255,255,0.7)',
  }
});
