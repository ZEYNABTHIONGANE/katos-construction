import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native';
import MainMenu from '../../components/MainMenu';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  doc,
  getDoc,
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

type CatalogScreenRouteProp = RouteProp<RootStackParamList, 'Catalog'>;
type CatalogScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');

interface Category {
  id: string;
  name: string;
  icon: string;
  itemCount: number;
}

interface Material {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  image: string;
}

interface ProjectMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  title: string;
  description?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

interface User {
  role: 'client' | 'chef';
  projectId?: string;
}

const categories: Category[] = [
  { id: '1', name: 'Revêtements', icon: 'texture', itemCount: 24 },
  { id: '2', name: 'Peintures', icon: 'format-paint', itemCount: 18 },
  { id: '3', name: 'Sanitaires', icon: 'plumbing', itemCount: 12 },
  { id: '4', name: 'Électricité', icon: 'electrical-services', itemCount: 15 },
  { id: '5', name: 'Outillage', icon: 'build', itemCount: 30 },
  { id: '6', name: 'Quincaillerie', icon: 'hardware', itemCount: 45 },
];

const materials: Material[] = [
  {
    id: '1',
    name: 'Carrelage Marbre',
    category: 'Revêtements',
    price: 45.99,
    unit: 'm²',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
  },
  {
    id: '2',
    name: 'Peinture Satin',
    category: 'Peintures',
    price: 29.99,
    unit: 'L',
    image: 'https://images.unsplash.com/photo-1581578731548-c6a0c3f2f4b5?w=400&h=300&fit=crop',
  },
  {
    id: '3',
    name: 'Robinet Mitigeur',
    category: 'Sanitaires',
    price: 89.99,
    unit: 'unité',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
  },
  {
    id: '4',
    name: 'Câble Électrique',
    category: 'Électricité',
    price: 12.50,
    unit: 'm',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop',
  },
  {
    id: '5',
    name: 'Marteau',
    category: 'Outillage',
    price: 25.99,
    unit: 'unité',
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop',
  },
  {
    id: '6',
    name: 'Vis Inox',
    category: 'Quincaillerie',
    price: 0.15,
    unit: 'unité',
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop',
  },
];

const CatalogScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [projectMedia, setProjectMedia] = useState<ProjectMedia[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const navigation = useNavigation<CatalogScreenNavigationProp>();
  const route = useRoute<CatalogScreenRouteProp>();
  const { category } = route.params || {};

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user?.projectId) {
      loadProjectMedia();
    }
  }, [user?.projectId]);

  const loadUserData = async () => {
    try {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectMedia = async () => {
    if (!user?.projectId) return;
    
    try {
      const mediaRef = collection(db, 'projects', user.projectId, 'media');
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
    if (!user?.projectId || !auth.currentUser) return;

    setUploading(true);
    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const storageRef = ref(storage, `projects/${user.projectId}/media/${fileName}`);
      
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

      const mediaRef = collection(db, 'projects', user.projectId, 'media');
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
              await deleteDoc(doc(db, 'projects', user!.projectId!, 'media', mediaId));
              
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

  const CategoryCard = ({ category }: { category: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        selectedCategory === category.id && styles.selectedCategory,
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <Icon name={category.icon} size={32} color="#2a4d69" />
      <Text style={styles.categoryName}>{category.name}</Text>
      <Text style={styles.itemCount}>{category.itemCount} articles</Text>
    </TouchableOpacity>
  );

  const MaterialCard = ({ material }: { material: Material }) => (
    <TouchableOpacity style={styles.materialCard}>
      <Image
        source={{ uri: material.image }}
        style={styles.materialImage}
        defaultSource={{ uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop' }}
      />
      <View style={styles.materialInfo}>
        <Text style={styles.materialName}>{material.name}</Text>
        <Text style={styles.materialCategory}>{material.category}</Text>
        <Text style={styles.materialPrice}>
          {material.price.toFixed(2)}€/{material.unit}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const ProjectMediaCard = ({ media }: { media: ProjectMedia }) => (
    <TouchableOpacity style={styles.materialCard}>
      <Image
        source={{ uri: media.url }}
        style={styles.materialImage}
        defaultSource={{ uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop' }}
      />
      <View style={styles.materialInfo}>
        <Text style={styles.materialName}>{media.title}</Text>
        <Text style={styles.materialCategory}>
          {media.uploadedAt.toLocaleDateString()}
        </Text>
        {media.description && (
          <Text style={styles.materialPrice} numberOfLines={2}>
            {media.description}
          </Text>
        )}
        {user?.role === 'chef' && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => deleteMedia(media.id, media.url)}
          >
            <Icon name="delete" size={16} color="#e74c3c" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2a4d69" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={24} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un matériau..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {user?.role === 'chef' && (
          <View style={styles.chefActions}>
            <TouchableOpacity 
              style={styles.mediaButton}
              onPress={pickImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#2a4d69" />
              ) : (
                <Icon name="add-a-photo" size={20} color="#2a4d69" />
              )}
              <Text style={styles.mediaButtonText}>
                {uploading ? 'Upload...' : 'Ajouter média'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.manageButton}
              onPress={() => {
                if (user?.projectId) {
                  navigation.navigate('MediaManager', { projectId: user.projectId });
                } else {
                  Alert.alert('Erreur', 'Aucun projet assigné');
                }
              }}
            >
              <Icon name="photo-library" size={20} color="#2a4d69" />
              <Text style={styles.mediaButtonText}>Gérer médias</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView>
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.materialsSection}>
          {user?.role === 'client' && projectMedia.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Photos de votre projet</Text>
              <View style={styles.materialsGrid}>
                {projectMedia
                  .filter(media => media.type === 'image')
                  .slice(0, 6)
                  .map((media) => (
                    <ProjectMediaCard key={media.id} media={media} />
                  ))}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Matériaux populaires</Text>
              <View style={styles.materialsGrid}>
                {materials.map((material) => (
                  <MaterialCard key={material.id} material={material} />
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
      
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
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
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
  categoriesSection: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2a4d69',
    marginBottom: 15,
  },
  categoriesContainer: {
    paddingRight: 15,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginRight: 10,
    width: width * 0.35,
    alignItems: 'center',
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
  selectedCategory: {
    borderWidth: 2,
    borderColor: '#2a4d69',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2a4d69',
    marginTop: 8,
    textAlign: 'center',
  },
  itemCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  materialsSection: {
    padding: 15,
  },
  materialsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  materialCard: {
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
  materialImage: {
    width: '100%',
    height: width * 0.3,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  materialInfo: {
    padding: 10,
  },
  materialName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2a4d69',
  },
  materialCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  materialPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2ecc71',
    marginTop: 4,
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
  chefActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
  },
  mediaButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#2a4d69',
    fontWeight: '500',
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});

export default CatalogScreen;