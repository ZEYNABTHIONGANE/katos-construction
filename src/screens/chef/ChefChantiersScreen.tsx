import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChefTabParamList } from '../../types';
import AppHeader from '../../components/AppHeader';
import { chantierService } from '../../services/chantierService';
import { FirebaseChantier, TeamMember, calculateGlobalProgress, getPhaseStatus } from '../../types/firebase';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';
import PhaseFeedbackSection from '../../components/PhaseFeedbackSection';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<ChefTabParamList, 'ChefChantiers'>;

export default function ChefChantiersScreen({ navigation, route }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [selectedProject, setSelectedProject] = useState<FirebaseChantier | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [projects, setProjects] = useState<FirebaseChantier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    phone: '',
    experience: ''
  });
  // État local pour les valeurs des sliders (feedback immédiat)
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});

  // États pour le carousel d'images
  const [showImageCarousel, setShowImageCarousel] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (user && !authLoading) {
      loadChefChantiers();
    }
  }, [user, authLoading]);

  // Gérer la sélection automatique d'un chantier si passé en paramètre
  useEffect(() => {
    const selectedChantierId = route?.params?.selectedChantierId;
    if (selectedChantierId && projects.length > 0) {
      const chantier = projects.find(p => p.id === selectedChantierId);
      if (chantier) {
        openProjectDetail(chantier);
      }
    }
  }, [projects, route?.params?.selectedChantierId]);

  // Initialiser les valeurs des sliders quand le projet sélectionné change
  useEffect(() => {
    if (selectedProject?.phases) {
      const initialValues: Record<string, number> = {};
      selectedProject.phases
        .filter(phase => phase.name !== 'Électricité & Plomberie')
        .forEach(phase => {
          initialValues[phase.id] = phase.progress;
        });
      setSliderValues(initialValues);
    }
  }, [selectedProject]);

  // Calculer la progression globale en temps réel
  const getRealtimeGlobalProgress = () => {
    if (!selectedProject?.phases) return 0;

    const phasesWithRealtimeProgress = selectedProject.phases.map(phase => ({
      ...phase,
      progress: sliderValues[phase.id] ?? phase.progress
    }));

    return calculateGlobalProgress(phasesWithRealtimeProgress);
  };

  // Obtenir le statut d'une phase en temps réel
  const getRealtimePhaseStatus = (phaseId: string, originalProgress: number) => {
    const realtimeProgress = sliderValues[phaseId] ?? originalProgress;
    return getPhaseStatus(realtimeProgress);
  };

  const loadChefChantiers = async () => {
    try {
      setLoading(true);

      if (!user) {
        Alert.alert('Erreur', 'Vous devez être connecté pour accéder à cette page');
        return;
      }

      const chefId = user.uid;
      const unsubscribe = chantierService.subscribeToChefChantiers(chefId, (chantiersData) => {
        setProjects(chantiersData);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Erreur lors du chargement des chantiers:', error);
      Alert.alert('Erreur', 'Impossible de charger les chantiers');
      setLoading(false);
    }
  };

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

  const openProjectDetail = (project: FirebaseChantier) => {
    setSelectedProject(project);
    setShowModal(true);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };


  // Function to open image carousel
  const openImageCarousel = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageCarousel(true);
  };


  const updatePhaseProgress = async (phaseId: string, newProgressValue: number) => {
    if (!selectedProject) return;

    try {
      if (!user) {
        Alert.alert('Erreur', 'Utilisateur non authentifié');
        return;
      }

      await chantierService.updatePhaseProgress(
        selectedProject.id!,
        phaseId,
        newProgressValue,
        undefined, // Pas de note automatique
        user.uid
      );

      // The real-time listener will automatically update the UI
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la progression:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la progression. Veuillez réessayer.');
    }
  };

  const handleProgressChange = (phaseId: string, newProgress: number) => {
    // Mise à jour immédiate de la valeur locale pour un feedback visuel
    setSliderValues(prev => ({
      ...prev,
      [phaseId]: Math.round(newProgress)
    }));

    // Mise à jour en base de données (peut être asynchrone)
    updatePhaseProgress(phaseId, Math.round(newProgress));
  };

  const handleStepProgressChange = async (phaseId: string, stepId: string, newProgress: number) => {
    // Mise à jour immédiate pour feedback visuel using composite key
    const key = `${phaseId}_${stepId}`;
    setSliderValues(prev => ({
      ...prev,
      [key]: Math.round(newProgress)
    }));

    if (!selectedProject || !user) return;

    try {
      await chantierService.updateStepProgress(
        selectedProject.id!,
        phaseId,
        stepId,
        Math.round(newProgress),
        user.uid
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'étape:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la progression.');
    }
  };

  const addTeamMember = async () => {
    if (!selectedProject || !newMember.name.trim()) {
      Alert.alert("Erreur", "Veuillez saisir au minimum le nom du membre");
      return;
    }

    try {
      if (!user) {
        Alert.alert('Erreur', 'Utilisateur non authentifié');
        return;
      }

      const memberData: Omit<TeamMember, 'id' | 'addedAt' | 'addedBy'> = {
        name: newMember.name.trim(),
        role: newMember.role.trim() || 'Ouvrier',
        phone: newMember.phone.trim(),
        experience: newMember.experience.trim()
      };

      await chantierService.addTeamMember(
        selectedProject.id!,
        memberData,
        user.uid
      );

      // Reset form
      setNewMember({
        name: '',
        role: '',
        phone: '',
        experience: ''
      });
      setShowAddMemberForm(false);
      Alert.alert("Succès", "Membre ajouté à l'équipe avec succès !");
    } catch (error) {
      console.error('Erreur lors de l\'ajout du membre:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le membre. Veuillez réessayer.');
    }
  };

  const removeMember = (member: TeamMember) => {
    if (!selectedProject) return;

    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir retirer ce membre de l'équipe ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await chantierService.removeTeamMember(selectedProject.id!, member.id);
              Alert.alert("Succès", "Membre retiré de l'équipe");
            } catch (error) {
              console.error('Erreur lors de la suppression du membre:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le membre');
            }
          }
        }
      ]
    );
  };

  const renderGalleryItem = ({ item }: { item: string }) => (
    <Image source={{ uri: item }} style={styles.galleryImage} />
  );


  if (authLoading || loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <AppHeader
          title="Mes Chantiers"
          showNotification={false}
          onNotificationPress={() => {}}
        />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#2B2E83" />
          <Text style={styles.loadingText}>Chargement en cours...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Mes Chantiers"
          showNotification={false}
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
        {projects.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="domain" size={64} color="#E0E0E0" />
            <Text style={styles.emptyStateText}>Aucun chantier assigné</Text>
            <Text style={styles.emptyStateSubtext}>
              Vous n'avez pas encore de chantiers assignés
            </Text>
          </View>
        ) : (
          projects.map((project) => (
            <TouchableOpacity
              key={project.id}
              style={styles.projectCard}
              onPress={() => openProjectDetail(project)}
            >
              {project.coverImage ? (
                <Image source={{ uri: project.coverImage }} style={styles.projectImage} />
              ) : project.gallery && project.gallery.length > 0 ? (
                <Image source={{ uri: project.gallery[0].url }} style={styles.projectImage} />
              ) : (
                <View style={[styles.projectImage, styles.placeholderImage]}>
                  <MaterialIcons name="image" size={48} color="#E0E0E0" />
                </View>
              )}

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
                    <Text style={styles.progressLabel}>Progression générale</Text>
                    <Text style={styles.progressValue}>
                      {selectedProject?.id === project.id ? getRealtimeGlobalProgress() : project.globalProgress}%
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${selectedProject?.id === project.id ? getRealtimeGlobalProgress() : project.globalProgress}%` }
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.projectFooter}>
                  <View style={styles.dateContainer}>
                    <MaterialIcons name="schedule" size={16} color="#6B7280" />
                    <Text style={styles.dateText}>
                      {formatDate(project.startDate)} - {formatDate(project.plannedEndDate)}
                    </Text>
                  </View>
                  <View style={styles.teamContainer}>
                    <MaterialIcons name="group" size={16} color="#6B7280" />
                    <Text style={styles.teamText}>{project.team.length} ouvriers</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
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
              {selectedProject.coverImage ? (
                <Image source={{ uri: selectedProject.coverImage }} style={styles.modalImage} />
              ) : selectedProject.gallery && selectedProject.gallery.length > 0 ? (
                <Image source={{ uri: selectedProject.gallery[0].url }} style={styles.modalImage} />
              ) : (
                <View style={[styles.modalImage, styles.placeholderImage]}>
                  <MaterialIcons name="image" size={48} color="#E0E0E0" />
                </View>
              )}

              <View style={styles.modalInfo}>
                <Text style={styles.modalClientName}>{selectedProject.name}</Text>
                <Text style={styles.modalAddress}>{selectedProject.address}</Text>

                <View style={styles.modalStats}>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatValue}>{getRealtimeGlobalProgress()}%</Text>
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
                {selectedProject.phases
                  .filter(phase => phase.name !== 'Électricité & Plomberie')
                  .map((phase, phaseIndex, phasesArray) => {
                    // --- PHASE LINEARITY CHECK ---
                    // "Gros Oeuvre" phases must be sequential.
                    // "Second Oeuvre" phases are NOT linear relative to each other.
                    // However, we might arguably want Second Oeuvre to start only after ALL Gros Oeuvre is done?
                    // User said: "linearité n'est valable que pour les gros oeuvre... mais les etapes des second oeuvre ne sont pas lineaire"
                    // Implies: Phase N (Gros Oeuvre) requires Phase N-1 (Gros Oeuvre) to be done.
                    
                    const isGrosOeuvre = (phase as any).category === 'gros_oeuvre';
                    let isPhaseLocked = false;
                    
                    if (isGrosOeuvre) {
                      // Find previous Gros Oeuvre phase
                      // Iterate backwards from current index
                      let prevGrosOeuvreIndex = -1;
                      for (let i = phaseIndex - 1; i >= 0; i--) {
                        if ((phasesArray[i] as any).category === 'gros_oeuvre') {
                          prevGrosOeuvreIndex = i;
                          break;
                        }
                      }
                      
                      if (prevGrosOeuvreIndex !== -1) {
                         const prevPhase = phasesArray[prevGrosOeuvreIndex];
                         // Check if strictly less than 100%
                         if (prevPhase.progress < 100) {
                           isPhaseLocked = true;
                         }
                      }
                    } 
                    // Note: No lock for 'second_oeuvre' phases relative to each other, based on user request.

                    const hasSteps = (phase as any).steps && (phase as any).steps.length > 0;

                    return (
                  <View key={phase.id} style={[styles.phaseItem, isPhaseLocked && styles.phaseItemLocked]}>
                    <View style={styles.phaseHeader}>
                      <View style={styles.phaseInfo}>
                        {isPhaseLocked ? (
                           <MaterialIcons name="lock" size={20} color="#9CA3AF" />
                        ) : (
                          <MaterialIcons
                            name={(() => {
                              const realtimeStatus = getRealtimePhaseStatus(phase.id, phase.progress);
                              return realtimeStatus === 'completed'
                                ? 'check-circle'
                                : realtimeStatus === 'in-progress'
                                ? 'radio-button-checked'
                                : 'radio-button-unchecked';
                            })()}
                            size={20}
                            color={getPhaseStatusColor(getRealtimePhaseStatus(phase.id, phase.progress))}
                          />
                        )}
                        <Text style={[styles.phaseName, isPhaseLocked && styles.textLocked]}>{phase.name}</Text>
                      </View>
                      <Text style={[styles.phaseProgress, isPhaseLocked && styles.textLocked]}>
                        {sliderValues[phase.id] ?? phase.progress}%
                      </Text>
                    </View>

                    {/* Check if Phase has steps */}
                    {hasSteps ? (
                        <View style={styles.stepsContainer}>
                            {(phase as any).steps.map((step: any, stepIndex: number) => {
                                // --- STEP LINEARITY CHECK ---
                                // Always linear within the phase
                                let isStepLocked = isPhaseLocked; // Inherit phase lock
                                if (!isStepLocked && stepIndex > 0) {
                                    const prevStep = (phase as any).steps[stepIndex - 1];
                                    if (prevStep.progress < 100) {
                                        isStepLocked = true;
                                    }
                                }

                                return (
                                  <View key={step.id} style={styles.stepItem}>
                                      <View style={styles.stepHeader}>
                                          <Text style={[styles.stepName, isStepLocked && styles.textLocked]}>{step.name}</Text>
                                          <Text style={[styles.stepProgress, isStepLocked && styles.textLocked]}>{step.progress}%</Text>
                                      </View>
                                      <Slider
                                          style={styles.stepSlider}
                                          minimumValue={0}
                                          maximumValue={100}
                                          value={sliderValues[`${phase.id}_${step.id}`] ?? step.progress}
                                          onValueChange={(val) => {
                                              handleStepProgressChange(phase.id, step.id, val);
                                          }}
                                          step={100} 
                                          minimumTrackTintColor={isStepLocked ? "#D1D5DB" : "#E96C2E"}
                                          maximumTrackTintColor="#E5E7EB"
                                          disabled={isStepLocked}
                                      />
                                      {/* Voice Notes for Step - only show if unlocked */}
                                      {!isStepLocked && (
                                          <PhaseFeedbackSection
                                              chantierId={selectedProject.id}
                                              phaseId={phase.id}
                                              stepId={step.id}
                                              title="Notes vocales (Étape)"
                                              currentUserId={user?.uid}
                                          />
                                      )}
                                  </View>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={styles.sliderContainer}>
                          <Slider
                            style={styles.phaseSlider}
                            minimumValue={0}
                            maximumValue={100}
                            value={sliderValues[phase.id] ?? phase.progress}
                            onValueChange={(value) => handleProgressChange(phase.id, value)}
                            step={5}
                            minimumTrackTintColor={isPhaseLocked ? "#D1D5DB" : "#E96C2E"}
                            maximumTrackTintColor="#E5E7EB"
                            disabled={isPhaseLocked}
                          />
                          {/* Voice Notes for Phase (no steps) - only show if unlocked */}
                          {!isPhaseLocked && (
                              <PhaseFeedbackSection
                                  chantierId={selectedProject.id}
                                  phaseId={phase.id}
                                  title="Notes vocales (Phase)"
                                  currentUserId={user?.uid}
                              />
                          )}
                        </View>
                    )}

                    <View style={styles.phaseStatusContainer}>
                      <Text style={[
                        styles.phaseStatusText,
                        { color: isPhaseLocked ? '#9CA3AF' : getPhaseStatusColor(getRealtimePhaseStatus(phase.id, phase.progress)) }
                      ]}>
                        {isPhaseLocked ? 'Verrouillé' : (() => {
                          const realtimeStatus = getRealtimePhaseStatus(phase.id, phase.progress);
                          return realtimeStatus === 'completed'
                            ? 'Terminé'
                            : realtimeStatus === 'in-progress'
                            ? 'En cours'
                            : 'En attente';
                        })()}
                      </Text>
                    </View>
                  </View>
                )})}
              </View>
{/* 
              <View style={styles.gallerySection}>
                <View style={styles.gallerySectionHeader}>
                  <Text style={styles.sectionTitle}>Galerie médias</Text>
                  <TouchableOpacity
                    style={styles.galleryButton}
                    onPress={() => navigation.navigate('ChefGallery')}
                  >
                    <MaterialIcons name="photo-library" size={20} color="#FFFFFF" />
                    <Text style={styles.addPhotoButtonText}>Voir galerie</Text>
                  </TouchableOpacity>
                </View>
                {selectedProject.gallery.length > 0 ? (
                  <FlatList
                    data={selectedProject.gallery.slice(0, 4)}
                    renderItem={({ item, index }) => (
                      <View style={styles.galleryImageContainer}>
                        <TouchableOpacity onPress={() => openImageCarousel(index)}>
                          {item.type === 'video' ? (
                            <View style={styles.videoContainer}>
                              <Video
                                source={{ uri: item.thumbnailUrl || item.url }}
                                style={styles.galleryImage}
                                resizeMode={ResizeMode.COVER}
                                shouldPlay={false}
                                isLooping={false}
                                useNativeControls={false}
                              />
                              <View style={styles.videoOverlay}>
                                <MaterialIcons name="play-circle-filled" size={32} color="rgba(255,255,255,0.8)" />
                                {item.duration && (
                                  <Text style={styles.videoDuration}>
                                    {Math.floor(item.duration / 60)}:{String(Math.floor(item.duration % 60)).padStart(2, '0')}
                                  </Text>
                                )}
                              </View>
                            </View>
                          ) : (
                            <Image source={{ uri: item.url }} style={styles.galleryImage} />
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.galleryContainer}
                  />
                ) : (
                  <View style={styles.emptyGallery}>
                    <MaterialIcons name="photo-library" size={48} color="#E0E0E0" />
                    <Text style={styles.emptyGalleryText}>Aucun média pour le moment</Text>
                    <Text style={styles.emptyGallerySubtext}>Utilisez l'onglet Galerie pour ajouter des photos et vidéos</Text>
                  </View>
                )}
                {selectedProject.gallery.length > 4 && (
                  <TouchableOpacity
                    style={styles.showMoreButton}
                    onPress={() => navigation.navigate('ChefGallery')}
                  >
                    <Text style={styles.showMoreText}>
                      +{selectedProject.gallery.length - 4} médias supplémentaires
                    </Text>
                    <MaterialIcons name="arrow-forward" size={16} color="#E96C2E" />
                  </TouchableOpacity>
                )}
              </View> */}


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
                  selectedProject.team.map((member) => (
                    <View key={member.id} style={styles.teamMember}>
                      <View style={styles.memberInfo}>
                        <MaterialIcons name="person" size={20} color="#6B7280" />
                        <View style={styles.memberDetails}>
                          <Text style={styles.memberName}>{member.name}</Text>
                          <Text style={styles.memberRole}>{member.role}</Text>
                          {member.phone && (
                            <Text style={styles.memberPhone}>📞 {member.phone}</Text>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.removeMemberButton}
                        onPress={() => removeMember(member)}
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

      {/* Image Carousel Modal */}
      <Modal
        visible={showImageCarousel}
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <View style={styles.carouselContainer}>
          <View style={styles.carouselHeader}>
            <TouchableOpacity onPress={() => setShowImageCarousel(false)} style={styles.carouselCloseButton}>
              <MaterialIcons name="close" size={30} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.carouselTitle}>
              {selectedImageIndex + 1} / {selectedProject?.gallery?.length || 0}
            </Text>
            <View style={styles.carouselHeaderSpacer} />
          </View>

          {selectedProject?.gallery && selectedProject.gallery.length > 0 && (
            <FlatList
              data={selectedProject.gallery}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={selectedImageIndex}
              getItemLayout={(data, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / width);
                setSelectedImageIndex(index);
              }}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.carouselImageContainer}>
                  {item.type === 'video' ? (
                    <Video
                      source={{ uri: item.url }}
                      style={styles.carouselVideo}
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay={false}
                      isLooping={false}
                      useNativeControls={true}
                    />
                  ) : (
                    <Image
                      source={{ uri: item.url }}
                      style={styles.carouselImage}
                      resizeMode="contain"
                    />
                  )}
                  {item.description && (
                    <Text style={styles.carouselImageDescription}>{item.description}</Text>
                  )}
                </View>
              )}
            />
          )}
        </View>
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
  galleryImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  galleryImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  videoContainer: {
    position: 'relative',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  videoDuration: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'FiraSans_600SemiBold',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  deleteImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
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
  galleryButton: {
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
  loadingContainer: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6B7280',
    fontFamily: 'FiraSans_600SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'FiraSans_400Regular',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  placeholderImage: {
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberDetails: {
    flex: 1,
    marginLeft: 12,
  },
  memberRole: {
    fontSize: 12,
    color: '#E96C2E',
    fontFamily: 'FiraSans_600SemiBold',
    marginTop: 2,
  },
  memberPhone: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    marginTop: 2,
  },
  carouselContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  carouselHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  carouselCloseButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  carouselHeaderSpacer: {
    width: 32,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  showMoreText: {
    fontSize: 14,
    color: '#E96C2E',
    fontFamily: 'FiraSans_600SemiBold',
    marginRight: 4,
  },
  carouselTitle: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'FiraSans_600SemiBold',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  carouselImageContainer: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    width: width,
    height: height * 0.8,
  },
  carouselVideo: {
    width: width,
    height: height * 0.8,
  },
  carouselImageDescription: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    color: 'white',
    fontSize: 14,
    fontFamily: 'FiraSans_400Regular',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 8,
  },
  phaseItemLocked: {
    opacity: 0.7,
    backgroundColor: '#F9FAFB',
  },
  textLocked: {
    color: '#9CA3AF',
  },
  stepsContainer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 15,
    paddingHorizontal: 5,
  },
  stepItem: {
    marginBottom: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepName: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'FiraSans_400Regular',
  },
  stepProgress: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_500Medium',
  },
  stepSlider: {
    width: '100%',
    height: 40,
  },
});