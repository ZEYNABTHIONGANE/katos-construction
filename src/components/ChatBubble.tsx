import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../types';

interface ChatBubbleProps {
  message: Message;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[styles.container, message.isFromUser ? styles.userContainer : styles.otherContainer]}>
      <View style={[styles.bubble, message.isFromUser ? styles.userBubble : styles.otherBubble]}>
        {!message.isFromUser && (
          <Text style={styles.senderName}>{message.senderName}</Text>
        )}
        <Text style={[styles.messageText, message.isFromUser ? styles.userText : styles.otherText]}>
          {message.text}
        </Text>
        <Text style={[styles.timestamp, message.isFromUser ? styles.userTimestamp : styles.otherTimestamp]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#2B2E83',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#F5F5F5',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'FiraSans_600SemiBold',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
    fontFamily: 'FiraSans_400Regular',
  },
  userText: {
    color: '#fff',
  },
  otherText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 11,
    alignSelf: 'flex-end',
    fontFamily: 'FiraSans_400Regular',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: '#999',
  },
});