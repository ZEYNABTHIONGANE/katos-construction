
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'BudgetEstimator'>;

const ZONES_DAKAR = [
    { id: 'ville', label: 'Ville', pricePerM2: 350000, description: 'Dakar Plateau, Almadies, etc.' },
    { id: 'centre', label: 'Centre', pricePerM2: 250000, description: 'Médina, Grand Dakar, etc.' },
    { id: 'banlieue', label: 'Banlieue', pricePerM2: 150000, description: 'Pikine, Guédiawaye, Keur Massar, etc.' },
];

const BUILDING_LEVELS = [
    { id: 'RC', label: 'RC', multiplier: 1 },
    { id: 'R+1', label: 'R+1', multiplier: 2 },
    { id: 'R+2', label: 'R+2', multiplier: 3 },
    { id: 'R+3', label: 'R+3', multiplier: 4 },
    { id: 'R+4', label: 'R+4', multiplier: 5 },
    { id: 'R+5', label: 'R+5', multiplier: 6 },
    { id: 'R+6', label: 'R+6', multiplier: 7 },
    { id: 'R+7', label: 'R+7', multiplier: 8 },
    { id: 'R+8', label: 'R+8', multiplier: 9 },
    { id: 'R+9', label: 'R+9', multiplier: 10 },
    { id: 'R+10', label: 'R+10', multiplier: 11 },
];

