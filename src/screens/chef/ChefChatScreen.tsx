import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChefTabParamList } from '../../types';
import AppHeader from '../../components/AppHeader';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<ChefTabParamList, 'ChefChat'>;

interface ChatConversation {
  id: string;
  clientName: string;
  clientAvatar: string;
  projectName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  isFromChef: boolean;
}

const mockConversations: ChatConversation[] = [
  {
    id: '1',
    clientName: 'Moussa Diop',
    clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    projectName: 'Villa Moderne',
    lastMessage: 'Merci pour les photos, ça avance bien !',
    lastMessageTime: '14:30',
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: '2',
    clientName: 'SARL Teranga',
    clientAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
    projectName: 'Immeuble Commercial',
    lastMessage: 'Quand pouvons-nous programmer la visite ?',
    lastMessageTime: '11:45',
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: '3',
    clientName: 'Fatou Kane',
    clientAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b742?w=150&h=150&fit=crop&crop=face',
    projectName: 'Rénovation Appartement',
    lastMessage: 'Je suis très satisfaite du résultat',
    lastMessageTime: 'Hier',
    unreadCount: 1,
    isOnline: true,
  },
  {
    id: '4',
    clientName: 'Omar Niang',
    clientAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    projectName: 'Maison Familiale',
    lastMessage: 'D\'accord pour le rendez-vous de demain',
    lastMessageTime: 'Hier',
    unreadCount: 0,
    isOnline: false,
  },
];

const mockMessages: { [key: string]: ChatMessage[] } = {
  '1': [
    {
      id: '1',
      text: 'Bonjour M. Diop, j\'espère que vous allez bien. Les travaux de toiture avancent bien.',
      senderId: 'chef',
      senderName: 'Ibrahima Sarr',
      timestamp: '09:30',
      isFromChef: true,
    },
    {
      id: '2',
      text: 'Bonjour ! Parfait, pouvez-vous m\'envoyer quelques photos ?',
      senderId: '1',
      senderName: 'Moussa Diop',
      timestamp: '10:15',
      isFromChef: false,
    },
    {
      id: '3',
      text: 'Bien sûr, je vous envoie ça dans 5 minutes',
      senderId: 'chef',
      senderName: 'Ibrahima Sarr',
      timestamp: '10:16',
      isFromChef: true,
    },
    {
      id: '4',
      text: 'Merci pour les photos, ça avance bien !',
      senderId: '1',
      senderName: 'Moussa Diop',
      timestamp: '14:30',
      isFromChef: false,
    },
  ],
  '2': [
    {
      id: '1',
      text: 'Bonjour, nous aimerions faire une visite du chantier cette semaine',
      senderId: '2',
      senderName: 'SARL Teranga',
      timestamp: '11:30',
      isFromChef: false,
    },
    {
      id: '2',
      text: 'Bonjour ! Parfait, quel jour vous conviendrait le mieux ?',
      senderId: 'chef',
      senderName: 'Ibrahima Sarr',
      timestamp: '11:32',
      isFromChef: true,
    },
    {
      id: '3',
      text: 'Quand pouvons-nous programmer la visite ?',
      senderId: '2',
      senderName: 'SARL Teranga',
      timestamp: '11:45',
      isFromChef: false,
    },
  ],
};

