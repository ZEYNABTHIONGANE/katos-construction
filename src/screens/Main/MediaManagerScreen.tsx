import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  addDoc
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { db, auth, storage } from '../../services/firebase';

type MediaManagerScreenRouteProp = RouteProp<RootStackParamList, 'MediaManager'>;
const { width } = Dimensions.get('window');

interface ProjectMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  title: string;
  description?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

const MediaManagerScreen = () => {
  const [projectMedia, setProjectMedia] = useState<ProjectMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingMedia, setEditingMedia] = useState<ProjectMedia | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  
  const navigation = useNavigation();
  const route = useRoute<MediaManagerScreenRouteProp>();
  const { projectId } = route.params;

  useEffect(() => {
    loadProjectMedia();
  }, [projectId]);

  const loadProjectMedia = async () => {
    try {
      const mediaRef = collection(db, 'projects', projectId, 'media');
      const q = query(mediaRef, orderBy('uploadedAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const media: ProjectMedia[] = [];
      snapshot.forEach((doc) => {
        media.push({
          id: doc.id,
          ...doc.data(),
          uploadedAt: doc.data().uploadedAt.toDate(),
        } as ProjectMedia);
      });
      
      setProjectMedia(media);
    } catch (error) {
      console.error('Erreur lors du chargement des médias:', error);
      Alert.alert('Erreur', 'Impossible de charger les médias');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission requise', 'Permission d\'accès à la galerie requise');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadMedia(result.assets[0]);
    }
  };

  const uploadMedia = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!auth.currentUser) return;

    setUploading(true);
    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const storageRef = ref(storage, `projects/${projectId}/media/${fileName}`);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      const mediaData = {
        url: downloadURL,
        type: asset.type === 'video' ? 'video' : 'image',
        title: `Média du ${new Date().toLocaleDateString()}`,
        description: '',
        uploadedAt: new Date(),
        uploadedBy: auth.currentUser.uid,
      };

      const mediaRef = collection(db, 'projects', projectId, 'media');
      await addDoc(mediaRef, mediaData);
      
      Alert.alert('Succès', 'Média uploadé avec succès');
      loadProjectMedia();
    } catch (error) {
      console.error('Erreur upload:', error);
      Alert.alert('Erreur', 'Échec de l\'upload du média');
    } finally {
      setUploading(false);
    }
  };

  const deleteMedia = async (mediaId: string, mediaUrl: string) => {
    Alert.alert(
      'Supprimer le média',
      'Êtes-vous sûr de vouloir supprimer ce média ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // Supprimer de Firestore
              await deleteDoc(doc(db, 'projects', projectId, 'media', mediaId));
              
              // Supprimer de Storage
              const storageRef = ref(storage, mediaUrl);
              await deleteObject(storageRef);
              
              Alert.alert('Succès', 'Média supprimé');
              loadProjectMedia();
            } catch (error) {
              console.error('Erreur suppression:', error);
              Alert.alert('Erreur', 'Échec de la suppression');
            }
          },
        },
      ]
    );
  };

  const editMedia = (media: ProjectMedia) => {
    setEditingMedia(media);
    setEditTitle(media.title);
    setEditDescription(media.description || '');
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (!editingMedia) return;

    try {
      await updateDoc(doc(db, 'projects', projectId, 'media', editingMedia.id), {
        title: editTitle,
        description: editDescription,
      });
      
      setShowEditModal(false);
      setEditingMedia(null);
      Alert.alert('Succès', 'Média modifié avec succès');
      loadProjectMedia();
    } catch (error) {
      console.error('Erreur modification:', error);
      Alert.alert('Erreur', 'Échec de la modification');
    }
  };

  const MediaCard = ({ media }: { media: ProjectMedia }) => (
    <View style={styles.mediaCard}>
      <Image
        source={{ uri: media.url }}
        style={styles.mediaImage}
        defaultSource={{ uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop' }}
      />
      <View style={styles.mediaInfo}>
        <Text style={styles.mediaTitle}>{media.title}</Text>
        <Text style={styles.mediaDate}>
          {media.uploadedAt.toLocaleDateString()}
        </Text>
        {media.description && (
          <Text style={styles.mediaDescription} numberOfLines={2}>
            {media.description}
          </Text>
        )}
        <View style={styles.mediaActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => editMedia(media)}
          >
            <Icon name="edit" size={16} color="#3498db" />
            <Text style={styles.actionText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => deleteMedia(media.id, media.url)}
          >
            <Icon name="delete" size={16} color="#e74c3c" />
            <Text style={[styles.actionText, styles.deleteText]}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2a4d69" />
          <Text style={styles.loadingText}>Chargement des médias...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Gestion des médias</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={pickImage}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon name="add" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {projectMedia.length > 0 ? (
          <View style={styles.mediaGrid}>
            {projectMedia.map((media) => (
              <MediaCard key={media.id} media={media} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="photo-library" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Aucun média uploadé</Text>
            <Text style={styles.emptySubtext}>Appuyez sur + pour ajouter des photos/vidéos</Text>
          </View>
        )}
      </ScrollView>

      {/* Modal d'édition */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier le média</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Titre du média"
              value={editTitle}
              onChangeText={setEditTitle}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optionnel)"
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveEdit}
              >
                <Text style={styles.saveButtonText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2a4d69',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#4b86b4',
    padding: 8,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mediaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: width * 0.44,
    marginBottom: 15,
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
  mediaImage: {
    width: '100%',
    height: width * 0.3,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  mediaInfo: {
    padding: 10,
  },
  mediaTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2a4d69',
    marginBottom: 4,
  },
  mediaDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  mediaDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  mediaActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    flex: 1,
    marginHorizontal: 2,
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#ffeaea',
  },
  actionText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#3498db',
    fontWeight: '500',
  },
  deleteText: {
    color: '#e74c3c',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    marginTop: 8,
    color: '#999',
    textAlign: 'center',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2a4d69',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2a4d69',
    marginLeft: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default MediaManagerScreen;
