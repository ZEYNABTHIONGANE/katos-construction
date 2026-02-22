
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

type Props = NativeStackScreenProps<RootStackParamList, 'BuyerChecklist'>;

interface ChecklistItem {
    id: string;
    title: string;
    description: string;
    checked: boolean;
}

interface ChecklistSection {
    id: string;
    title: string;
    items: ChecklistItem[];
    isOpen: boolean;
}

const INITIAL_SECTIONS: ChecklistSection[] = [
    {
        id: 'sec1',
        title: '1. Vérification Foncière',
        isOpen: true,
        items: [
            { id: 'i1', title: 'Identifiant NICAD', description: 'Vérifier que le terrain possède un numéro NICAD valide.', checked: false },
            { id: 'i2', title: 'Nature du Titre', description: 'Confirmer s\'il s\'agit d\'un Titre Foncier, Bail ou Délibération.', checked: false },
            { id: 'i3', title: 'État Réel récent', description: 'Demander un certificat d\'état réel aux Domaines (moins de 3 mois).', checked: false },
        ],
    },
    {
        id: 'sec2',
        title: '2. Sécurisation Juridique',
        isOpen: false,
        items: [
            { id: 'i4', title: 'Choix du Notaire', description: 'Sélectionner un notaire pour superviser la transaction.', checked: false },
            { id: 'i5', title: 'Promesse de vente', description: 'Signer un compromis avec les conditions suspensives.', checked: false },
            { id: 'i6', title: 'Paiement notarié', description: 'Effectuer le règlement sur le compte séquestre du notaire.', checked: false },
        ],
    },
    {
        id: 'sec3',
        title: '3. Urbanisme & Technique',
        isOpen: false,
        items: [
            { id: 'i7', title: 'Certificat d\'Urbanisme', description: 'Vérifier la constructibilité et les servitudes.', checked: false },
            { id: 'i8', title: 'Étude de Sol', description: 'Réaliser un sondage géotechnique pour les fondations.', checked: false },
            { id: 'i9', title: 'Bornage contradictoire', description: 'Faire vérifier les limites par un géomètre agréé.', checked: false },
        ],
    },
];

export default function BuyerChecklistScreen({ navigation }: Props) {
    const [sections, setSections] = useState<ChecklistSection[]>(INITIAL_SECTIONS);

    const toggleSection = (sectionId: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSections(prev => prev.map(sec =>
            sec.id === sectionId ? { ...sec, isOpen: !sec.isOpen } : sec
        ));
    };

    const toggleItem = (sectionId: string, itemId: string) => {
        setSections(prev => prev.map(sec => {
            if (sec.id === sectionId) {
                return {
                    ...sec,
                    items: sec.items.map(item =>
                        item.id === itemId ? { ...item, checked: !item.checked } : item
                    )
                };
            }
            return sec;
        }));
    };

    const calculateProgress = () => {
        const total = sections.reduce((acc, sec) => acc + sec.items.length, 0);
        const checked = sections.reduce((acc, sec) => acc + sec.items.filter(i => i.checked).length, 0);
        return (checked / total) * 100;
    };

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['bottom']} style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Guide d'Achat Sécurisé</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Progress Header */}
                    <View style={styles.progressCard}>
                        <View style={styles.progressTextRow}>
                            <Text style={styles.progressLabel}>Votre progression</Text>
                            <Text style={styles.progressPercent}>{Math.round(calculateProgress())}%</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${calculateProgress()}%` }]} />
                        </View>
                        <Text style={styles.progressHint}>
                            {calculateProgress() === 100 ? "Félicitations ! Vous êtes prêt à construire." : "Suivez ces étapes pour sécuriser votre investissement."}
                        </Text>
                    </View>

                    {/* Sections */}
                    {sections.map((section) => (
                        <View key={section.id} style={styles.sectionContainer}>
                            <TouchableOpacity
                                style={styles.sectionHeader}
                                onPress={() => toggleSection(section.id)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.sectionTitle}>{section.title}</Text>
                                <MaterialIcons
                                    name={section.isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                                    size={24}
                                    color="#2B2E83"
                                />
                            </TouchableOpacity>

                            {section.isOpen && (
                                <View style={styles.itemsList}>
                                    {section.items.map((item) => (
                                        <TouchableOpacity
                                            key={item.id}
                                            style={styles.itemRow}
                                            onPress={() => toggleItem(section.id, item.id)}
                                            activeOpacity={0.6}
                                        >
                                            <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                                                {item.checked && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
                                            </View>
                                            <View style={styles.itemInfo}>
                                                <Text style={[styles.itemTitle, item.checked && styles.itemTitleChecked]}>
                                                    {item.title}
                                                </Text>
                                                <Text style={styles.itemDescription}>{item.description}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    ))}

                    {/* Expert Help CTA */}
                    <TouchableOpacity
                        style={styles.expertCta}
                        onPress={() => navigation.navigate('BTPAdvice')}
                    >
                        <MaterialIcons name="live-help" size={24} color="#E96C2E" />
                        <View style={styles.expertCtaInfo}>
                            <Text style={styles.expertCtaTitle}>Besoin d'aide sur une étape ?</Text>
                            <Text style={styles.expertCtaDesc}>Parlez gratuitement à notre conseiller expert.</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#2B2E83',
        paddingTop: 70,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        color: '#FFFFFF',
        fontFamily: 'FiraSans_700Bold',
    },
    scrollContent: {
        padding: 16,
    },
    progressCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    progressTextRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 12,
    },
    progressLabel: {
        fontSize: 16,
        color: '#1F2937',
        fontFamily: 'FiraSans_600SemiBold',
    },
    progressPercent: {
        fontSize: 24,
        color: '#2B2E83',
        fontFamily: 'FiraSans_700Bold',
    },
    progressBarBg: {
        height: 10,
        backgroundColor: '#E5E7EB',
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 5,
    },
    progressHint: {
        fontSize: 12,
        color: '#6B7280',
        fontStyle: 'italic',
    },
    sectionContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 18,
        backgroundColor: '#F9FAFB',
    },
    sectionTitle: {
        fontSize: 16,
        color: '#2B2E83',
        fontFamily: 'FiraSans_700Bold',
    },
    itemsList: {
        padding: 12,
    },
    itemRow: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 8,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    checkboxChecked: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    itemInfo: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 15,
        color: '#374151',
        fontFamily: 'FiraSans_600SemiBold',
    },
    itemTitleChecked: {
        textDecorationLine: 'line-through',
        color: '#9CA3AF',
    },
    itemDescription: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
        lineHeight: 16,
    },
    expertCta: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7ED',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FED7AA',
        marginTop: 8,
    },
    expertCtaInfo: {
        flex: 1,
        marginLeft: 12,
    },
    expertCtaTitle: {
        fontSize: 14,
        color: '#9A3412',
        fontFamily: 'FiraSans_700Bold',
    },
    expertCtaDesc: {
        fontSize: 12,
        color: '#C2410C',
        marginTop: 2,
    },
});
