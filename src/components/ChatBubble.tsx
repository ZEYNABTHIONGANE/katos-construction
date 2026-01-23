import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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

        {/* Attachment rendering */}
        {message.attachmentType === 'image' && message.attachmentUrl && (
          <TouchableOpacity style={styles.imageContainer}>
            <Image source={{ uri: message.attachmentUrl }} style={styles.attachedImage} />
          </TouchableOpacity>
        )}

        {message.attachmentType === 'document' && message.attachmentName && (
          <TouchableOpacity style={styles.documentContainer}>
            <MaterialIcons name="description" size={24} color={message.isFromUser ? '#FFFFFF' : '#2B2E83'} />
            <Text style={[styles.documentName, message.isFromUser ? styles.userText : styles.otherText]}>
              {message.attachmentName}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.messageText, message.isFromUser ? styles.userText : styles.otherText]}>
          {message.text}
        </Text>

        <View style={styles.messageFooter}>
          <Text style={[styles.timestamp, message.isFromUser ? styles.userTimestamp : styles.otherTimestamp]}>
            {formatTime(message.timestamp)}
          </Text>
          {message.isFromUser && (
            <MaterialIcons
              name={message.isRead ? "done-all" : "done"}
              size={14}
              color={message.isRead ? "#4CAF50" : "rgba(255, 255, 255, 0.7)"}
              style={styles.readIndicator}
            />
          )}
        </View>
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
    fontFamily: 'FiraSans_400Regular',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: '#999',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  readIndicator: {
    marginLeft: 4,
  },
  imageContainer: {
    marginBottom: 8,
  },
  attachedImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  documentName: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'FiraSans_600SemiBold',
    flex: 1,
  },
});