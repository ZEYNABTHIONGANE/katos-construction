import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Modal,
    Dimensions,
    Alert,
    TextInput,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChefStackParamList } from '../../types';
import AppHeader from '../../components/AppHeader';
import { chantierService } from '../../services/chantierService';
import { FirebaseChantier, TeamMember, calculateGlobalProgress, getPhaseStatus } from '../../types/firebase';
import { useAuth } from '../../contexts/AuthContext';


const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<ChefStackParamList, 'ChefChantierDetails'>;

export default function ChefChantierDetailsScreen({ navigation, route }: Props) {
    const { chantierId } = route.params;
    const { user } = useAuth();
    const [selectedProject, setSelectedProject] = useState<FirebaseChantier | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddMemberForm, setShowAddMemberForm] = useState(false);
    const [newMember, setNewMember] = useState({
        name: '',
        role: '',
        phone: '',
        experience: ''
    });

    // États pour le carousel d'images (interne à l'écran)
    const [showImageCarousel, setShowImageCarousel] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);


    useEffect(() => {
        const unsubscribe = loadChantierDetails();
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [chantierId, user]);

    const loadChantierDetails = () => {
        setLoading(true);
        // Subscribe to real-time updates for *specific* chantier if possible, 
        // or just fetch once and rely on parent list subscription? 
        // Ideally we subscribe to the single doc. For now let's reuse getChantierById or similar if available,
        // but better: subscribe to all chef chantiers in Context or Service and filter.
        // Since we don't have a single-doc subscription method exposed in the visible service code snippets (only list),
        // we can assume we might need to fetch it or listen to the collection and filter.
        // However, existing `subscribeToChefChantiers` is for the list.
        // Let's rely on `subscribeToChantier` if it exists, otherwise fall back to list subscription filtering.
        // I'll assume we can use `subscribeToChefChantiers` and filter for this ID since that's what we have available or I'll implement a single doc listener.
        // Actually, simply reusing the logic from the previous screen for the datasource is safer.

        // Quick fix: Use the list subscription filtered by ID.
        if (!user) return;

        const unsubscribe = chantierService.subscribeToChefChantiers(user.uid, (chantiers) => {
            const found = chantiers.find(c => c.id === chantierId);
            if (found) {
                setSelectedProject(found);
            }
            setLoading(false);
        });

        return unsubscribe;
    };

    const getRealtimeGlobalProgress = () => {
        if (!selectedProject?.phases) return 0;
        return calculateGlobalProgress(selectedProject.phases);
    };

    const getRealtimePhaseStatus = (phaseId: string, originalProgress: number) => {
        return getPhaseStatus(originalProgress);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'En cours': return '#E0B043';
            case 'En retard': return '#F44336';
            case 'Terminé': return '#4CAF50';
            case 'En attente': return '#9CA3AF';
            default: return '#9CA3AF';
        }
    };

    const getPhaseStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return '#4CAF50';
            case 'in-progress': return '#E0B043';
            case 'pending': return '#9CA3AF';
            default: return '#9CA3AF';
        }
    };

    // --- Handlers reused from ChefChantiersScreen ---


    const addTeamMember = async () => {
        if (!selectedProject || !newMember.name.trim()) {
            Alert.alert("Erreur", "Veuillez saisir au minimum le nom du membre");
            return;
        }
        try {
            if (!user) return;
            const memberData: Omit<TeamMember, 'id' | 'addedAt' | 'addedBy'> = {
                name: newMember.name.trim(),
                role: newMember.role.trim() || 'Ouvrier',
                phone: newMember.phone.trim(),
                experience: newMember.experience.trim()
            };
            await chantierService.addTeamMember(selectedProject.id!, memberData, user.uid);
            setNewMember({ name: '', role: '', phone: '', experience: '' });
            setShowAddMemberForm(false);
            Alert.alert("Succès", "Membre ajouté à l'équipe avec succès !");
        } catch (error) {
            console.error('Erreur ajout membre:', error);
            Alert.alert('Erreur', 'Impossible d\'ajouter le membre.');
        }
    };

    const removeMember = (member: TeamMember) => {
        if (!selectedProject) return;
        Alert.alert(
            "Confirmer la suppression",
            "Retirer ce membre de l'équipe ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await chantierService.removeTeamMember(selectedProject.id!, member.id);
                            Alert.alert("Succès", "Membre retiré");
                        } catch (error) {
                            console.error('Erreur suppression membre:', error);
                            Alert.alert('Erreur', 'Impossible de supprimer le membre');
                        }
                    }
                }
            ]
        );
    };

    const openImageCarousel = (index: number) => {
        setSelectedImageIndex(index);
        setShowImageCarousel(true);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2B2E83" />
            </View>
        );
    }

    if (!selectedProject) return null;

    return (
        <View style={styles.container}>
            <AppHeader
                title={selectedProject.name}
                showBack
                onBackPress={() => navigation.goBack()}
                showNotification={false}
            />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Project Header Image */}
                {selectedProject.coverImage ? (
                    <Image source={{ uri: selectedProject.coverImage }} style={styles.projectCoverImage} />
                ) : selectedProject.gallery && selectedProject.gallery.length > 0 ? (
                    <Image source={{ uri: selectedProject.gallery[0].url }} style={styles.projectCoverImage} />
                ) : (
                    <View style={[styles.projectCoverImage, styles.placeholderImage]}>
                        <MaterialIcons name="image" size={48} color="#E0E0E0" />
                    </View>
                )}

                <View style={styles.projectInfoPage}>
                    <Text style={styles.projectAddress}>{selectedProject.address}</Text>

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
                            // Logic checks copy-pasted/adapted
                            const isGrosOeuvre = (phase as any).category === 'gros_oeuvre';
                            let isPhaseLocked = false;
                            if (isGrosOeuvre) {
                                let prevGrosOeuvreIndex = -1;
                                for (let i = phaseIndex - 1; i >= 0; i--) {
                                    if ((phasesArray[i] as any).category === 'gros_oeuvre') {
                                        prevGrosOeuvreIndex = i;
                                        break;
                                    }
                                }
                                if (prevGrosOeuvreIndex !== -1) {
                                    const prevPhase = phasesArray[prevGrosOeuvreIndex];
                                    const prevPhaseProgress = prevPhase.progress;
                                    if (prevPhaseProgress < 100) isPhaseLocked = true;
                                }
                            }

                            const hasSteps = phase.steps && phase.steps.length > 0;

                            return (
                                <TouchableOpacity
                                    key={phase.id}
                                    style={[
                                        styles.phaseItem,
                                        isPhaseLocked && styles.phaseItemLocked,
                                        hasSteps ? styles.phaseItemWithSteps : styles.phaseItemSimple
                                    ]}
                                    onPress={() => {
                                        if (!isPhaseLocked) {
                                            navigation.navigate('ChefPhaseDetail', {
                                                chantierId: selectedProject.id!,
                                                phaseId: phase.id,
                                                phaseName: phase.name,
                                            });
                                        }
                                    }}
                                    activeOpacity={isPhaseLocked ? 1 : 0.7}
                                >
                                    <View style={styles.phaseHeader}>
                                        <View style={styles.phaseInfo}>
                                            {isPhaseLocked ? (
                                                <MaterialIcons name="lock" size={20} color="#9CA3AF" />
                                            ) : (
                                                <MaterialIcons
                                                    name={(() => {
                                                        const realtimeStatus = getRealtimePhaseStatus(phase.id, phase.progress);
                                                        return realtimeStatus === 'completed' ? 'check-circle' : realtimeStatus === 'in-progress' ? 'radio-button-checked' : 'radio-button-unchecked';
                                                    })()}
                                                    size={20}
                                                    color={getPhaseStatusColor(getRealtimePhaseStatus(phase.id, phase.progress))}
                                                />
                                            )}
                                            <View style={styles.phaseNameContainer}>
                                                <Text style={[styles.phaseName, isPhaseLocked && styles.textLocked]}>
                                                    {phase.name}
                                                </Text>
                                                {hasSteps && (
                                                    <Text style={styles.phaseSubtitle}>
                                                        {phase.steps!.length} sous-étapes
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                        <View style={styles.phaseHeaderRight}>
                                            <Text style={[styles.phaseProgress, isPhaseLocked && styles.textLocked]}>
                                                {phase.progress}%
                                            </Text>
                                            {!isPhaseLocked && (
                                                <MaterialIcons name="chevron-right" size={20} color="#999" />
                                            )}
                                        </View>
                                    </View>

                                    <View style={styles.sliderContainer}>
                                        <View style={styles.progressBarContainer}>
                                            <View style={[styles.progressBarFill, { width: `${phase.progress}%`, backgroundColor: isPhaseLocked ? '#D1D5DB' : '#E96C2E' }]} />
                                        </View>
                                    </View>

                                    <View style={styles.phaseStatusContainer}>
                                        <Text style={[styles.phaseStatusText, { color: isPhaseLocked ? '#9CA3AF' : getPhaseStatusColor(getRealtimePhaseStatus(phase.id, phase.progress)) }]}>
                                            {isPhaseLocked ? 'Verrouillé' : (() => {
                                                const realtimeStatus = getRealtimePhaseStatus(phase.id, phase.progress);
                                                return realtimeStatus === 'completed' ? 'Terminé' : realtimeStatus === 'in-progress' ? 'En cours' : 'En attente';
                                            })()}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                </View>

                {/* Team Section */}
                <View style={styles.teamSection}>
                    <View style={styles.teamSectionHeader}>
                        <Text style={styles.sectionTitle}>Équipe</Text>
                        <TouchableOpacity style={styles.addMemberButton} onPress={() => setShowAddMemberForm(!showAddMemberForm)}>
                            <MaterialIcons name="person-add" size={20} color="#FFFFFF" />
                            <Text style={styles.addMemberButtonText}>Ajouter</Text>
                        </TouchableOpacity>
                    </View>

                    {showAddMemberForm && (
                        <View style={styles.addMemberForm}>
                            <View style={styles.formRow}>
                                <View style={styles.formField}>
                                    <Text style={styles.fieldLabel}>Nom complet *</Text>
                                    <TextInput style={styles.fieldInput} value={newMember.name} onChangeText={(text) => setNewMember({ ...newMember, name: text })} placeholder="Ex: Amadou Ba" autoCapitalize="words" />
                                </View>
                            </View>
                            <View style={styles.formRow}>
                                <View style={styles.formField}>
                                    <Text style={styles.fieldLabel}>Fonction</Text>
                                    <TextInput style={styles.fieldInput} value={newMember.role} onChangeText={(text) => setNewMember({ ...newMember, role: text })} placeholder="Ex: Maçon" autoCapitalize="words" />
                                </View>
                            </View>
                            <View style={styles.formButtons}>
                                <TouchableOpacity style={styles.cancelFormButton} onPress={() => { setShowAddMemberForm(false); setNewMember({ name: '', role: '', phone: '', experience: '' }); }}>
                                    <Text style={styles.cancelFormText}>Annuler</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.submitFormButton, !newMember.name.trim() && styles.disabledFormButton]} onPress={addTeamMember} disabled={!newMember.name.trim()}>
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
                                        {member.phone && <Text style={styles.memberPhone}>📞 {member.phone}</Text>}
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.removeMemberButton} onPress={() => removeMember(member)}>
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

                <TouchableOpacity
                    style={styles.showGalleryButton}
                    onPress={() => setShowImageCarousel(true)}
                >
                    <MaterialIcons name="photo-library" size={20} color="#E96C2E" />
                    <Text style={styles.showGalleryText}>Voir la galerie ({selectedProject.gallery?.length || 0})</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Image Carousel Modal - Keep it as modal for full screen view */}
            <Modal visible={showImageCarousel} animationType="fade" presentationStyle="fullScreen" statusBarTranslucent>
                <View style={styles.carouselContainer}>
                    <View style={styles.carouselHeader}>
                        <TouchableOpacity onPress={() => setShowImageCarousel(false)} style={styles.carouselCloseButton}>
                            <MaterialIcons name="close" size={30} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.carouselTitle}>{selectedImageIndex + 1} / {selectedProject.gallery?.length || 0}</Text>
                        <View style={styles.carouselHeaderSpacer} />
                    </View>
                    {selectedProject.gallery && selectedProject.gallery.length > 0 && (
                        <FlatList
                            data={selectedProject.gallery}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            initialScrollIndex={0}
                            getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
                            onMomentumScrollEnd={(event) => { const index = Math.round(event.nativeEvent.contentOffset.x / width); setSelectedImageIndex(index); }}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <View style={styles.carouselImageContainer}>
                                    {item.type === 'video' ? (
                                        <Video source={{ uri: item.url }} style={styles.carouselVideo} resizeMode={ResizeMode.CONTAIN} shouldPlay={false} isLooping={false} useNativeControls={true} />
                                    ) : (
                                        <Image source={{ uri: item.url }} style={styles.carouselImage} resizeMode="contain" />
                                    )}
                                    {item.description && <Text style={styles.carouselImageDescription}>{item.description}</Text>}
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
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { flex: 1 },
    projectCoverImage: { width: '100%', height: 200, resizeMode: 'cover' },
    placeholderImage: { backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },

    projectInfoPage: { padding: 20, backgroundColor: 'white', marginBottom: 10 },
    projectTitle: { fontSize: 22, fontWeight: 'bold', color: '#2B2E83', marginBottom: 5 },
    projectAddress: { fontSize: 16, color: '#6B7280', marginBottom: 15 },

    modalStats: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 15 },
    modalStatItem: { alignItems: 'center', flex: 1 },
    modalStatValue: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    modalStatLabel: { fontSize: 12, color: '#6B7280' },

    phasesSection: { padding: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#111827' },

    phaseItem: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#E96C2E', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    phaseItemLocked: { borderLeftColor: '#D1D5DB', opacity: 0.8 },
    phaseItemWithSteps: { borderLeftWidth: 4 },
    phaseItemSimple: { borderLeftWidth: 4 },

    phaseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    phaseInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    phaseNameContainer: { marginLeft: 12 },
    phaseName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
    textLocked: { color: '#9CA3AF' },
    phaseSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    phaseHeaderRight: { flexDirection: 'row', alignItems: 'center' },
    phaseProgress: { fontSize: 14, fontWeight: '600', color: '#2B2E83', marginRight: 4 },

    phaseStatusContainer: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'flex-end' },
    phaseStatusText: { fontSize: 12, fontWeight: '500' },

    sliderContainer: { marginTop: 8 },
    progressBarContainer: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden', width: '100%', marginTop: 4 },
    progressBarFill: { height: '100%', borderRadius: 3 },

    stepsContainer: { marginTop: 12, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: '#F3F4F6' },
    stepsContainerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingLeft: 12 },
    stepsContainerTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' },
    nonLinearBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    nonLinearText: { fontSize: 10, color: '#E96C2E', fontWeight: '500', marginLeft: 4 },

    stepItem: { marginBottom: 12 },
    stepItemLocked: { opacity: 0.6 },
    stepMainContent: { flexDirection: 'row' },
    stepIndicatorContainer: { alignItems: 'center', width: 24, marginRight: 8 },
    stepConnector: { width: 2, height: 10, backgroundColor: '#E5E7EB' },
    stepConnectorBottom: { width: 2, flex: 1, backgroundColor: '#E5E7EB', minHeight: 10 },
    stepIndicator: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
    stepNumber: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },

    stepContent: { flex: 1, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8 },
    stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    stepTitleContainer: { flex: 1, marginRight: 8 },
    stepName: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 },
    stepStatus: { fontSize: 11, fontWeight: '500' },
    stepHeaderRight: { flexDirection: 'row', alignItems: 'center' },
    stepProgress: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginRight: 4 },


    teamSection: { padding: 20, backgroundColor: 'white', marginTop: 10 },
    teamSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    addMemberButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2B2E83', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    addMemberButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', marginLeft: 4 },

    addMemberForm: { backgroundColor: '#F9FAFB', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#E5E7EB' },
    formRow: { marginBottom: 12 },
    formField: { marginBottom: 0 },
    fieldLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 },
    fieldInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: '#1F2937' },
    formButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
    cancelFormButton: { paddingVertical: 8, paddingHorizontal: 16, marginRight: 8 },
    cancelFormText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
    submitFormButton: { backgroundColor: '#2B2E83', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
    disabledFormButton: { opacity: 0.5 },
    submitFormText: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },

    teamMember: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    memberInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    memberDetails: { marginLeft: 12 },
    memberName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
    memberRole: { fontSize: 12, color: '#6B7280' },
    memberPhone: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    removeMemberButton: { padding: 8 },
    emptyTeam: { alignItems: 'center', paddingVertical: 20 },
    emptyTeamText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
    emptyTeamSubtext: { fontSize: 12, color: '#D1D5DB', marginTop: 4 },

    showGalleryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, backgroundColor: 'white', marginTop: 1, marginBottom: 30 },
    showGalleryText: { color: '#E96C2E', fontWeight: '600', marginLeft: 8 },

    carouselContainer: { flex: 1, backgroundColor: 'black' },
    carouselHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
    carouselCloseButton: { padding: 5 },
    carouselTitle: { color: 'white', fontSize: 16, fontWeight: '600' },
    carouselHeaderSpacer: { width: 40 },
    carouselImageContainer: { width: width, height: '100%', justifyContent: 'center', alignItems: 'center' },
    carouselImage: { width: '100%', height: '80%' },
    carouselVideo: { width: '100%', height: '80%' },
    carouselImageDescription: { position: 'absolute', bottom: 50, left: 20, right: 20, color: 'white', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 8 },
});
