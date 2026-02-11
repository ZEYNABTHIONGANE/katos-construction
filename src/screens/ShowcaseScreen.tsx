
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,

    StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { LinearGradient } from 'expo-linear-gradient';
import { useClientAuth } from '../hooks/useClientAuth';
import { useShowcaseData } from '../hooks/useShowcaseData';
import { ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'Showcase'>;

const { width } = Dimensions.get('window');

// Fallback data if Firebase is empty
const DEFAULT_HERO = {
    title: 'AS SALAM SA KEUR',
    subtitle: 'Nouveau programme résidentiel',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6199f7d009?q=80&w=2070&auto=format&fit=crop',
    description: "Votre partenaire de confiance pour des projets immobiliers d'exception au Sénégal. Découvrez notre expertise et nos réalisations."
};

export default function ShowcaseScreen({ navigation }: Props) {
    const { isAuthenticated } = useClientAuth();
    const { content, villas, loading } = useShowcaseData();

    const handleBecomeOwner = (projectName?: string) => {
        navigation.navigate('ProspectForm', { interestedProject: projectName });
    };

    const handleLogin = () => {
        if (isAuthenticated) {
            navigation.goBack();
        } else {
            navigation.navigate('Login');
        }
    };

    const canGoBack = navigation.canGoBack();

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#2B2E83" />
            </View>
        );
    }

    const heroProject = content?.heroProject || DEFAULT_HERO;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        {canGoBack ? (
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                                <MaterialIcons name="arrow-back" size={24} color="#2B2E83" />
                            </TouchableOpacity>
                        ) : (
                            <Image source={require('../assets/logo.png')} style={styles.logo} />
                        )}
                    </View>
                    <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                        <Text style={styles.loginBtnText}>
                            {isAuthenticated ? 'Retour au Dashboard' : 'Espace Client'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Hero Section */}
                <View style={styles.heroContainer}>
                    <Image source={{ uri: heroProject.imageUrl }} style={styles.heroImage} />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.heroOverlay}
                    >
                        <View style={styles.heroContent}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>PROJET PHARE</Text>
                            </View>
                            <Text style={styles.heroTitle}>{heroProject.title}</Text>
                            <Text style={styles.heroSubtitle}>{heroProject.subtitle}</Text>
                            <TouchableOpacity
                                style={styles.heroAction}
                                onPress={() => handleBecomeOwner(heroProject.title)}
                            >
                                <Text style={styles.heroActionText}>En savoir plus</Text>
                                <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>

                {/* Introduction Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Katos Construction</Text>
                    <Text style={styles.sectionText}>
                        {content?.heroProject.description || heroProject.description}
                    </Text>
                </View>

                {/* Villa Catalog */}
                {villas.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Nos Modèles de Villas</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                            {villas.map((villa) => (
                                <TouchableOpacity
                                    key={villa.id}
                                    style={styles.villaCard}
                                    onPress={() => navigation.navigate('VillaDetail', { villaType: villa.name })}
                                >
                                    <Image source={{ uri: villa.images?.[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop' }} style={styles.villaImage} />
                                    <View style={styles.villaInfo}>
                                        <Text style={styles.villaModel} numberOfLines={1}>{villa.name}</Text>
                                        <Text style={styles.villaType}>{villa.type}</Text>
                                        {villa.price && (
                                            <Text style={styles.villaPrice}>
                                                À partir de {villa.price.toLocaleString()} {villa.currency || 'FCFA'}
                                            </Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Services / Promotions */}
                {(content?.promo.active !== false) && (
                    <View style={styles.promoSection}>
                        <LinearGradient
                            colors={['#2B2E83', '#1e2160']}
                            style={styles.promoCard}
                        >
                            <View style={styles.promoContent}>
                                <Text style={styles.promoTitle}>{content?.promo.title || 'Offre Spéciale'}</Text>
                                <Text style={styles.promoSubtitle}>
                                    {content?.promo.subtitle || '-10% sur les frais de dossier ce mois-ci'}
                                </Text>
                                <TouchableOpacity
                                    style={styles.promoAction}
                                    onPress={() => handleBecomeOwner()}
                                >
                                    <Text style={styles.promoActionText}>J'en profite</Text>
                                </TouchableOpacity>
                            </View>
                            <MaterialIcons name="local-offer" size={80} color="rgba(255,255,255,0.1)" style={styles.promoIcon} />
                        </LinearGradient>
                    </View>
                )}

                {/* Global CTA */}
                <View style={styles.footerCTA}>
                    <Text style={styles.footerText}>Prêt à lancer votre projet ?</Text>
                    <TouchableOpacity
                        style={[styles.mainCTA, { backgroundColor: '#E96C2E' }]}
                        onPress={() => handleBecomeOwner()}
                    >
                        <Text style={styles.mainCTAText}>Devenir Propriétaire</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        padding: 5,
        marginRight: 10,
    },
    logo: {
        width: 100,
        height: 40,
        resizeMode: 'contain',
    },
    loginBtn: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    loginBtnText: {
        color: '#2B2E83',
        fontFamily: 'FiraSans_600SemiBold',
        fontSize: 14,
    },
    heroContainer: {
        height: 450,
        width: width,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    heroOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
        justifyContent: 'flex-end',
        padding: 20,
    },
    heroContent: {
        marginBottom: 20,
    },
    badge: {
        backgroundColor: '#E96C2E',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        marginBottom: 10,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontFamily: 'FiraSans_700Bold',
    },
    heroTitle: {
        fontSize: 32,
        color: '#FFFFFF',
        fontFamily: 'FiraSans_700Bold',
        marginBottom: 5,
    },
    heroSubtitle: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.9)',
        fontFamily: 'FiraSans_400Regular',
        marginBottom: 20,
    },
    heroAction: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    heroActionText: {
        color: '#FFFFFF',
        fontFamily: 'FiraSans_600SemiBold',
        marginRight: 8,
    },
    section: {
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 22,
        color: '#2B2E83',
        fontFamily: 'FiraSans_700Bold',
    },
    seeAll: {
        color: '#E96C2E',
        fontFamily: 'FiraSans_600SemiBold',
    },
    sectionText: {
        fontSize: 16,
        color: '#6B7280',
        fontFamily: 'FiraSans_400Regular',
        lineHeight: 24,
    },
    horizontalScroll: {
        marginHorizontal: -20,
        paddingLeft: 20,
    },
    villaCard: {
        width: width * 0.7,
        marginRight: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 10,
        overflow: 'hidden',
    },
    villaImage: {
        width: '100%',
        height: 180,
    },
    villaInfo: {
        padding: 15,
    },
    villaModel: {
        fontSize: 18,
        color: '#2B2E83',
        fontFamily: 'FiraSans_700Bold',
        marginBottom: 4,
    },
    villaType: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'FiraSans_400Regular',
        marginBottom: 8,
    },
    villaPrice: {
        fontSize: 16,
        color: '#E96C2E',
        fontFamily: 'FiraSans_700Bold',
    },
    promoSection: {
        padding: 20,
    },
    promoCard: {
        borderRadius: 16,
        padding: 25,
        position: 'relative',
        overflow: 'hidden',
    },
    promoContent: {
        zIndex: 1,
    },
    promoTitle: {
        fontSize: 24,
        color: '#FFFFFF',
        fontFamily: 'FiraSans_700Bold',
        marginBottom: 8,
    },
    promoSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        fontFamily: 'FiraSans_400Regular',
        marginBottom: 20,
        maxWidth: '70%',
    },
    promoAction: {
        backgroundColor: '#E96C2E',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        alignSelf: 'flex-start',
    },
    promoActionText: {
        color: '#FFFFFF',
        fontFamily: 'FiraSans_600SemiBold',
    },
    promoIcon: {
        position: 'absolute',
        right: -10,
        bottom: -10,
    },
    footerCTA: {
        padding: 30,
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        marginTop: 20,
    },
    footerText: {
        fontSize: 18,
        color: '#4B5563',
        fontFamily: 'FiraSans_600SemiBold',
        marginBottom: 20,
    },
    mainCTA: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#E96C2E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    mainCTAText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'FiraSans_700Bold',
    },
});