export default function BudgetEstimatorScreen({ navigation }: Props) {
    const [surface, setSurface] = useState<number>(0);
    const [selectedZone, setSelectedZone] = useState<typeof ZONES_DAKAR[number] | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<typeof BUILDING_LEVELS[number] | null>(null);
    const [totalBudget, setTotalBudget] = useState(0);

    useEffect(() => {
        if (surface > 0 && selectedZone && selectedLevel) {
            const buildSurface = surface * selectedLevel.multiplier;
            setTotalBudget(buildSurface * selectedZone.pricePerM2 * 0.75);
        } else {
            setTotalBudget(0);
        }
    }, [surface, selectedZone, selectedLevel]);

    const formatPrice = (price: number) => {
        return price.toLocaleString('fr-FR') + ' FCFA';
    };

    const incrementSurface = (val: number) => {
        setSurface(prev => Math.max(20, Math.min(1000, prev + val)));
    };

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['bottom']} style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Simulateur de Budget</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>


                    {/* Controls Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="straighten" size={20} color="#2B2E83" />
                            <Text style={styles.sectionTitle}>Surface au sol (m²)</Text>
                        </View>

                        <View style={styles.surfaceControl}>
                            <TouchableOpacity onPress={() => incrementSurface(-10)} style={styles.stepButton}>
                                <MaterialIcons name="remove" size={24} color="#2B2E83" />
                            </TouchableOpacity>

                            <View style={styles.surfaceValueContainer}>
                                <TextInput
                                    style={styles.surfaceInput}
                                    keyboardType="numeric"
                                    value={surface.toString()}
                                    onChangeText={(text) => setSurface(parseInt(text) || 0)}
                                />
                                <Text style={styles.surfaceUnit}>m²</Text>
                            </View>

                            <TouchableOpacity onPress={() => incrementSurface(5)} style={styles.stepButton}>
                                <MaterialIcons name="add" size={24} color="#2B2E83" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Niveau Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="business" size={20} color="#2B2E83" />
                            <Text style={styles.sectionTitle}>Nombre de niveaux</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levelsContainer}>
                            {BUILDING_LEVELS.map((level) => (
                                <TouchableOpacity
                                    key={level.id}
                                    style={[
                                        styles.levelItem,
                                        selectedLevel?.id === level.id && styles.levelItemSelected
                                    ]}
                                    onPress={() => setSelectedLevel(level)}
                                >
                                    <Text style={[
                                        styles.levelLabel,
                                        selectedLevel?.id === level.id && styles.levelLabelSelected
                                    ]}>{level.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Zone Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="map" size={20} color="#2B2E83" />
                            <Text style={styles.sectionTitle}>Zone de construction (Dakar)</Text>
                        </View>

                        {ZONES_DAKAR.map((zone) => (
                            <TouchableOpacity
                                key={zone.id}
                                style={[
                                    styles.finishItem,
                                    selectedZone?.id === zone.id && styles.finishItemSelected
                                ]}
                                onPress={() => setSelectedZone(zone)}
                            >
                                <View style={styles.finishInfo}>
                                    <Text style={[
                                        styles.finishLabel,
                                        selectedZone?.id === zone.id && styles.finishLabelSelected
                                    ]}>{zone.label}</Text>
                                    <Text style={styles.finishDesc}>{zone.description}</Text>
                                </View>
                                <View style={styles.finishPriceBox}>
                                    <Text style={[
                                        styles.finishPrice,
                                        selectedZone?.id === zone.id && styles.finishPriceSelected
                                    ]}>~{zone.pricePerM2.toLocaleString()} / m²</Text>
                                </View>
                                {selectedZone?.id === zone.id && (
                                    <MaterialIcons name="check-circle" size={24} color="#E96C2E" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Hero Card Result */}
                    <LinearGradient
                        colors={['#2B2E83', '#4B4FA3'] as const}
                        style={styles.resultCard}
                    >
                        <Text style={styles.resultLabel}>Budget Total Estimé</Text>
                        <Text style={styles.resultValue}>{formatPrice(totalBudget)}</Text>
                        <View style={styles.resultDivider} />
                        <View style={styles.resultDetails}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Gros Œuvre</Text>
                                <Text style={styles.detailValue}>{formatPrice(totalBudget * 0.4)}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Second Œuvre</Text>
                                <Text style={styles.detailValue}>{formatPrice(totalBudget * 0.6)}</Text>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Advice Box */}
                    <View style={styles.adviceBox}>
                        <MaterialIcons name="info" size={24} color="#2B2E83" />
                        <Text style={styles.adviceText}>
                            Cette estimation inclut les matériaux et la main d'œuvre. Elle ne prend pas en compte le coût du terrain ni les taxes administratives.
                        </Text>
                    </View>

                    {/* CTA */}
                    <TouchableOpacity
                        style={[styles.ctaButton, totalBudget === 0 && styles.ctaButtonDisabled]}
                        onPress={() => {
                            if (totalBudget > 0) {
                                navigation.navigate('ProspectForm', {
                                    interestedProject: `Simulation: ${surface}m² x ${selectedLevel?.label} (${selectedZone?.label})`,
                                    estimatedBudget: totalBudget
                                });
                            }
                        }}
                        disabled={totalBudget === 0}
                    >
                        <Text style={styles.ctaButtonText}>Recevoir ce devis par email</Text>
                        <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
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
        backgroundColor: '#F8F9FA',
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
    resultCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        alignItems: 'center',
        shadowColor: '#2B2E83',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    resultLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontFamily: 'FiraSans_400Regular',
        marginBottom: 8,
    },
    resultValue: {
        color: '#FFFFFF',
        fontSize: 28,
        fontFamily: 'FiraSans_700Bold',
        marginBottom: 16,
    },
    resultDivider: {
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginBottom: 16,
    },
    resultDetails: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    detailItem: {
        alignItems: 'center',
        flex: 1,
    },
    detailLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginBottom: 4,
    },
    detailValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'FiraSans_600SemiBold',
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        color: '#1F2937',
        fontFamily: 'FiraSans_600SemiBold',
        marginLeft: 10,
    },
    surfaceControl: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4FB',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    surfaceValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginHorizontal: 24,
        minWidth: 80,
        justifyContent: 'center',
    },
    surfaceInput: {
        fontSize: 32,
        color: '#2B2E83',
        fontFamily: 'FiraSans_700Bold',
        textAlign: 'center',
    },
    surfaceUnit: {
        fontSize: 18,
        color: '#6B7280',
        fontFamily: 'FiraSans_600SemiBold',
        marginLeft: 4,
    },
    levelsContainer: {
        gap: 12,
        paddingVertical: 5,
    },
    levelItem: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    levelItemSelected: {
        backgroundColor: '#2B2E83',
        borderColor: '#2B2E83',
    },
    levelLabel: {
        fontSize: 14,
        color: '#4B5563',
        fontFamily: 'FiraSans_600SemiBold',
    },
    levelLabelSelected: {
        color: '#FFFFFF',
    },
    finishItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        backgroundColor: '#F9FAFB',
        marginBottom: 12,
    },
    finishItemSelected: {
        borderColor: '#E96C2E',
        backgroundColor: '#FFF7ED',
        borderWidth: 2,
    },
    finishInfo: {
        flex: 1,
    },
    finishLabel: {
        fontSize: 16,
        color: '#374151',
        fontFamily: 'FiraSans_600SemiBold',
    },
    finishLabelSelected: {
        color: '#E96C2E',
    },
    finishDesc: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    finishPriceBox: {
        marginRight: 10,
    },
    finishPrice: {
        fontSize: 13,
        color: '#6B7280',
        fontFamily: 'FiraSans_600SemiBold',
    },
    finishPriceSelected: {
        color: '#4B5563',
    },
    adviceBox: {
        flexDirection: 'row',
        backgroundColor: '#EEF2FF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        alignItems: 'center',
    },
    adviceText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 13,
        color: '#4338CA',
        lineHeight: 18,
    },
    ctaButton: {
        backgroundColor: '#2B2E83',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    ctaButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'FiraSans_700Bold',
        marginRight: 8,
    },
    ctaButtonDisabled: {
        backgroundColor: '#9CA3AF',
        opacity: 0.7,
    },
});
