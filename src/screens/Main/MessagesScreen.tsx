import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Platform,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MainMenu from '../../components/MainMenu';


interface Message {
  id: string;
  sender: string;
  avatar: string;
  preview: string;
  time: string;
  unread: boolean;
  projectRelated?: string;
  type: 'message' | 'notification' | 'update';
}


const sampleMessages: Message[] = [
  {
    id: '1',
    sender: 'Chef de projet',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    preview: 'Les plans ont été validés. Nous pouvons commencer la phase de construction.',
    time: '14:30',
    unread: true,
    projectRelated: 'Rénovation Villa Moderne',
    type: 'message',
  },
  {
    id: '2',
    sender: 'Système',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    preview: 'Nouveau devis disponible pour le projet "Extension Maison"',
    time: 'Hier',
    unread: true,
    projectRelated: 'Extension Maison',
    type: 'notification',
  },
  {
    id: '3',
    sender: 'Support technique',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    preview: 'La livraison des matériaux est prévue pour demain matin à 9h.',
    time: 'Hier',
    unread: false,
    type: 'update',
  },
  {
    id: '4',
    sender: 'Équipe terrain',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    preview: 'Rapport quotidien : Travaux de fondation terminés.',
    time: '2 jours',
    unread: false,
    projectRelated: 'Rénovation Villa Moderne',
    type: 'update',
  },
];


const MessagesScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'projects'>('all');


  const getFilteredMessages = () => {
    let filtered = sampleMessages;
    
    if (searchQuery) {
      filtered = filtered.filter(msg =>
        msg.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.preview.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }


    switch (activeTab) {
      case 'unread':
        return filtered.filter(msg => msg.unread);
      case 'projects':
        return filtered.filter(msg => msg.projectRelated);
      default:
        return filtered;
    }
  };


  const getMessageIcon = (type: Message['type']) => {
    switch (type) {
      case 'notification':
        return 'notifications';
      case 'update':
        return 'update';
      default:
        return 'message';
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Icon name="settings" size={24} color="#fff" />
        </TouchableOpacity>
      </View>


      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher dans les messages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>


      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            Tous
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
          onPress={() => setActiveTab('unread')}
        >
          <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>
            Non lus
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'projects' && styles.activeTab]}
          onPress={() => setActiveTab('projects')}
        >
          <Text style={[styles.tabText, activeTab === 'projects' && styles.activeTabText]}>
            Projets
          </Text>
        </TouchableOpacity>
      </View>


      <ScrollView style={styles.messageList}>
        {getFilteredMessages().map((message) => (
          <TouchableOpacity
            key={message.id}
            style={[styles.messageCard, message.unread && styles.unreadMessage]}
          >
            <View style={styles.messageContent}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: message.avatar }}
                  style={styles.avatar}
                  defaultSource={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' }}
                />
                <View style={[styles.statusDot, message.unread && styles.unreadDot]} />
              </View>
              
              <View style={styles.messageDetails}>
                <View style={styles.messageHeader}>
                  <Text style={styles.sender}>{message.sender}</Text>
                  <Text style={styles.time}>{message.time}</Text>
                </View>
                <Text style={styles.preview} numberOfLines={2}>
                  {message.preview}
                </Text>
                {message.projectRelated && (
                  <View style={styles.projectTag}>
                    <Icon name="business" size={12} color="#4b86b4" />
                    <Text style={styles.projectText}>{message.projectRelated}</Text>
                  </View>
                )}
              </View>
              
              <Icon
                name={getMessageIcon(message.type)}
                size={20}
                color={message.unread ? '#4b86b4' : '#ccc'}
                style={styles.typeIcon}
              />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>


      <TouchableOpacity style={styles.fab}>
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>


      <MainMenu />
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#2a4d69',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  settingsButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  activeTab: {
    backgroundColor: '#2a4d69',
  },
  tabText: {
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  messageList: {
    flex: 1,
    padding: 15,
  },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  unreadMessage: {
    borderLeftWidth: 4,
    borderLeftColor: '#4b86b4',
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  statusDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ccc',
    borderWidth: 2,
    borderColor: '#fff',
  },
  unreadDot: {
    backgroundColor: '#4b86b4',
  },
  messageDetails: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sender: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2a4d69',
  },
  time: {
    fontSize: 12,
    color: '#666',
  },
  preview: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  projectTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectText: {
    fontSize: 12,
    color: '#4b86b4',
    marginLeft: 4,
  },
  typeIcon: {
    marginLeft: 12,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4b86b4',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});


export default MessagesScreen;