import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientProjects'>;

interface ProjectDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  dateAdded: string;
  uri: string;
}

interface ClientProject {
  id: string;
  name: string;
  address: string;
  status: 'En cours' | 'Terminé' | 'En attente';
  progress: number;
  imageUrl: string;
  startDate: string;
  endDate?: string;
  description: string;
  documents: ProjectDocument[];
}

const mockClientProjects: ClientProject[] = [
  {
    id: '1',
    name: 'Villa Moderne - Famille Diop',
    address: '123 Avenue Léopold Sédar Senghor, Dakar',
    status: 'En cours',
    progress: 65,
    imageUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop',
    startDate: '15 Jan 2024',
    endDate: '30 Juin 2024',
    description: 'Construction d\'une villa moderne de 4 chambres avec piscine et jardin paysager.',
    documents: [
      {
        id: '1',
        name: 'Contrat de construction.pdf',
        type: 'PDF',
        size: '2.3 MB',
        dateAdded: '15 Jan 2024',
        uri: '',
      },
      {
        id: '2',
        name: 'Plans architecturaux.pdf',
        type: 'PDF',
        size: '5.1 MB',
        dateAdded: '16 Jan 2024',
        uri: '',
      },
    ],
  },
  {
    id: '2',
    name: 'Rénovation Appartement',
    address: 'Mermoz, Dakar',
    status: 'En cours',
    progress: 90,
    imageUrl: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=300&fit=crop',
    startDate: '10 Fév 2024',
    endDate: '20 Avril 2024',
    description: 'Rénovation complète d\'un appartement de 3 pièces avec modernisation de la cuisine et salle de bains.',
    documents: [
      {
        id: '3',
        name: 'Devis rénovation.pdf',
        type: 'PDF',
        size: '1.8 MB',
        dateAdded: '10 Fév 2024',
        uri: '',
      },
    ],
  },
];

