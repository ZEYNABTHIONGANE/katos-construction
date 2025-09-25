import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import { uploadMedia, validateMediaFile, getMediaTypeFromMime } from '../services/upload';
import { useSessionStore } from '../store/session';

interface UploadButtonProps {
  projectId: string;
  onUploadComplete?: () => void;
}

export default function UploadButton({ projectId, onUploadComplete }: UploadButtonProps) {
  const { appUser, firebaseUser } = useSessionStore();
  const [uploading, setUploading] = useState(false);
  const isWeb = Platform.OS === 'web';

  // Vérifier que l'utilisateur est chef
  const isChef = appUser?.role === 'chef';

  const handleUploadImage = async () => {
    if (!isChef || !firebaseUser) {
      Alert.alert('Accès refusé', 'Seuls les chefs de projet peuvent uploader des médias');
      return;
    }

    try {
      if (!isWeb) {
        // Demander permissions (inutile sur le web)
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission refusée', 'Permission d\'accès à la galerie nécessaire');
          return;
        }
      }

      // Ouvrir sélecteur d'image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await handleUpload(asset);
      }

    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible d\'accéder à la galerie');
    }
  };

  const handleTakePhoto = async () => {
    if (!isChef || !firebaseUser) {
      Alert.alert('Accès refusé', 'Seuls les chefs de projet peuvent uploader des médias');
      return;
    }

  try {
    if (isWeb) {
      Alert.alert('Indisponible', 'La capture via caméra n\'est pas disponible sur le web.');
      return;
    }

    // Demander permissions caméra
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Permission d\'accès à la caméra nécessaire');
        return;
      }

      // Prendre photo
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await handleUpload(asset);
      }

    } catch (error) {
      console.error('Erreur prise photo:', error);
      Alert.alert('Erreur', 'Impossible d\'utiliser la caméra');
    }
  };

  const handleUploadDocument = async () => {
    if (!isChef || !firebaseUser) {
      Alert.alert('Accès refusé', 'Seuls les chefs de projet peuvent uploader des médias');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await handleUpload(asset, true);
      }

    } catch (error) {
      console.error('Erreur sélection document:', error);
      Alert.alert('Erreur', 'Impossible d\'accéder aux documents');
    }
  };

  const handleUpload = async (
    asset: ImagePicker.ImagePickerAsset | DocumentPicker.DocumentPickerAsset,
    isDocument = false
  ) => {
    if (!firebaseUser) return;

    setUploading(true);

    try {
      // Accéder aux propriétés communes de manière sécurisée
      const assetName = 'name' in asset ? asset.name : undefined;
      const assetSize = 'size' in asset ? asset.size : undefined;
      const assetMimeType = asset.mimeType || (isDocument ? 'application/pdf' : 'image/jpeg');

      console.log('📤 Début upload:', assetName || 'média');

      // Créer un objet File à partir de l'asset
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      // Validation du fichier si c'est un File
      if (assetSize) {
        const file = new File([blob], assetName || 'media', {
          type: assetMimeType
        });

        const validation = validateMediaFile(file);
        if (!validation.valid) {
          Alert.alert('Fichier invalide', validation.error);
          return;
        }
      }

      // Déterminer le type de média
      const mediaType = isDocument
        ? 'document' as const
        : getMediaTypeFromMime(assetMimeType);

      // Préparer les métadonnées
      const mediaData = {
        type: mediaType,
        downloadURL: '', // Sera défini dans uploadMedia
        storagePath: '', // Sera défini dans uploadMedia
        title: assetName || `${mediaType === 'image' ? 'Photo' : mediaType === 'video' ? 'Vidéo' : 'Document'} ${new Date().toLocaleDateString('fr-FR')}`,
        size: assetSize || blob.size,
        uploadedBy: firebaseUser.uid,
        uploadedAt: new Date(),
        mimeType: assetMimeType,
      };

      // Upload vers Firebase
      const result = await uploadMedia(projectId, blob, mediaData);

      console.log('✅ Upload terminé:', result.mediaId);
      Alert.alert('Succès', 'Média uploadé avec succès');

      // Callback de completion
      onUploadComplete?.();

    } catch (error) {
      console.error('❌ Erreur upload:', error);
      Alert.alert('Erreur', 'Impossible d\'uploader le média');
    } finally {
      setUploading(false);
    }
  };

  // N'afficher que si l'utilisateur est chef
  if (!isChef) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload média</Text>
      <Text style={styles.subtitle}>Chef de projet uniquement</Text>

      {isWeb && (
        <Text style={styles.webInfo}>
          Sur navigateur, importez vos images ou documents depuis votre ordinateur.
        </Text>
      )}

      <View style={styles.buttonsContainer}>
        {!isWeb && (
          <TouchableOpacity
            style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
            onPress={handleTakePhoto}
            disabled={uploading}
            accessibilityRole="button"
            accessibilityLabel="Prendre une photo"
            accessibilityState={{ disabled: uploading }}
          >
            <Text style={styles.uploadIcon}>📸</Text>
            <Text style={styles.uploadText}>Prendre une photo</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
          onPress={handleUploadImage}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel="Choisir une image dans la galerie"
          accessibilityState={{ disabled: uploading }}
        >
          <Text style={styles.uploadIcon}>🖼️</Text>
          <Text style={styles.uploadText}>Depuis la galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
          onPress={handleUploadDocument}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel="Télécharger un document PDF"
          accessibilityState={{ disabled: uploading }}
        >
          <Text style={styles.uploadIcon}>📄</Text>
          <Text style={styles.uploadText}>Document PDF</Text>
        </TouchableOpacity>
      </View>

      {uploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="small" color="#2E7D3E" />
          <Text style={styles.uploadingText}>Upload en cours...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2E7D3E',
    borderStyle: 'dashed',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D3E',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonsContainer: {
    gap: 12,
  },
  webInfo: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  uploadButton: {
    backgroundColor: '#f8f9fa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  uploadText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  uploadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2E7D3E',
    fontWeight: '500',
  },
});