export default function ChefChatScreen({ navigation }: Props) {
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const openConversation = (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
    setMessages(mockMessages[conversation.id] || []);
    setShowChatModal(true);
  };

  const sendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        text: newMessage.trim(),
        senderId: 'chef',
        senderName: 'Ibrahima Sarr',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFromChef: true,
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  const renderConversationItem = ({ item }: { item: ChatConversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => openConversation(item)}
    >
      <View style={styles.conversationCard}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: item.clientAvatar }} style={styles.avatar} />
          {item.isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.clientName}>{item.clientName}</Text>
            <Text style={styles.messageTime}>{item.lastMessageTime}</Text>
          </View>
          <Text style={styles.projectName}>{item.projectName}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>

        {item.unreadCount > 0 && (
          <ExpoLinearGradient
            colors={['#E96C2E', '#2B2E83']}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.unreadBadge}
          >
            <Text style={styles.unreadCount}>{item.unreadCount}</Text>
          </ExpoLinearGradient>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.messageContainer,
        item.isFromChef ? styles.chefMessage : styles.clientMessage
      ]}
    >
      {item.isFromChef ? (
        <ExpoLinearGradient
          colors={['#2B2E83', '#E96C2E']}
          start={[0, 0]}
          end={[1, 1]}
          style={[styles.messageBubble, styles.chefBubble]}
        >
          <Text style={[styles.messageText, styles.chefMessageText]}>
            {item.text}
          </Text>
          <Text style={[styles.messageTimestamp, styles.chefTimestamp]}>
            {item.timestamp}
          </Text>
        </ExpoLinearGradient>
      ) : (
        <View style={[styles.messageBubble, styles.clientBubble]}>
          <Text style={[styles.messageText, styles.clientMessageText]}>
            {item.text}
          </Text>
          <Text style={[styles.messageTimestamp, styles.clientTimestamp]}>
            {item.timestamp}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <AppHeader
        title="Messages"
        showNotification={true}
        onNotificationPress={() => {}}
      />

      <FlatList
        data={mockConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        style={styles.conversationsList}
        contentContainerStyle={styles.conversationsContent}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={showChatModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChatModal(false)}
      >
        {selectedConversation && (
          <KeyboardAvoidingView
            style={styles.chatModal}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.chatHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setShowChatModal(false)}
              >
                <MaterialIcons name="arrow-back" size={24} color="#003366" />
              </TouchableOpacity>

              <View style={styles.chatHeaderInfo}>
                <Image
                  source={{ uri: selectedConversation.clientAvatar }}
                  style={styles.chatAvatar}
                />
                <View style={styles.chatHeaderText}>
                  <Text style={styles.chatClientName}>{selectedConversation.clientName}</Text>
                  <Text style={styles.chatProjectName}>{selectedConversation.projectName}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.chatMenuButton}>
                <MaterialIcons name="more-vert" size={24} color="#003366" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              contentContainerStyle={[styles.messagesContent, { paddingBottom: 40 }]}
              showsVerticalScrollIndicator={false}
            />

            <View style={styles.inputContainer}>
              <View style={styles.messageInput}>
                <TextInput
                  style={styles.textInput}
                  value={newMessage}
                  onChangeText={setNewMessage}
                  placeholder="Tapez votre message..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    newMessage.trim() ? styles.sendButtonActive : styles.sendButtonInactive
                  ]}
                  onPress={sendMessage}
                  disabled={!newMessage.trim()}
                >
                  <MaterialIcons
                    name="send"
                    size={20}
                    color={newMessage.trim() ? "#FFFFFF" : "#9CA3AF"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  conversationsList: {
    flex: 1,
    paddingTop: 10,
  },
  conversationsContent: {
    paddingBottom: 120,
  },
  conversationItem: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#F3F4F6',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#43e97b',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#43e97b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  clientName: {
    fontSize: 17,
    color: '#1F2937',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 2,
  },
  messageTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'FiraSans_500Medium',
  },
  projectName: {
    fontSize: 13,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 6,
    backgroundColor: '#F0F1FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    lineHeight: 20,
  },
  unreadBadge: {
    borderRadius: 15,
    minWidth: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#f093fb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'FiraSans_700Bold',
  },
  chatModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  chatHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatHeaderText: {
    flex: 1,
  },
  chatClientName: {
    fontSize: 16,
    color: '#003366',
    fontFamily: 'FiraSans_600SemiBold',
  },
  chatProjectName: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
  },
  chatMenuButton: {
    padding: 4,
    marginLeft: 16,
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  messagesContent: {
    padding: 20,
  },
  messageContainer: {
    marginBottom: 20,
  },
  chefMessage: {
    alignItems: 'flex-end',
  },
  clientMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chefBubble: {
    borderBottomRightRadius: 8,
  },
  clientBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F1F5F9',
    borderBottomLeftRadius: 8,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'FiraSans_400Regular',
    marginBottom: 6,
  },
  chefMessageText: {
    color: '#FFFFFF',
  },
  clientMessageText: {
    color: '#1F2937',
  },
  messageTimestamp: {
    fontSize: 11,
    fontFamily: 'FiraSans_500Medium',
  },
  chefTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  clientTimestamp: {
    color: '#9CA3AF',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  messageInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    maxHeight: 120,
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'FiraSans_400Regular',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  sendButtonActive: {
    backgroundColor: '#2B2E83',
  },
  sendButtonInactive: {
    backgroundColor: '#E2E8F0',
  },
});