export default function ClientProjectsScreen({ navigation }: Props) {
  const [projects, setProjects] = useState<ClientProject[]>(mockClientProjects);
  const [selectedProject, setSelectedProject] = useState<ClientProject | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours':
        return '#E0B043';
      case 'Terminé':
        return '#4CAF50';
      case 'En attente':
        return '#9CA3AF';
      default:
        return '#9CA3AF';
    }
  };

  const openProjectDetail = (project: ClientProject) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  };

  const addDocument = async () => {
    if (!selectedProject) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newDocument: ProjectDocument = {
          id: `${Date.now()}`,
          name: asset.name || 'Document sans nom',
          type: asset.mimeType?.includes('pdf') ? 'PDF' : asset.mimeType?.includes('image') ? 'Image' : 'Document',
          size: `${(asset.size || 0 / (1024 * 1024)).toFixed(1)} MB`,
          dateAdded: new Date().toLocaleDateString('fr-FR'),
          uri: asset.uri,
        };

        const updatedProjects = projects.map(project => {
          if (project.id === selectedProject.id) {
            return {
              ...project,
              documents: [...project.documents, newDocument]
            };
          }
          return project;
        });

        setProjects(updatedProjects);

        const updatedSelectedProject = updatedProjects.find(p => p.id === selectedProject.id);
        if (updatedSelectedProject) {
          setSelectedProject(updatedSelectedProject);
        }

        Alert.alert('Succès', 'Document ajouté avec succès !');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter le document');
    }
  };

  const removeDocument = (documentId: string) => {
    if (!selectedProject) return;

    Alert.alert(
      'Supprimer le document',
      'Êtes-vous sûr de vouloir supprimer ce document ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            const updatedProjects = projects.map(project => {
              if (project.id === selectedProject.id) {
                return {
                  ...project,
                  documents: project.documents.filter(doc => doc.id !== documentId)
                };
              }
              return project;
            });

            setProjects(updatedProjects);

            const updatedSelectedProject = updatedProjects.find(p => p.id === selectedProject.id);
            if (updatedSelectedProject) {
              setSelectedProject(updatedSelectedProject);
            }
          }
        }
      ]
    );
  };

  const renderDocument = ({ item }: { item: ProjectDocument }) => (
    <View style={styles.documentItem}>
      <View style={styles.documentIcon}>
        <MaterialIcons
          name={item.type === 'PDF' ? 'picture-as-pdf' : item.type === 'Image' ? 'image' : 'description'}
          size={24}
          color="#E96C2E"
        />
      </View>
      <View style={styles.documentInfo}>
        <Text style={styles.documentName}>{item.name}</Text>
        <Text style={styles.documentDetails}>{item.type} • {item.size} • {item.dateAdded}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteDocumentButton}
        onPress={() => removeDocument(item.id)}
      >
        <MaterialIcons name="delete" size={20} color="#F44336" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes projets</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statsCard}>
            <Text style={styles.statsText}>{projects.length} projet(s) actif(s)</Text>
          </View>

          {projects.map((project) => (
            <TouchableOpacity
              key={project.id}
              style={styles.projectCard}
              onPress={() => openProjectDetail(project)}
            >
              <Image source={{ uri: project.imageUrl }} style={styles.projectImage} />

              <View style={styles.projectContent}>
                <View style={styles.projectHeader}>
                  <View style={styles.projectInfo}>
                    <Text style={styles.projectName}>{project.name}</Text>
                    <Text style={styles.projectAddress}>{project.address}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(project.status) }]}>
                      {project.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Progression</Text>
                    <Text style={styles.progressValue}>{project.progress}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${project.progress}%` }
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.projectFooter}>
                  <View style={styles.dateContainer}>
                    <MaterialIcons name="schedule" size={16} color="#6B7280" />
                    <Text style={styles.dateText}>
                      {project.startDate} - {project.endDate || 'En cours'}
                    </Text>
                  </View>
                  <View style={styles.documentsContainer}>
                    <MaterialIcons name="description" size={16} color="#6B7280" />
                    <Text style={styles.documentsText}>{project.documents.length} document(s)</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Project Detail Modal */}
        <Modal
          visible={showProjectModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowProjectModal(false)}
        >
          {selectedProject && (
            <View style={styles.modal}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowProjectModal(false)}
                >
                  <MaterialIcons name="close" size={24} color="#003366" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{selectedProject.name}</Text>
                <View style={styles.placeholder} />
              </View>

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <Image source={{ uri: selectedProject.imageUrl }} style={styles.modalImage} />

                <View style={styles.modalInfo}>
                  <Text style={styles.modalAddress}>{selectedProject.address}</Text>
                  <Text style={styles.modalDescription}>{selectedProject.description}</Text>

                  <View style={styles.modalStats}>
                    <View style={styles.modalStatItem}>
                      <Text style={styles.modalStatValue}>{selectedProject.progress}%</Text>
                      <Text style={styles.modalStatLabel}>Progression</Text>
                    </View>
                    <View style={styles.modalStatItem}>
                      <Text style={[styles.modalStatValue, { color: getStatusColor(selectedProject.status) }]}>
                        {selectedProject.status}
                      </Text>
                      <Text style={styles.modalStatLabel}>Statut</Text>
                    </View>
                  </View>
                </View>

                {/* Documents Section */}
                <View style={styles.documentsSection}>
                  <View style={styles.documentsSectionHeader}>
                    <Text style={styles.sectionTitle}>Documents du projet</Text>
                    <TouchableOpacity
                      style={styles.addDocumentButton}
                      onPress={addDocument}
                    >
                      <MaterialIcons name="add" size={20} color="#FFFFFF" />
                      <Text style={styles.addDocumentButtonText}>Ajouter</Text>
                    </TouchableOpacity>
                  </View>

                  {selectedProject.documents.length > 0 ? (
                    <FlatList
                      data={selectedProject.documents}
                      renderItem={renderDocument}
                      keyExtractor={(item) => item.id}
                      scrollEnabled={false}
                    />
                  ) : (
                    <View style={styles.emptyDocuments}>
                      <MaterialIcons name="description" size={48} color="#E0E0E0" />
                      <Text style={styles.emptyDocumentsText}>Aucun document</Text>
                      <Text style={styles.emptyDocumentsSubtext}>Ajoutez des documents pour ce projet</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          )}
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  safeArea: {
    flex: 1,
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
    borderBottomRightRadius: 20,    marginBottom: 20,
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
  content: {
    flex: 1,
    marginTop: -20,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 30,
    marginHorizontal: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  statsText: {
    fontSize: 14,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    backgroundColor: '#F0F1FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  projectImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  projectContent: {
    padding: 20,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 18,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 4,
  },
  projectAddress: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'FiraSans_600SemiBold',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
  },
  progressValue: {
    fontSize: 14,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E0B043',
    borderRadius: 3,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    marginLeft: 4,
  },
  documentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentsText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    marginLeft: 4,
  },
  modal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  modalInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalAddress: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 24,
    color: '#2B2E83',
    fontFamily: 'FiraSans_700Bold',
    marginBottom: 4,
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
  },
  documentsSection: {
    padding: 20,
  },
  documentsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  addDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E96C2E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addDocumentButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
    marginLeft: 4,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    color: '#2B2E83',
    fontFamily: 'FiraSans_500Medium',
    marginBottom: 2,
  },
  documentDetails: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
  },
  deleteDocumentButton: {
    padding: 8,
  },
  emptyDocuments: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyDocumentsText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'FiraSans_500Medium',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyDocumentsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'FiraSans_400Regular',
    textAlign: 'center',
  },
});