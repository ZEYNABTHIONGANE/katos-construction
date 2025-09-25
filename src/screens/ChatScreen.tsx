import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { AppTabsParamList } from '../navigation/RootNavigator';
import { useSessionStore } from '../store/session';
import { useMessages } from '../hooks/useMessages';
import { sendMessage, markAllMessagesAsRead } from '../services/messages';
import { Message } from '../types/message';

type Props = BottomTabScreenProps<AppTabsParamList, 'Chat'>;

export default function ChatScreen({ }: Props) {
  const { appUser, firebaseUser } = useSessionStore();
  const projectId = appUser?.projectId;

  // Hooks pour les messages
  const {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    loadOlder,
    refresh,
  } = useMessages(projectId);

  // État local pour l'input
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  // Référence pour auto-scroll
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll vers le bas quand nouveaux messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Marquer les messages comme lus quand l'écran est ouvert
  useEffect(() => {
    if (projectId && firebaseUser && messages.length > 0) {
      // Marquer tous les messages reçus comme lus
      const unreadMessages = messages.filter(msg =>
        msg.fromUid !== firebaseUser.uid && !msg.isRead
      );

      if (unreadMessages.length > 0) {
        markAllMessagesAsRead(projectId, firebaseUser.uid)
          .then(() => {
            console.log('✅ Messages marqués comme lus');
          })
          .catch((error) => {
            console.error('❌ Erreur marquage messages lus:', error);
          });
      }
    }
  }, [projectId, firebaseUser?.uid, messages.length]);

  // Fonction d'envoi de message
  const handleSendMessage = async () => {
    if (!inputText.trim() || !projectId || !firebaseUser) {
      return;
    }

    const messageText = inputText.trim();
    setInputText(''); // Vider l'input immédiatement pour UX
    setSending(true);

    try {
      await sendMessage(projectId, {
        fromUid: firebaseUser.uid,
        text: messageText,
      });

      console.log('✅ Message envoyé');
    } catch (error: any) {
      console.error('❌ Erreur envoi message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
      setInputText(messageText); // Remettre le texte en cas d'erreur
    } finally {
      setSending(false);
    }
  };

  // Fonction de rendu d'un message
  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.fromUid === firebaseUser?.uid;
    const messageTime = new Date(item.createdAt).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          ]}
        >
          {item.text && (
            <Text
              style={[
                styles.messageText,
                isCurrentUser ? styles.currentUserMessageText : styles.otherUserMessageText,
              ]}
            >
              {item.text}
            </Text>
          )}

          {item.mediaUrl && (
            <Text
              style={[
                styles.mediaPlaceholder,
                isCurrentUser ? styles.currentUserMessageText : styles.otherUserMessageText,
              ]}
            >
              📎 {item.mediaType || 'Média'}
            </Text>
          )}

          <Text
            style={[
              styles.timestampText,
              isCurrentUser ? styles.currentUserTimestamp : styles.otherUserTimestamp,
            ]}
          >
            {messageTime}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyMessages = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💬</Text>
      <Text style={styles.emptyTitle}>Aucun message pour le moment</Text>
      <Text style={styles.emptyText}>
        Commencez la conversation avec votre chef de projet.
      </Text>
    </View>
  );

  const loadMoreHeader = useMemo(() => {
    if (!hasMore) {
      return <View style={styles.listHeaderSpacer} />;
    }

    return (
      <View style={styles.loadMoreContainer}>
        <TouchableOpacity
          style={[styles.loadMoreButton, loadingMore && styles.loadMoreButtonDisabled]}
          onPress={loadOlder}
          disabled={loadingMore}
          accessibilityRole="button"
          accessibilityLabel="Charger les messages précédents"
          accessibilityState={{ disabled: loadingMore }}
        >
          {loadingMore ? (
            <ActivityIndicator size="small" color="#2E7D3E" />
          ) : (
            <Text style={styles.loadMoreText}>Charger les messages précédents</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }, [hasMore, loadingMore, loadOlder]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 Chat avec votre chef de projet</Text>
        <Text style={styles.headerSubtitle}>Échangez en temps réel</Text>
      </View>

      {/* Messages List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D3E" />
          <Text style={styles.loadingText}>Chargement des messages...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={
            messages.length === 0
              ? [styles.messagesContent, styles.emptyMessagesContent]
              : styles.messagesContent
          }
          ListEmptyComponent={!loading && !error ? renderEmptyMessages : undefined}
          ListHeaderComponent={loadMoreHeader}
          showsVerticalScrollIndicator={false}
          refreshing={loading && messages.length > 0}
          onRefresh={refresh}
        />
      )}

      {/* Input Container */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Tapez votre message..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
              editable={!sending}
              accessibilityLabel="Zone de saisie du message"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || sending) && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || sending}
              accessibilityRole="button"
              accessibilityLabel="Envoyer le message"
              accessibilityState={{ disabled: !inputText.trim() || sending }}
            >
              {sending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.sendButtonText}>Envoyer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
  },
  listHeaderSpacer: {
    height: 8,
  },
  loadMoreContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2E7D3E',
    backgroundColor: 'white',
  },
  loadMoreButtonDisabled: {
    opacity: 0.6,
  },
  loadMoreText: {
    color: '#2E7D3E',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyMessagesContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  messageContainer: {
    marginBottom: 15,
  },
  currentUserMessage: {
    alignItems: 'flex-end',
  },
  otherUserMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  currentUserBubble: {
    backgroundColor: '#2E7D3E',
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  currentUserMessageText: {
    color: 'white',
  },
  otherUserMessageText: {
    color: '#333',
  },
  mediaPlaceholder: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  timestampText: {
    fontSize: 11,
    marginTop: 4,
  },
  currentUserTimestamp: {
    color: 'rgba(255,255,255,0.8)',
  },
  otherUserTimestamp: {
    color: '#999',
  },
  inputContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f8f8f8',
  },
  sendButton: {
    backgroundColor: '#2E7D3E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
  },
});
