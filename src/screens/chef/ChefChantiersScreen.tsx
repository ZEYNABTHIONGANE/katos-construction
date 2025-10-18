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
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChefTabParamList } from '../../types';
import AppHeader from '../../components/AppHeader';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<ChefTabParamList, 'ChefChantiers'>;

interface ProjectDetailed {
  id: string;
  name: string;
  client: string;
  address: string;
  progress: number;
  status: 'En cours' | 'En retard' | 'Terminé' | 'En attente';
  startDate: string;
  endDate: string;
  imageUrl: string;
  team: string[];
  phases: {
    id: string;
    name: string;
    status: 'completed' | 'in-progress' | 'pending';
    progress: number;
  }[];
  gallery: string[];
}

const mockProjects: ProjectDetailed[] = [
  {
    id: '1',
    name: 'Villa Moderne - Famille Diop',
    client: 'Moussa Diop',
    address: '123 Avenue Léopold Sédar Senghor, Dakar',
    progress: 65,
    status: 'En cours',
    startDate: '15 Jan 2024',
    endDate: '30 Juin 2024',
    imageUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop',
    team: ['Amadou Ba', 'Cheikh Fall', 'Ousmane Sy'],
    phases: [
      { id: '1', name: 'Fondations', status: 'completed', progress: 100 },
      { id: '2', name: 'Gros œuvre', status: 'completed', progress: 100 },
      { id: '3', name: 'Toiture', status: 'in-progress', progress: 70 },
      { id: '4', name: 'Électricité', status: 'pending', progress: 0 },
      { id: '5', name: 'Finitions', status: 'pending', progress: 0 },
    ],
    gallery: [
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=300&h=200&fit=crop',
    ],
  },
  {
    id: '2',
    name: 'Immeuble Commercial',
    client: 'SARL Teranga',
    address: 'Plateau, Dakar',
    progress: 30,
    status: 'En cours',
    startDate: '1 Mars 2024',
    endDate: '15 Août 2024',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop',
    team: ['Abdou Diallo', 'Mamadou Ndiaye'],
    phases: [
      { id: '1', name: 'Fondations', status: 'completed', progress: 100 },
      { id: '2', name: 'Structure', status: 'in-progress', progress: 40 },
      { id: '3', name: 'Façade', status: 'pending', progress: 0 },
      { id: '4', name: 'Aménagement', status: 'pending', progress: 0 },
    ],
    gallery: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&h=200&fit=crop',
    ],
  },
  {
    id: '3',
    name: 'Rénovation Appartement',
    client: 'Fatou Kane',
    address: 'Mermoz, Dakar',
    progress: 90,
    status: 'En cours',
    startDate: '10 Fév 2024',
    endDate: '20 Avril 2024',
    imageUrl: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=300&fit=crop',
    team: ['Serigne Mboup'],
    phases: [
      { id: '1', name: 'Démolition', status: 'completed', progress: 100 },
      { id: '2', name: 'Plomberie', status: 'completed', progress: 100 },
      { id: '3', name: 'Électricité', status: 'completed', progress: 100 },
      { id: '4', name: 'Finitions', status: 'in-progress', progress: 80 },
    ],
    gallery: [
      'https://images.unsplash.com/photo-1556909114-4f6e0ef1a414?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1585128792020-803d29415281?w=300&h=200&fit=crop',
    ],
  },
];

