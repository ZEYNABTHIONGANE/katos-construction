
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { prospectService } from '../services/prospectService';
import AppHeader from '../components/AppHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'ProspectForm'>;

export default function ProspectFormScreen({ navigation, route }: Props) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        project: route.params?.interestedProject || '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!formData.firstName || !formData.lastName || !formData.phone || !formData.email) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
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

    return (
        <View style={styles.container}>
            <AppHeader
                title="Devenir Propriétaire"
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
                            Remplissez ce formulaire pour recevoir une documentation complète et être contacté par l'un de nos conseillers.
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Prénom *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Votre prénom"
                                value={formData.firstName}
                                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nom *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Votre nom"
                                value={formData.lastName}
                                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                            />
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

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Projet ou programme souhaité</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: AS SALAM SA KEUR, Villa Oasis..."
                                value={formData.project}
                                onChangeText={(text) => setFormData({ ...formData, project: text })}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.submitBtn, loading && styles.disabledBtn]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            <Text style={styles.submitBtnText}>
                                {loading ? 'Envoi en cours...' : 'Envoyer ma demande'}
                            </Text>
                            {!loading && <MaterialIcons name="send" size={20} color="#FFFFFF" />}
                        </TouchableOpacity>

                        <Text style={styles.privacyNote}>
                            En envoyant ce formulaire, vous acceptez que Katos Construction utilise vos données pour vous recontacter.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        fontSize: 16,
        color: '#4B5563',
        fontFamily: 'FiraSans_400Regular',
        lineHeight: 24,
        marginBottom: 25,
    },
    inputGroup: {
        marginBottom: 20,
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
    submitBtn: {
        backgroundColor: '#E96C2E',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 10,
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
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 20,
        fontFamily: 'FiraSans_400Regular',
    },
});
