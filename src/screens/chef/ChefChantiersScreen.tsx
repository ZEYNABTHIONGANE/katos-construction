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
  Alert,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Slider from '@react-native-community/slider';
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
  const [projects, setProjects] = useState<ProjectDetailed[]>(mockProjects);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    phone: '',
    experience: ''
  });

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

  const addImageToGallery = async () => {
    if (!selectedProject) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission requise", "L'accès à la galerie est nécessaire pour ajouter des photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newImageUri = result.assets[0].uri;

      // Mettre à jour le projet avec la nouvelle image
      const updatedProjects = projects.map(project => {
        if (project.id === selectedProject.id) {
          return {
            ...project,
            gallery: [...project.gallery, newImageUri]
          };
        }
        return project;
      });

      setProjects(updatedProjects);

      // Mettre à jour le projet sélectionné
      const updatedSelectedProject = updatedProjects.find(p => p.id === selectedProject.id);
      if (updatedSelectedProject) {
        setSelectedProject(updatedSelectedProject);
      }

      Alert.alert("Succès", "Photo ajoutée à la galerie avec succès !");
    }
  };

  const updatePhaseProgress = (phaseId: string, newProgressValue: number) => {
    if (!selectedProject) return;

    const updatedProjects = projects.map(project => {
      if (project.id === selectedProject.id) {
        const updatedPhases = project.phases.map(phase => {
          if (phase.id === phaseId) {
            let newStatus = phase.status;
            if (newProgressValue === 0) {
              newStatus = 'pending';
            } else if (newProgressValue === 100) {
              newStatus = 'completed';
            } else {
              newStatus = 'in-progress';
            }

            return {
              ...phase,
              progress: newProgressValue,
              status: newStatus as 'completed' | 'in-progress' | 'pending'
            };
          }
          return phase;
        });

        // Calculer la progression globale du projet
        const totalProgress = updatedPhases.reduce((sum, phase) => sum + phase.progress, 0);
        const overallProgress = Math.round(totalProgress / updatedPhases.length);

        return {
          ...project,
          phases: updatedPhases,
          progress: overallProgress
        };
      }
      return project;
    });

    setProjects(updatedProjects);

    // Mettre à jour le projet sélectionné
    const updatedSelectedProject = updatedProjects.find(p => p.id === selectedProject.id);
    if (updatedSelectedProject) {
      setSelectedProject(updatedSelectedProject);
    }
  };

  const handleProgressChange = (phaseId: string, newProgress: number) => {
    updatePhaseProgress(phaseId, Math.round(newProgress));
  };

  const addTeamMember = () => {
    if (!selectedProject || !newMember.name.trim()) {
      Alert.alert("Erreur", "Veuillez saisir au minimum le nom du membre");
      return;
    }

    // Créer le nom d'affichage avec le rôle si spécifié
    const displayName = newMember.role.trim()
      ? `${newMember.name.trim()} (${newMember.role.trim()})`
      : newMember.name.trim();

    const updatedProjects = projects.map(project => {
      if (project.id === selectedProject.id) {
        return {
          ...project,
          team: [...project.team, displayName]
        };
      }
      return project;
    });

    setProjects(updatedProjects);

    // Mettre à jour le projet sélectionné
    const updatedSelectedProject = updatedProjects.find(p => p.id === selectedProject.id);
    if (updatedSelectedProject) {
      setSelectedProject(updatedSelectedProject);
    }

    // Reset form
    setNewMember({
      name: '',
      role: '',
      phone: '',
      experience: ''
    });
    setShowAddMemberForm(false);
    Alert.alert("Succès", "Membre ajouté à l'équipe avec succès !");
  };

  const removeMember = (memberIndex: number) => {
    if (!selectedProject) return;

    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir retirer ce membre de l'équipe ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            const updatedProjects = projects.map(project => {
              if (project.id === selectedProject.id) {
                const newTeam = [...project.team];
                newTeam.splice(memberIndex, 1);
                return {
                  ...project,
                  team: newTeam
                };
              }
              return project;
            });

            setProjects(updatedProjects);

            // Mettre à jour le projet sélectionné
            const updatedSelectedProject = updatedProjects.find(p => p.id === selectedProject.id);
            if (updatedSelectedProject) {
              setSelectedProject(updatedSelectedProject);
            }
          }
        }
      ]
    );
  };

  const renderGalleryItem = ({ item }: { item: string }) => (
    <Image source={{ uri: item }} style={styles.galleryImage} />
  );

  const renderAddButton = () => (
    <TouchableOpacity
      style={styles.addImageButton}
      onPress={addImageToGallery}
    >
      <MaterialIcons name="add" size={30} color="#2B2E83" />
      <Text style={styles.addImageText}>Ajouter une photo</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeader
        title="Mes Chantiers"
        showNotification={true}
        onNotificationPress={() => {}}
      />

      <View style={styles.statsHeader}>
        <Text style={styles.statsText}>{projects.length} projets</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

                    <View style={styles.sliderContainer}>
                      <Slider
                        style={styles.phaseSlider}
                        minimumValue={0}
                        maximumValue={100}
                        value={phase.progress}
                        onValueChange={(value) => handleProgressChange(phase.id, value)}
                        step={5}
                        minimumTrackTintColor="#E96C2E"
                        maximumTrackTintColor="#E5E7EB"
                      />
                    </View>

                    <View style={styles.phaseStatusContainer}>
                      <Text style={[
                        styles.phaseStatusText,
                        { color: getPhaseStatusColor(phase.status) }
                      ]}>
                        {phase.status === 'completed'
                          ? 'Terminé'
                          : phase.status === 'in-progress'
                          ? 'En cours'
                          : 'En attente'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.gallerySection}>
                <View style={styles.gallerySectionHeader}>
                  <Text style={styles.sectionTitle}>Galerie photos</Text>
                  <TouchableOpacity
                    style={styles.addPhotoButton}
                    onPress={addImageToGallery}
                  >
                    <MaterialIcons name="add-a-photo" size={20} color="#FFFFFF" />
                    <Text style={styles.addPhotoButtonText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
                {selectedProject.gallery.length > 0 ? (
                  <FlatList
                    data={selectedProject.gallery}
                    renderItem={renderGalleryItem}
                    keyExtractor={(item, index) => index.toString()}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.galleryContainer}
                  />
                ) : (
                  <View style={styles.emptyGallery}>
                    <MaterialIcons name="photo-library" size={48} color="#E0E0E0" />
                    <Text style={styles.emptyGalleryText}>Aucune photo pour le moment</Text>
                    <Text style={styles.emptyGallerySubtext}>Ajoutez des photos pour documenter l'avancement</Text>
                  </View>
                )}
              </View>

              <View style={styles.teamSection}>
                <View style={styles.teamSectionHeader}>
                  <Text style={styles.sectionTitle}>Équipe</Text>
                  <TouchableOpacity
                    style={styles.addMemberButton}
                    onPress={() => setShowAddMemberForm(!showAddMemberForm)}
                  >
                    <MaterialIcons name="person-add" size={20} color="#FFFFFF" />
                    <Text style={styles.addMemberButtonText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>

                {/* Formulaire d'ajout de membre */}
                {showAddMemberForm && (
                  <View style={styles.addMemberForm}>
                    <View style={styles.formHeader}>
                      <Text style={styles.formTitle}>Nouveau membre</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setShowAddMemberForm(false);
                          setNewMember({ name: '', role: '', phone: '', experience: '' });
                        }}
                      >
                        <MaterialIcons name="close" size={20} color="#6B7280" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.formRow}>
                      <View style={styles.formField}>
                        <Text style={styles.fieldLabel}>Nom complet *</Text>
                        <TextInput
                          style={styles.fieldInput}
                          value={newMember.name}
                          onChangeText={(text) => setNewMember({...newMember, name: text})}
                          placeholder="Ex: Amadou Ba"
                          autoCapitalize="words"
                        />
                      </View>
                    </View>

                    <View style={styles.formRow}>
                      <View style={styles.formField}>
                        <Text style={styles.fieldLabel}>Fonction</Text>
                        <TextInput
                          style={styles.fieldInput}
                          value={newMember.role}
                          onChangeText={(text) => setNewMember({...newMember, role: text})}
                          placeholder="Ex: Maçon"
                          autoCapitalize="words"
                        />
                      </View>
                    </View>

                    <View style={styles.formButtons}>
                      <TouchableOpacity
                        style={styles.cancelFormButton}
                        onPress={() => {
                          setShowAddMemberForm(false);
                          setNewMember({ name: '', role: '', phone: '', experience: '' });
                        }}
                      >
                        <Text style={styles.cancelFormText}>Annuler</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.submitFormButton, !newMember.name.trim() && styles.disabledFormButton]}
                        onPress={addTeamMember}
                        disabled={!newMember.name.trim()}
                      >
                        <Text style={styles.submitFormText}>Ajouter</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {selectedProject.team.length > 0 ? (
                  selectedProject.team.map((member, index) => (
                    <View key={index} style={styles.teamMember}>
                      <View style={styles.memberInfo}>
                        <MaterialIcons name="person" size={20} color="#6B7280" />
                        <Text style={styles.memberName}>{member}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeMemberButton}
                        onPress={() => removeMember(index)}
                      >
                        <MaterialIcons name="remove-circle-outline" size={18} color="#F44336" />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  !showAddMemberForm && (
                    <View style={styles.emptyTeam}>
                      <MaterialIcons name="group" size={48} color="#E0E0E0" />
                      <Text style={styles.emptyTeamText}>Aucun membre dans l'équipe</Text>
                      <Text style={styles.emptyTeamSubtext}>Ajoutez des membres pour ce projet</Text>
                    </View>
                  )
                )}
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
    fontFamily: 'FiraSans_600SemiBold',
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
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  phaseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  phaseName: {
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginLeft: 12,
  },
  phaseProgress: {
    fontSize: 18,
    color: '#E96C2E',
    fontFamily: 'FiraSans_700Bold',
  },
  sliderContainer: {
    marginVertical: 8,
  },
  phaseSlider: {
    width: '100%',
    height: 40,
  },
  phaseStatusContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  phaseStatusText: {
    fontSize: 12,
    fontFamily: 'FiraSans_600SemiBold',
    textTransform: 'uppercase',
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
  teamSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2B2E83',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#2B2E83',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addMemberButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
    marginLeft: 4,
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginLeft: 12,
  },
  removeMemberButton: {
    padding: 4,
  },
  emptyTeam: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyTeamText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'FiraSans_600SemiBold',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyTeamSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'FiraSans_400Regular',
    textAlign: 'center',
  },
  // Styles pour formulaire intégré
  addMemberForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E96C2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  formTitle: {
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  formRow: {
    marginBottom: 12,
  },
  formField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 6,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2B2E83',
    fontFamily: 'FiraSans_400Regular',
    backgroundColor: '#F9FAFB',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelFormButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelFormText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_600SemiBold',
  },
  submitFormButton: {
    flex: 1,
    backgroundColor: '#2B2E83',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitFormText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
  },
  disabledFormButton: {
    backgroundColor: '#9CA3AF',
  },
  gallerySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E96C2E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#E96C2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addPhotoButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
    marginLeft: 4,
  },
  emptyGallery: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyGalleryText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'FiraSans_600SemiBold',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyGallerySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'FiraSans_400Regular',
    textAlign: 'center',
  },
  addImageButton: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 10,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginTop: 4,
    textAlign: 'center',
  },
});