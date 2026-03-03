import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Modal,
    FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { prospectService } from '../services/prospectService';
import { useShowcaseData } from '../hooks/useShowcaseData';
import { useClientSpecificData } from '../hooks/useClientSpecificData';
import AppHeader from '../components/AppHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'ProspectForm'>;

export default function ProspectFormScreen({ navigation, route }: Props) {
    const { clientInfo } = useClientSpecificData();
    const { villas } = useShowcaseData();

    const initialType = route.params?.interestedProject === 'Personnalisé' ? 'Custom' :
        route.params?.interestedProject === 'Rendez-vous' ? 'Meeting' : 'Standard';

    const [formData, setFormData] = useState({
        firstName: clientInfo?.firstName || '',
        lastName: clientInfo?.lastName || '',
        phone: '', // Keep phone empty or use a specific field if available
        email: clientInfo?.email || '',
        project: route.params?.interestedProject || '',
        type: initialType as 'Standard' | 'Custom' | 'Meeting',
        terrainLocation: '',
        terrainSurface: '',
        hasTitreFoncier: false,
        budget: route.params?.estimatedBudget?.toLocaleString('fr-FR') || '',
        description: '',
        projectStage: 'Ideation', // New field
        finishingLevel: 'Medium',  // New field
    });

    const [loading, setLoading] = useState(false);
    const [showPicker, setShowPicker] = useState(false);

    // Synchroniser les changements de paramètres (ex: retour du simulateur)
    React.useEffect(() => {
        if (route.params?.interestedProject || route.params?.estimatedBudget) {
            setFormData(prev => ({
                ...prev,
                project: (route.params?.interestedProject as string) || prev.project,
                budget: route.params?.estimatedBudget ? route.params.estimatedBudget.toLocaleString('fr-FR') : prev.budget,
                type: (route.params?.interestedProject === 'Personnalisé' ? 'Custom' :
                    route.params?.interestedProject === 'Rendez-vous' ? 'Meeting' : 'Standard')
            }));
        }
    }, [route.params?.interestedProject, route.params?.estimatedBudget]);

    const handleSubmit = async () => {
        if (!formData.firstName || !formData.lastName || !formData.email) {
            Alert.alert('Erreur', 'Veuillez remplir les informations de contact.');
            return;
        }

        setLoading(true);
        try {
            await prospectService.addProspect({
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                email: formData.email,
                project: formData.project,
                type: formData.type,
                terrainLocation: formData.terrainLocation,
                terrainSurface: formData.terrainSurface,
                hasTitreFoncier: formData.hasTitreFoncier,
                budget: formData.budget,
                description: formData.description,
            });

            setLoading(false);
            Alert.alert(
                'Succès',
                'Votre demande a été enregistrée. Un conseiller vous contactera prochainement.',
                [{ text: 'OK', onPress: () => navigation.navigate('Showcase') }]
            );
        } catch (error) {
            console.error('Submission error:', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors de l\'envoi de votre demande.');
            setLoading(false);
        }
    };

    const selectProject = (projectName: string) => {
        setFormData({ ...formData, project: projectName, type: 'Standard' });
        setShowPicker(false);
    };

    return (
        <View style={styles.container}>
            <AppHeader
                title={formData.type === 'Meeting' ? "Prendre Rendez-vous" : "Lancer mon projet"}
                showBack={true}
                showNotification={false}
                onBackPress={() => navigation.goBack()}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.formCard}>
                        <Text style={styles.formIntro}>
                            {formData.type === 'Meeting'
                                ? "Demandez une étude technique offerte pour votre projet de construction."
                                : "Remplissez ce formulaire pour une étude réelle de votre projet construction."}
                        </Text>

                        {/* Basic Contact Info */}
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="person" size={20} color="#2B2E83" />
                            <Text style={styles.sectionTitle}>Coordonnées</Text>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>Prénom *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Prénom"
                                    value={formData.firstName}
                                    onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Nom *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nom"
                                    value={formData.lastName}
                                    onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Téléphone *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="+221 ..."
                                keyboardType="phone-pad"
                                value={formData.phone}
                                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="votre@email.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={formData.email}
                                onChangeText={(text) => setFormData({ ...formData, email: text })}
                            />
                        </View>

                        {/* Project Choice if not direct */}
                        {formData.type === 'Standard' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Modèle immobilier choisi</Text>
                                <TouchableOpacity
                                    style={styles.pickerTrigger}
                                    onPress={() => setShowPicker(true)}
                                >
                                    <View style={styles.pickerContent}>
                                        <MaterialIcons name="holiday-village" size={20} color="#2B2E83" style={{ marginRight: 10 }} />
                                        <Text style={[
                                            styles.pickerTriggerText,
                                            !formData.project && { color: '#9CA3AF' }
                                        ]}>
                                            {formData.project || 'Sélectionner un modèle'}
                                        </Text>
                                    </View>
                                    <MaterialIcons name="expand-more" size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Technical Details (Conditional) */}
                        {formData.type !== 'Meeting' && (
                            <>
                                <View style={styles.divider} />
                                <View style={styles.sectionHeader}>
                                    <MaterialIcons name="landscape" size={20} color="#2B2E83" />
                                    <Text style={styles.sectionTitle}>Détails du terrain</Text>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Localisation du terrain *</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ex: Yenne, Diamniadio..."
                                        value={formData.terrainLocation}
                                        onChangeText={(text) => setFormData({ ...formData, terrainLocation: text })}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Surface approximative (m²) *</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ex: 200"
                                        keyboardType="numeric"
                                        value={formData.terrainSurface}
                                        onChangeText={(text) => setFormData({ ...formData, terrainSurface: text })}
                                    />
                                </View>

                                <View style={styles.switchGroup}>
                                    <Text style={styles.label}>Détenez-vous un Titre Foncier ?</Text>
                                    <View style={styles.switchRow}>
                                        <TouchableOpacity
                                            style={[styles.switchOption, formData.hasTitreFoncier && styles.switchActive]}
                                            onPress={() => setFormData({ ...formData, hasTitreFoncier: true })}
                                        >
                                            <Text style={[styles.switchText, formData.hasTitreFoncier && styles.switchTextActive]}>Oui</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.switchOption, !formData.hasTitreFoncier && styles.switchActive]}
                                            onPress={() => setFormData({ ...formData, hasTitreFoncier: false })}
                                        >
                                            <Text style={[styles.switchText, !formData.hasTitreFoncier && styles.switchTextActive]}>Non / En cours</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        )}

                        {/* Niveau de finition souhaité (Conditional) */}
                        {formData.type !== 'Meeting' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Niveau de finition souhaité</Text>
                                <View style={styles.switchRow}>
                                    {[
                                        { id: 'Economic', label: 'Éco' },
                                        { id: 'Medium', label: 'Standing' },
                                        { id: 'High', label: 'Luxe' }
                                    ].map((level) => (
                                        <TouchableOpacity
                                            key={level.id}
                                            style={[styles.smallSwitchOption, formData.finishingLevel === level.id && styles.switchActive]}
                                            onPress={() => setFormData({ ...formData, finishingLevel: level.id })}
                                        >
                                            <Text style={[styles.switchText, formData.finishingLevel === level.id && styles.switchTextActive]}>
                                                {level.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Custom OR Simulation Budget */}
                        {(formData.type === 'Custom' || (formData.type === 'Standard' && formData.budget)) && (
                            <>
                                <View style={styles.divider} />
                                <View style={styles.sectionHeader}>
                                    <MaterialIcons name="engineering" size={20} color="#2B2E83" />
                                    <Text style={styles.sectionTitle}>{formData.type === 'Custom' ? 'Étude technique' : 'Estimation Simulation'}</Text>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>État d'avancement de votre projet</Text>
                                    <View style={styles.switchRow}>
                                        {[
                                            { id: 'Ideation', label: 'Idée' },
                                            { id: 'Planning', label: 'Prêt' },
                                            { id: 'Urgent', label: 'Urgent' }
                                        ].map((stage) => (
                                            <TouchableOpacity
                                                key={stage.id}
                                                style={[styles.smallSwitchOption, formData.projectStage === stage.id && styles.switchActive]}
                                                onPress={() => setFormData({ ...formData, projectStage: stage.id })}
                                            >
                                                <Text style={[styles.switchText, formData.projectStage === stage.id && styles.switchTextActive]}>
                                                    {stage.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>{formData.type === 'Custom' ? 'Budget estimé (FCFA)' : 'Budget calculé (FCFA)'}</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Votre budget prévisionnel"
                                        keyboardType="numeric"
                                        value={formData.budget}
                                        onChangeText={(text) => setFormData({ ...formData, budget: text })}
                                    />
                                </View>
                            </>
                        )}

                        {/* Custom Only Description */}
                        {formData.type === 'Custom' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Description du projet</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Décrivez brièvement vos besoins..."
                                    multiline
                                    numberOfLines={4}
                                    value={formData.description}
                                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                                />
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.submitBtn, loading && styles.disabledBtn]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            <Text style={styles.submitBtnText}>
                                {loading ? 'Envoi en cours...' : formData.type === 'Meeting' ? 'Demander RDV' : 'Envoyer ma demande'}
                            </Text>
                            {!loading && <MaterialIcons name="send" size={20} color="#FFFFFF" />}
                        </TouchableOpacity>

                        <Text style={styles.privacyNote}>
                            * Champs obligatoires. En envoyant ce formulaire, vous acceptez d'être recontacté pour une étude technique.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal
                visible={showPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Sélectionnez un projet</Text>
                            <TouchableOpacity onPress={() => setShowPicker(false)}>
                                <MaterialIcons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={villas}
                            keyExtractor={(item) => item.id || item.name}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.projectItem}
                                    onPress={() => selectProject(item.name)}
                                >
                                    <View style={styles.projectItemContent}>
                                        <Text style={styles.projectName}>{item.name}</Text>
                                        <Text style={styles.projectType}>{item.type}</Text>
                                    </View>
                                    {formData.project === item.name && (
                                        <MaterialIcons name="check" size={20} color="#E96C2E" />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>Aucun projet disponible pour le moment.</Text>
                                </View>
                            }
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    formIntro: {
        fontSize: 15,
        color: '#4B5563',
        fontFamily: 'FiraSans_400Regular',
        lineHeight: 22,
        marginBottom: 25,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 5,
    },
    sectionTitle: {
        fontSize: 16,
        color: '#2B2E83',
        fontFamily: 'FiraSans_700Bold',
        marginLeft: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    inputGroup: {
        marginBottom: 18,
    },
    label: {
        fontSize: 14,
        color: '#374151',
        fontFamily: 'FiraSans_600SemiBold',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#111827',
        fontFamily: 'FiraSans_400Regular',
    },
    pickerTrigger: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pickerTriggerText: {
        fontSize: 16,
        color: '#111827',
        fontFamily: 'FiraSans_400Regular',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 20,
    },
    switchGroup: {
        marginBottom: 20,
    },
    switchRow: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 4,
    },
    switchOption: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    smallSwitchOption: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        marginHorizontal: 3,
    },
    switchActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    switchText: {
        fontSize: 14,
        fontFamily: 'FiraSans_600SemiBold',
        color: '#6B7280',
    },
    switchTextActive: {
        color: '#2B2E83',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    submitBtn: {
        backgroundColor: '#E96C2E',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 20,
        gap: 10,
    },
    disabledBtn: {
        opacity: 0.7,
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'FiraSans_700Bold',
    },
    privacyNote: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 20,
        fontFamily: 'FiraSans_400Regular',
        lineHeight: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingTop: 20,
        paddingHorizontal: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: 18,
        color: '#111827',
        fontFamily: 'FiraSans_700Bold',
    },
    projectItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
    },
    projectItemContent: {
        flex: 1,
    },
    projectName: {
        fontSize: 16,
        color: '#111827',
        fontFamily: 'FiraSans_600SemiBold',
    },
    projectType: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'FiraSans_400Regular',
        marginTop: 2,
    },
    separator: {
        height: 1,
        backgroundColor: '#F3F4F6',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontFamily: 'FiraSans_400Regular',
        textAlign: 'center',
    },
});