export default function ChefChantiersScreen({ navigation }: Props) {
  const [selectedProject, setSelectedProject] = useState<ProjectDetailed | null>(null);
  const [showModal, setShowModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours':
        return '#E0B043';
      case 'En retard':
        return '#F44336';
      case 'Terminé':
        return '#4CAF50';
      case 'En attente':
        return '#9CA3AF';
      default:
        return '#9CA3AF';
    }
  };

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'in-progress':
        return '#E0B043';
      case 'pending':
        return '#9CA3AF';
      default:
        return '#9CA3AF';
    }
  };

  const openProjectDetail = (project: ProjectDetailed) => {
    setSelectedProject(project);
    setShowModal(true);
  };

  const renderGalleryItem = ({ item }: { item: string }) => (
    <Image source={{ uri: item }} style={styles.galleryImage} />
  );

  return (
    <View style={styles.container}>
      <AppHeader
        title="Mes Chantiers"
        showNotification={true}
        onNotificationPress={() => {}}
      />

      <View style={styles.statsHeader}>
        <Text style={styles.statsText}>{mockProjects.length} projets</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {mockProjects.map((project) => (
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
                  <Text style={styles.clientName}>{project.client}</Text>
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
                  <Text style={styles.progressLabel}>Progression générale</Text>
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
                    {project.startDate} - {project.endDate}
                  </Text>
                </View>
                <View style={styles.teamContainer}>
                  <MaterialIcons name="group" size={16} color="#6B7280" />
                  <Text style={styles.teamText}>{project.team.length} ouvriers</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        {selectedProject && (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#003366" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{selectedProject.name}</Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Image source={{ uri: selectedProject.imageUrl }} style={styles.modalImage} />

              <View style={styles.modalInfo}>
                <Text style={styles.modalClientName}>{selectedProject.client}</Text>
                <Text style={styles.modalAddress}>{selectedProject.address}</Text>

                <View style={styles.modalStats}>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatValue}>{selectedProject.progress}%</Text>
                    <Text style={styles.modalStatLabel}>Progression</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatValue}>{selectedProject.team.length}</Text>
                    <Text style={styles.modalStatLabel}>Ouvriers</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={[styles.modalStatValue, { color: getStatusColor(selectedProject.status) }]}>
                      {selectedProject.status}
                    </Text>
                    <Text style={styles.modalStatLabel}>Statut</Text>
                  </View>
                </View>
              </View>

              <View style={styles.phasesSection}>
                <Text style={styles.sectionTitle}>Étapes du projet</Text>
                {selectedProject.phases.map((phase) => (
                  <View key={phase.id} style={styles.phaseItem}>
                    <View style={styles.phaseHeader}>
                      <View style={styles.phaseInfo}>
                        <MaterialIcons
                          name={
                            phase.status === 'completed'
                              ? 'check-circle'
                              : phase.status === 'in-progress'
                              ? 'radio-button-checked'
                              : 'radio-button-unchecked'
                          }
                          size={20}
                          color={getPhaseStatusColor(phase.status)}
                        />
                        <Text style={styles.phaseName}>{phase.name}</Text>
                      </View>
                      <Text style={styles.phaseProgress}>{phase.progress}%</Text>
                    </View>
                    {phase.status === 'in-progress' && (
                      <View style={styles.phaseProgressBar}>
                        <View
                          style={[
                            styles.phaseProgressFill,
                            { width: `${phase.progress}%` }
                          ]}
                        />
                      </View>
                    )}
                  </View>
                ))}
              </View>

              {selectedProject.gallery.length > 0 && (
                <View style={styles.gallerySection}>
                  <Text style={styles.sectionTitle}>Galerie photos</Text>
                  <FlatList
                    data={selectedProject.gallery}
                    renderItem={renderGalleryItem}
                    keyExtractor={(item, index) => index.toString()}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.galleryContainer}
                  />
                </View>
              )}

              <View style={styles.teamSection}>
                <Text style={styles.sectionTitle}>Équipe</Text>
                {selectedProject.team.map((member, index) => (
                  <View key={index} style={styles.teamMember}>
                    <MaterialIcons name="person" size={20} color="#6B7280" />
                    <Text style={styles.memberName}>{member}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
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
  statsHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    marginHorizontal: 10,
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
  content: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
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
  clientName: {
    fontSize: 14,
    color: '#E96C2E',
    fontFamily: 'FiraSans_500Medium',
    marginBottom: 2,
  },
  projectAddress: {
    fontSize: 12,
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
  teamContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamText: {
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
  modalClientName: {
    fontSize: 20,
    color: '#2B2E83',
    fontFamily: 'FiraSans_700Bold',
    marginBottom: 4,
  },
  modalAddress: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
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
  phasesSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 16,
  },
  phaseItem: {
    marginBottom: 16,
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  phaseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  phaseName: {
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_500Medium',
    marginLeft: 12,
  },
  phaseProgress: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_600SemiBold',
  },
  phaseProgressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginLeft: 32,
    overflow: 'hidden',
  },
  phaseProgressFill: {
    height: '100%',
    backgroundColor: '#E0B043',
    borderRadius: 2,
  },
  gallerySection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  galleryContainer: {
    paddingRight: 20,
  },
  galleryImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    resizeMode: 'cover',
  },
  teamSection: {
    padding: 20,
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  memberName: {
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_400Regular',
    marginLeft: 12,
  },
});