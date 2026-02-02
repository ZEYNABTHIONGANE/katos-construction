import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeTabParamList, Message } from '../../types';
import AppHeader from '../../components/AppHeader';
import ChatBubble from '../../components/ChatBubble';
import { mockMessages } from '../../data/mockData';

type Props = BottomTabScreenProps<HomeTabParamList, 'Chat'>;

export default function ChatScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: `${Date.now()}`,
        text: newMessage.trim(),
        senderId: '1',
        senderName: 'Moussa Diop',
        timestamp: new Date(),
        isFromUser: true,
        isRead: false,
      };

      setMessages([...messages, message]);
      setNewMessage('');

      // Simulate chef response after 2 seconds
      setTimeout(() => {
        const chefResponse: Message = {
          id: `${Date.now() + 1}`,
          text: 'Merci pour votre message. Je vous réponds dès que possible.',
          senderId: 'chef1',
          senderName: 'Chef de chantier',
          timestamp: new Date(),
          isFromUser: false,
          isRead: true,
        };
        setMessages(prev => [...prev, chefResponse]);
      }, 2000);
    }
  };

  const handleAttachmentPress = () => {
    setShowAttachmentModal(true);
  };

  const handleImagePicker = async () => {
    setShowAttachmentModal(false);

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission requise", "L'accès à la galerie est nécessaire pour envoyer des photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageMessage: Message = {
        id: `${Date.now()}`,
        text: 'Photo envoyée',
        senderId: '1',
        senderName: 'Moussa Diop',
        timestamp: new Date(),
        isFromUser: true,
        isRead: false,
        attachmentType: 'image',
        attachmentUrl: result.assets[0].uri,
      };

      setMessages(prev => [...prev, imageMessage]);
    }
  };

  const handleDocumentPicker = async () => {
    setShowAttachmentModal(false);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const documentMessage: Message = {
          id: `${Date.now()}`,
          text: `Document: ${result.assets[0].name}`,
          senderId: '1',
          senderName: 'Moussa Diop',
          timestamp: new Date(),
          isFromUser: true,
          isRead: false,
          attachmentType: 'document',
          attachmentUrl: result.assets[0].uri,
          attachmentName: result.assets[0].name,
        };

        setMessages(prev => [...prev, documentMessage]);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner le document');
    }
  };

  const handleCameraPress = async () => {
    setShowAttachmentModal(false);

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission requise", "L'accès à la caméra est nécessaire pour prendre des photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageMessage: Message = {
        id: `${Date.now()}`,
        text: 'Photo prise',
        senderId: '1',
        senderName: 'Moussa Diop',
        timestamp: new Date(),
        isFromUser: true,
        isRead: false,
        attachmentType: 'image',
        attachmentUrl: result.assets[0].uri,
      };

      setMessages(prev => [...prev, imageMessage]);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatBubble message={item} />
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
        {/* Header moderne */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={styles.headerRight} />
        </View>

        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <View style={styles.chatHeaderInfo}>
              <View style={styles.avatarContainer}>
                <MaterialIcons name="engineering" size={24} color="#E96C2E" />
                <View style={styles.onlineIndicator} />
              </View>
              <View style={styles.chatHeaderText}>
                <Text style={styles.chatHeaderName}>Chef de chantier</Text>
                <View style={styles.statusContainer}>
                  <View style={styles.statusDot} />
                  <Text style={styles.chatHeaderStatus}>En ligne maintenant</Text>
                </View>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="videocam" size={22} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="phone" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages List */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={{ flex: 1 }}>
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                style={styles.messagesList}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
              />
            </View>
          </TouchableWithoutFeedback>

          {/* Message Input */}
          <View style={[
            styles.inputContainer,
            { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : 16 }
          ]}>
            <View style={styles.inputWrapper}>
              <TouchableOpacity style={styles.attachButton} onPress={handleAttachmentPress}>
                <MaterialIcons name="add" size={22} color="#9CA3AF" />
              </TouchableOpacity>
              <TextInput
                style={styles.textInput}
                placeholder="Écrivez votre message..."
                placeholderTextColor="#9CA3AF"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={500}
              />
              <TouchableOpacity style={styles.emojiButton}>
                <MaterialIcons name="emoji-emotions" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: newMessage.trim() ? '#2B2E83' : '#E5E7EB' },
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <MaterialIcons
                name="send"
                size={20}
                color={newMessage.trim() ? '#FFFFFF' : '#9CA3AF'}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Attachment Modal */}
        <Modal
          visible={showAttachmentModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAttachmentModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowAttachmentModal(false)}
          >
            <View style={styles.attachmentModal}>
              <Text style={styles.modalTitle}>Ajouter un fichier</Text>

              <TouchableOpacity style={styles.attachmentOption} onPress={handleCameraPress}>
                <View style={styles.attachmentIconContainer}>
                  <MaterialIcons name="camera-alt" size={24} color="#E96C2E" />
                </View>
                <Text style={styles.attachmentOptionText}>Prendre une photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.attachmentOption} onPress={handleImagePicker}>
                <View style={styles.attachmentIconContainer}>
                  <MaterialIcons name="photo-library" size={24} color="#2B2E83" />
                </View>
                <Text style={styles.attachmentOptionText}>Galerie photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.attachmentOption} onPress={handleDocumentPicker}>
                <View style={styles.attachmentIconContainer}>
                  <MaterialIcons name="description" size={24} color="#10B981" />
                </View>
                <Text style={styles.attachmentOptionText}>Document (PDF, Word)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAttachmentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2B2E83',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 80,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'FiraSans_700Bold',
  },
  headerRight: {
    width: 40,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 30,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    backgroundColor: '#F3F4F6',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  chatHeaderName: {
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  chatHeaderStatus: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#F9FAFB',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
    paddingBottom: 130, // Espace pour la navigation flottante
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 25,
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    maxHeight: 80,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'FiraSans_400Regular',
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  emojiButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  attachmentModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    textAlign: 'center',
    marginBottom: 24,
  },
  attachmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  attachmentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  attachmentOptionText: {
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'FiraSans_600SemiBold',
  },
});