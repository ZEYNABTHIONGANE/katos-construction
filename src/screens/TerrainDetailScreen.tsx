import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
    Alert,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Linking
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { LinearGradient } from 'expo-linear-gradient';
import { terrainService } from '../services/terrainService';

type Props = NativeStackScreenProps<RootStackParamList, 'TerrainDetail'>;
const { width } = Dimensions.get('window');

export default function TerrainDetailScreen({ route, navigation }: Props) {
    const { terrain } = route.params;
    const [isInterested, setIsInterested] = useState(false);
    const [contactMode, setContactMode] = useState<'choice' | 'form'>('choice');
    const [form, setForm] = useState({
        nom: '',
        email: '',
        telephone: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleWhatsApp = () => {
        const message = `Bonjour, je suis intéressé par le terrain ${terrain.name} (Réf: ${terrain.reference}) situé à ${terrain.zone}.`;
        const phone = '221770326990';
        const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
        const webUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Linking.openURL(webUrl);
            }
        }).catch(() => {
            Linking.openURL(webUrl);
        });
    };

    const handleSubmit = async () => {
        if (!form.nom || !form.telephone) {
            Alert.alert('Erreur', 'Veuillez remplir au moins votre nom et téléphone.');
            return;
        }

        setIsSubmitting(true);
        try {
            await terrainService.submitInterest(terrain.id!, {
                ...form,
                terrainRef: terrain.reference,
                terrainName: terrain.name
            });
            Alert.alert(
                'Succès',
                'Votre demande a été envoyée avec succès. Notre équipe vous contactera prochainement.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', "Une erreur est survenue lors de l'envoi de votre demande.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView style={styles.container} bounces={false}>
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: terrain.images?.[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2232&auto=format&fit=crop' }}
                        style={styles.mainImage}
                    />
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.6)']}
                        style={styles.imageOverlay}
                    />
                </View>

                <View style={styles.content}>
                    <View style={styles.badgeRow}>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>{terrain.status}</Text>
                        </View>
                        <Text style={styles.refText}>{terrain.reference}</Text>
                    </View>

                    <Text style={styles.title}>{terrain.name}</Text>
                    <Text style={styles.price}>{terrain.price.toLocaleString()} {terrain.currency}</Text>

                    <View style={styles.statsContainer}>
                        <StatItem icon="square-foot" label="Surface" value={`${terrain.surface} m²`} />
                        <StatItem icon="description" label="Document" value={terrain.documentType} />
                        <StatItem icon="place" label="Zone" value={terrain.zone} />
                    </View>

                    <View style={styles.featuresContainer}>
                        <FeatureItem icon="water_drop" label="Eau" active={terrain.hasWater} />
                        <FeatureItem icon="flash_on" label="Électricité" active={terrain.hasElectricity} />
                        <FeatureItem icon="groups" label="Zone habitée" active={terrain.isHabited} />
                    </View>

                    <View style={styles.descriptionSection}>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.description}>{terrain.description}</Text>
                    </View>

                    {!isInterested ? (
                        <TouchableOpacity
                            style={styles.mainAction}
                            onPress={() => setIsInterested(true)}
                        >
                            <Text style={styles.mainActionText}>Je suis intéressé</Text>
                        </TouchableOpacity>
                    ) : contactMode === 'choice' ? (
                        <View style={styles.choiceContainer}>
                            <Text style={styles.formTitle}>Comment souhaitez-vous nous contacter ?</Text>

                            <TouchableOpacity
                                style={[styles.choiceBtn, { backgroundColor: '#25D366' }]}
                                onPress={handleWhatsApp}
                            >
                                <FontAwesome name="whatsapp" size={24} color="#FFFFFF" />
                                <Text style={styles.choiceBtnText}>WhatsApp</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.choiceBtn, { backgroundColor: '#2B2E83' }]}
                                onPress={() => setContactMode('form')}
                            >
                                <MaterialIcons name="email" size={24} color="#FFFFFF" />
                                <Text style={styles.choiceBtnText}>Formulaire de contact</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.cancelLink}
                                onPress={() => {
                                    setIsInterested(false);
                                    setContactMode('choice');
                                }}
                            >
                                <Text style={styles.cancelLinkText}>Annuler</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.formContainer}>
                            <Text style={styles.formTitle}>Contactez-nous pour ce terrain</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Nom & Prénom"
                                value={form.nom}
                                onChangeText={(val) => setForm({ ...form, nom: val })}
                                placeholderTextColor="#9CA3AF"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Téléphone"
                                value={form.telephone}
                                onChangeText={(val) => setForm({ ...form, telephone: val })}
                                keyboardType="phone-pad"
                                placeholderTextColor="#9CA3AF"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                value={form.email}
                                onChangeText={(val) => setForm({ ...form, email: val })}
                                keyboardType="email-address"
                                placeholderTextColor="#9CA3AF"
                            />
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Message (optionnel)"
                                value={form.message}
                                onChangeText={(val) => setForm({ ...form, message: val })}
                                multiline
                                numberOfLines={4}
                                placeholderTextColor="#9CA3AF"
                            />

                            <TouchableOpacity
                                style={[styles.mainAction, isSubmitting && { opacity: 0.7 }]}
                                onPress={handleSubmit}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.mainActionText}>
                                    {isSubmitting ? 'Envoi...' : 'Envoyer ma demande'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.cancelLink}
                                onPress={() => setContactMode('choice')}
                            >
                                <Text style={styles.cancelLinkText}>Retour</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
                <View style={{ height: 50 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function StatItem({ icon, label, value }: any) {
    return (
        <View style={styles.statItem}>
            <MaterialIcons name={icon} size={20} color="#2B2E83" />
            <View style={{ marginLeft: 8 }}>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={styles.statValue}>{value}</Text>
            </View>
        </View>
    );
}

function FeatureItem({ icon, label, active }: any) {
    return (
        <View style={styles.featureBox}>
            <MaterialIcons
                name={active ? 'check-circle' : 'cancel'}
                size={18}
                color={active ? '#10B981' : '#9CA3AF'}
            />
            <Text style={[styles.featureLabel, !active && { color: '#9CA3AF' }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    imageContainer: {
        height: 300,
        width: width,
        position: 'relative',
    },
    mainImage: {
        width: '100%',
        height: '100%',
    },
    backBtn: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
    },
    content: {
        padding: 24,
        marginTop: -20,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    badgeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusBadge: {
        backgroundColor: '#DEF7EC',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontFamily: 'FiraSans_700Bold',
        color: '#03543F',
    },
    refText: {
        fontSize: 14,
        fontFamily: 'FiraSans_600SemiBold',
        color: '#E96C2E',
    },
    title: {
        fontSize: 28,
        fontFamily: 'FiraSans_700Bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    price: {
        fontSize: 24,
        fontFamily: 'FiraSans_700Bold',
        color: '#2B2E83',
        marginBottom: 24,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 10,
        fontFamily: 'FiraSans_400Regular',
        color: '#6B7280',
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 14,
        fontFamily: 'FiraSans_700Bold',
        color: '#1F2937',
    },
    featuresContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    featureBox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    featureLabel: {
        fontSize: 12,
        fontFamily: 'FiraSans_600SemiBold',
        color: '#1F2937',
        marginLeft: 6,
    },
    descriptionSection: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'FiraSans_700Bold',
        color: '#1F2937',
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        fontFamily: 'FiraSans_400Regular',
        color: '#4B5563',
        lineHeight: 22,
    },
    mainAction: {
        backgroundColor: '#2B2E83',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#2B2E83',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    mainActionText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'FiraSans_700Bold',
    },
    formContainer: {
        backgroundColor: '#F3F4F6',
        padding: 20,
        borderRadius: 20,
    },
    formTitle: {
        fontSize: 18,
        fontFamily: 'FiraSans_700Bold',
        color: '#1F2937',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        fontSize: 16,
        fontFamily: 'FiraSans_400Regular',
        color: '#1F2937',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    choiceContainer: {
        backgroundColor: '#F3F4F6',
        padding: 24,
        borderRadius: 24,
    },
    choiceBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 12,
        gap: 12,
    },
    choiceBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'FiraSans_700Bold',
    },
    cancelLink: {
        marginTop: 15,
        alignItems: 'center',
    },
    cancelLinkText: {
        color: '#6B7280',
        fontFamily: 'FiraSans_600SemiBold',
    }
});
