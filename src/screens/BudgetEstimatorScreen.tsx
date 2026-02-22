
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

const FINISH_LEVELS = [
    { id: 'social', label: 'Social', pricePerM2: 245000, description: 'Essentiel & Durable' },
    { id: 'medium', label: 'Standing', pricePerM2: 385000, description: 'Confort & Design' },
    { id: 'high', label: 'Grand Standing', pricePerM2: 550000, description: 'Luxe & Prestige' },
];

export default function BudgetEstimatorScreen({ navigation }: Props) {
    const [surface, setSurface] = useState<number>(100);
    const [finishLevel, setFinishLevel] = useState(FINISH_LEVELS[1]);
    const [totalBudget, setTotalBudget] = useState(0);

    useEffect(() => {
        setTotalBudget(surface * finishLevel.pricePerM2);
    }, [surface, finishLevel]);

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

                    {/* Controls Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="straighten" size={20} color="#2B2E83" />
                            <Text style={styles.sectionTitle}>Surface de construction (m²)</Text>
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

                            <TouchableOpacity onPress={() => incrementSurface(10)} style={styles.stepButton}>
                                <MaterialIcons name="add" size={24} color="#2B2E83" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Finishing Level Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="layers" size={20} color="#2B2E83" />
                            <Text style={styles.sectionTitle}>Niveau de Finition</Text>
                        </View>

                        {FINISH_LEVELS.map((level) => (
                            <TouchableOpacity
                                key={level.id}
                                style={[
                                    styles.finishItem,
                                    finishLevel.id === level.id && styles.finishItemSelected
                                ]}
                                onPress={() => setFinishLevel(level)}
                            >
                                <View style={styles.finishInfo}>
                                    <Text style={[
                                        styles.finishLabel,
                                        finishLevel.id === level.id && styles.finishLabelSelected
                                    ]}>{level.label}</Text>
                                    <Text style={styles.finishDesc}>{level.description}</Text>
                                </View>
                                <View style={styles.finishPriceBox}>
                                    <Text style={[
                                        styles.finishPrice,
                                        finishLevel.id === level.id && styles.finishPriceSelected
                                    ]}>~{level.pricePerM2.toLocaleString()} / m²</Text>
                                </View>
                                {finishLevel.id === level.id && (
                                    <MaterialIcons name="check-circle" size={24} color="#E96C2E" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Advice Box */}
                    <View style={styles.adviceBox}>
                        <MaterialIcons name="info" size={24} color="#2B2E83" />
                        <Text style={styles.adviceText}>
                            Cette estimation inclut les matériaux et la main d'œuvre. Elle ne prend pas en compte le coût du terrain ni les taxes administratives.
                        </Text>
                    </View>

                    {/* CTA */}
                    <TouchableOpacity
                        style={styles.ctaButton}
                        onPress={() => navigation.navigate('ProspectForm', {
                            interestedProject: `Simulation: ${surface}m² ${finishLevel.label}`,
                            estimatedBudget: totalBudget
                        })}
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
});
