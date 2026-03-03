import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import type { DocumentCategory, DocumentVisibility } from '../types/firebase';

interface ClientOption {
  id: string;
  name: string;
  email?: string;
}

interface DocumentUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onUpload: (
    file: { uri: string; name: string; size: number; mimeType?: string },
    category: DocumentCategory,
    title: string,
    description?: string,
    visibility?: DocumentVisibility
  ) => Promise<boolean>;
  uploading?: boolean;
  userRole?: string;
  availableClients?: ClientOption[];
}

interface CategoryOption {
  value: DocumentCategory;
  label: string;
  icon: string;
  description: string;
}

const documentCategories: CategoryOption[] = [
  {
    value: 'contract',
    label: 'Contrat',
    icon: 'assignment',
    description: 'Contrats, devis, accords'
  },
  {
    value: 'plan',
    label: 'Plan',
    icon: 'architecture',
    description: 'Plans techniques, schémas'
  },
  {
    value: 'invoice',
    label: 'Facture',
    icon: 'receipt',
    description: 'Factures, bordereaux'
  },
  {
    value: 'permit',
    label: 'Autorisation',
    icon: 'verified',
    description: 'Permis, autorisations'
  },
  {
    value: 'photo',
    label: 'Photo',
    icon: 'photo-camera',
    description: 'Photos du chantier'
  },
  {
    value: 'report',
    label: 'Rapport',
    icon: 'assessment',
    description: 'Rapports, comptes-rendus'
  },
  {
    value: 'other',
    label: 'Autre',
    icon: 'description',
    description: 'Autres documents'
  },
];

export default function DocumentUploadModal({
  visible,
  onClose,
  onUpload,
  uploading = false,
}: DocumentUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('other');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<DocumentVisibility>('both');
  const [isPickingFile, setIsPickingFile] = useState(false);

  const resetForm = () => {
    setSelectedFile(null);
    setSelectedCategory('other');
    setTitle('');
    setDescription('');
    setVisibility('both');
    setIsPickingFile(false);
  };

  const handleClose = () => {
    console.log('🔴 DocumentUploadModal: handleClose called, uploading:', uploading, 'isPickingFile:', isPickingFile);
    if (!uploading && !isPickingFile) {
      resetForm();
      onClose();
    }
  };

  const pickDocument = async () => {
    console.log('📎 DocumentUploadModal: pickDocument called');
    setIsPickingFile(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*', 'text/*'],
        copyToCacheDirectory: true,
      });

      console.log('📎 DocumentPicker result:', result);

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('📎 Selected asset:', asset);

        if (!asset.uri || !asset.name) {
          console.log('❌ Invalid asset:', asset);
          Alert.alert('Erreur', 'Fichier invalide');
          return;
        }

        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          size: asset.size || 0,
          mimeType: asset.mimeType
        });

        // Auto-fill title with filename if empty
        if (!title) {
          const titleFromFile = asset.name.split('.')[0];
          console.log('📝 Auto-filling title:', titleFromFile);
          setTitle(titleFromFile);
        }

        console.log('✅ File selected successfully');
      } else {
        console.log('❌ Document selection canceled or failed');
      }
    } catch (error) {
      console.error('❌ Error picking document:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier');
    } finally {
      setIsPickingFile(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('Erreur', 'Veuillez sélectionner un fichier');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un titre pour le document');
      return;
    }

    try {
      const success = await onUpload(
        selectedFile,
        selectedCategory,
        title.trim(),
        description.trim() || undefined,
        visibility
      );

      if (success) {
        Alert.alert(
          'Succès',
          'Document uploadé avec succès !',
          [
            {
              text: 'OK',
              onPress: () => handleClose()
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error uploading:', error);
      Alert.alert('Erreur', 'Échec de l\'upload du document');
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const renderCategoryOption = (option: CategoryOption) => (
    <TouchableOpacity
      key={option.value}
      style={[
        styles.categoryOption,
        selectedCategory === option.value && styles.categoryOptionSelected
      ]}
      onPress={() => setSelectedCategory(option.value)}
    >
      <View style={[
        styles.categoryIcon,
        selectedCategory === option.value && styles.categoryIconSelected
      ]}>
        <MaterialIcons
          name={option.icon as any}
          size={20}
          color={selectedCategory === option.value ? '#FFFFFF' : '#E96C2E'}
        />
      </View>
      <View style={styles.categoryInfo}>
        <Text style={[
          styles.categoryLabel,
          selectedCategory === option.value && styles.categoryLabelSelected
        ]}>
          {option.label}
        </Text>
        <Text style={styles.categoryDescription}>{option.description}</Text>
      </View>
      {selectedCategory === option.value && (
        <MaterialIcons name="check-circle" size={20} color="#E96C2E" />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            disabled={uploading}
          >
            <MaterialIcons name="close" size={24} color="#2B2E83" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ajouter un document</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* File Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fichier</Text>
            <TouchableOpacity
              style={styles.filePicker}
              onPress={pickDocument}
              disabled={uploading}
            >
              <MaterialIcons name="attach-file" size={24} color="#E96C2E" />
              <View style={styles.fileInfo}>
                {selectedFile ? (
                  <>
                    <Text style={styles.fileName}>{selectedFile.name}</Text>
                    <Text style={styles.fileSize}>
                      {formatFileSize(selectedFile.size)}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.filePickerText}>
                    Toucher pour sélectionner un fichier
                  </Text>
                )}
              </View>
              <MaterialIcons name="cloud-upload" size={24} color="#E96C2E" />
            </TouchableOpacity>
          </View>

          {/* Document Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations du document</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Titre du document *</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Contrat de construction"
                placeholderTextColor="#9CA3AF"
                editable={!uploading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Description détaillée du document (optionnel)"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                editable={!uploading}
              />
            </View>
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Catégorie du document</Text>
            {documentCategories.map(renderCategoryOption)}
          </View>


        </ScrollView>

        {/* Upload Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              (!selectedFile || !title.trim() || uploading) && styles.uploadButtonDisabled
            ]}
            onPress={handleUpload}
            disabled={!selectedFile || !title.trim() || uploading}
          >
            {uploading ? (
              <>
                <ActivityIndicator size={20} color="#FFFFFF" />
                <Text style={styles.uploadButtonText}>Upload en cours...</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="cloud-upload" size={20} color="#FFFFFF" />
                <Text style={styles.uploadButtonText}>Uploader le document</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 12,
  },
  filePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  fileInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  fileName: {
    fontSize: 14,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  fileSize: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    marginTop: 2,
  },
  filePickerText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2B2E83',
    fontFamily: 'FiraSans_400Regular',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  categoryOptionSelected: {
    borderColor: '#E96C2E',
    backgroundColor: '#FFF7ED',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIconSelected: {
    backgroundColor: '#E96C2E',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  categoryLabelSelected: {
    color: '#E96C2E',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    marginTop: 2,
  },
  clientOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  clientOptionSelected: {
    borderColor: '#E96C2E',
    backgroundColor: '#FFF7ED',
  },
  clientIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientIconSelected: {
    backgroundColor: '#E96C2E',
  },
  clientInfo: {
    flex: 1,
  },
  clientLabel: {
    fontSize: 14,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  clientLabelSelected: {
    color: '#E96C2E',
  },
  clientDescription: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    marginTop: 2,
  },
  noClientsContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  noClientsText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_600SemiBold',
  },
  noClientsSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'FiraSans_400Regular',
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E96C2E',
    paddingVertical: 16,
    borderRadius: 12,
  },
  uploadButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
    marginLeft: 8,
  },
});