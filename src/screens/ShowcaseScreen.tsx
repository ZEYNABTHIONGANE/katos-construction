
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
import { authService } from '../services/authService';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { optimizeCloudinaryUrl } from '../utils/cloudinaryUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'Showcase'>;

const { width, height } = Dimensions.get('window');

// Fallback data if Firebase is empty
const DEFAULT_HERO = {
    title: 'AS SALAM SA KEUR',
    subtitle: 'Nouveau programme résidentiel',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6199f7d009?q=80&w=2070&auto=format&fit=crop',
    description: "Votre partenaire de confiance pour des projets immobiliers d'exception au Sénégal. Découvrez notre expertise et nos réalisations."
};

export default function ShowcaseScreen({ navigation }: Props) {
    const { isAuthenticated: isClientAuthenticated } = useClientAuth();
    const [isFirebaseAuthenticated, setIsFirebaseAuthenticated] = React.useState(!!auth.currentUser);
    const { content, villas, loading: dataLoading } = useShowcaseData();

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsFirebaseAuthenticated(!!user);
        });
        return unsubscribe;
    }, []);

    const isAuthenticated = isClientAuthenticated || isFirebaseAuthenticated;

    const handleBecomeOwner = (projectName?: string) => {
        navigation.navigate('ProspectForm', { interestedProject: projectName });
    };

    const handleLogin = async () => {
        if (isAuthenticated) {
            if (isClientAuthenticated) {
                navigation.navigate('ClientTabs' as any);
            } else {
                navigation.navigate('ChefTabs' as any);
            }
        } else {
            navigation.navigate('Login');
        }
    };

    if (dataLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#2B2E83" />
            </View>
        );
    }

    const heroProject = content?.heroProject || DEFAULT_HERO;

    return (
        <View style={styles.container} >
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
                <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                    {/* Hero section with image background */}
                    <View style={styles.heroWrapper}>
                        <Image
                            source={{ uri: optimizeCloudinaryUrl(heroProject.imageUrl, { width: 1000, quality: 'auto' }) }}
                            style={styles.heroBg}
                        />
                        <LinearGradient
                            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.85)'] as const}
                            style={styles.heroOverlay}
                        >
                            <TouchableOpacity
                                style={styles.loginHeaderBtn}
                                onPress={handleLogin}
                            >
                                <MaterialIcons name="account-circle" size={26} color="#FFFFFF" />
                                <Text style={styles.loginHeaderBtnText}>
                                    {isAuthenticated ? 'Mon Espace' : 'Connexion'}
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.heroContent}>
                                {/* <View style={styles.logoContainer}>
                                    <Image source={require('../assets/logo.png')} style={styles.heroLogo} />
                                </View> */}

                                <Text style={styles.heroTagline}>Votre partenaire de confiance au Sénégal</Text>
                                <Text style={styles.heroMainTitle}>Concevez et réalisez la villa de vos rêves</Text>

                                <TouchableOpacity
                                    style={styles.heroCTA}
                                    onPress={() => handleBecomeOwner()}
                                >
                                    <Text style={styles.heroCTAText}>Démarrer mon projet</Text>
                                    <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Quick Services Section - PROMINENT FOR APPLE */}
                    <View style={styles.servicesSection}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.hubTitle}>Outils & Services Publics</Text>
                            <View style={styles.publicBadge}>
                                <Text style={styles.publicBadgeText}>ACCÈS LIBRE</Text>
                            </View>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicesScroll}>
                            <ServiceCard
                                icon="calculate"
                                title="Simulateur"
                                desc="Estimez votre budget de construction"
                                onPress={() => navigation.navigate('BudgetEstimator' as any)}
                                color="#2B2E83"
                                badge="Outil"
                            />
                            <ServiceCard
                                icon="fact-check"
                                title="Guide d'Achat"
                                desc="Checklist sécurisée pour votre terrain"
                                onPress={() => navigation.navigate('BuyerChecklist' as any)}
                                color="#10B981"
                                badge="Guide"
                            />
                            <ServiceCard
                                icon="support-agent"
                                title="Katos Conseil"
                                desc="Expertise & Assistance BTP interactive"
                                onPress={() => navigation.navigate('BTPAdvice' as any)}
                                color="#6366F1"
                                badge="Expert"
                            />
                        </ScrollView>
                    </View>

                    {/* Main Hub - Category 1: Projects */}
                    <View style={styles.hubContainer}>
                        <Text style={styles.hubTitle}>Nos Solutions Clé en Main</Text>

                        <View style={styles.hubGrid}>
                            <HubButton
                                icon="holiday-village"
                                title="Biens Immobiliers"
                                subtitle="Nos villas d'exception"
                                onPress={() => {
                                    navigation.navigate('VillaList' as any);
                                }}
                                color="#2B2E83"
                            />
                            <HubButton
                                icon="architecture"
                                title="Projet personnalisé"
                                subtitle="Selon votre propre plan"
                                onPress={() => handleBecomeOwner('Personnalisé')}
                                color="#E96C2E"
                            />
                            <HubButton
                                icon="support-agent"
                                title="Katos Conseil"
                                subtitle="Expertise & Assistance BTP"
                                onPress={() => navigation.navigate('BTPAdvice' as any)}
                                color="#6366F1"
                            />
                            <HubButton
                                icon="landscape"
                                title="Terrains"
                                subtitle="Nos parcelles disponibles"
                                onPress={() => navigation.navigate('TerrainList' as any)}
                                color="#F59E0B"
                            />
                        </View>
                    </View>

                    {/* Terrains Section - Professional Teaser */}
                    <TouchableOpacity
                        style={styles.terrainBanner}
                        onPress={() => navigation.navigate('TerrainList' as any)}
                    >
                        <LinearGradient
                            colors={['#1F2937', '#111827']}
                            style={styles.terrainGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.terrainInfo}>
                                <Text style={styles.terrainBadge}>NOUVEAU</Text>
                                <Text style={styles.terrainTitle}>Achat de terrains</Text>
                                <Text style={styles.terrainSubtitle}>Trouvez le futur emplacement de votre bien immobilier.</Text>
                            </View>
                            <View style={styles.terrainIconContainer}>
                                <MaterialIcons name="landscape" size={60} color="rgba(255,255,255,0.15)" />
                                <View style={styles.terrainArrow}>
                                    <MaterialIcons name="chevron-right" size={30} color="#FFFFFF" />
                                </View>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Villa Catalog (Redesigned) */}
                    {villas.length > 0 && (
                        <View style={styles.catalogSection}>
                            <View style={styles.catalogHeader}>
                                <View>
                                    <Text style={styles.catalogTitle}>Nos Biens Immobiliers</Text>
                                    <Text style={styles.catalogSubtitle}>Sélection de villas et opportunités</Text>
                                </View>
                                <TouchableOpacity onPress={() => navigation.navigate('VillaList' as any)}>
                                    <Text style={styles.seeMore}>Tout voir</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                                {villas.map((villa) => (
                                    <TouchableOpacity
                                        key={villa.id}
                                        style={styles.villaCardPremium}
                                        onPress={() => navigation.navigate('VillaDetail', { villa })}
                                    >
                                        <View style={styles.villaImageContainer}>
                                            <Image
                                                source={{ uri: optimizeCloudinaryUrl(villa.images?.[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop', { width: 600, quality: 'auto' }) }}
                                                style={styles.villaImagePremium}
                                            />
                                            <View style={styles.villaBadge}>
                                                <Text style={styles.villaBadgeText}>{villa.type}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.villaDetails}>
                                            <Text style={styles.villaName}>{villa.name}</Text>
                                            <View style={styles.villaSpecs}>
                                                <View style={styles.specItem}>
                                                    <MaterialIcons name="square-foot" size={14} color="#6B7280" />
                                                    <Text style={styles.specText}>{villa.surface || 'N/A'} m²</Text>
                                                </View>
                                                <View style={styles.specItem}>
                                                    <MaterialIcons name="king-bed" size={14} color="#6B7280" />
                                                    <Text style={styles.specText}>{villa.bedrooms || '0'} p.</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.villaPricePremium}>
                                                {villa.price?.toLocaleString()} {villa.currency || 'FCFA'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* How it Works - B2C Trust Builder */}
                    <View style={styles.stepsSection}>
                        <Text style={styles.stepsTitle}>Votre projet en 4 étapes</Text>
                        <View style={styles.stepsContainer}>
                            <StepItem number="01" title="Conseil" desc="Étude technique et devis gratuit" icon="chat" />
                            <StepItem number="02" title="Terrain" desc="Achat ou vérification de titre" icon="map" />
                            <StepItem number="03" title="Contrat" desc="Signature et début des travaux" icon="assignment" />
                            <StepItem number="04" title="Remise" desc="Livraison clés en main" icon="vpn-key" />
                        </View>
                    </View>

                    {/* Brand Experience Section */}
                    <View style={styles.brandSection}>
                        <Text style={styles.brandTitle}>L'engagement Katos</Text>
                        <View style={styles.featureRow}>
                            <FeatureItem icon="shield" title="Garantie Décennale" desc="Votre investissement est protégé pour 10 ans." />
                            <FeatureItem icon="update" title="Zéro Retard" desc="Planning respecté ou compensation prévue." />
                        </View>
                        <View style={styles.featureRow}>
                            <FeatureItem icon="auto-graph" title="Plus-value" desc="Une villa conçue pour prendre de la valeur." />
                            <FeatureItem icon="support-agent" title="Accompagnement" desc="Un conseiller dédié de A à Z." />
                        </View>
                    </View>

                    <View style={styles.footerInfo}>
                        <Text style={styles.footerDisclaimer}>
                            * Les prix indiqués concernent uniquement la construction. Le terrain doit être possédé par le client ou acquis séparément pour votre bien immobilier.
                        </Text>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>

        </View>
    );
}

function HubButton({ icon, title, subtitle, onPress, color }: any) {
    return (
        <TouchableOpacity style={styles.hubBtn} onPress={onPress}>
            <View style={[styles.hubIconBg, { backgroundColor: color + '15' }]}>
                <MaterialIcons name={icon} size={28} color={color} />
            </View>
            <Text style={styles.hubBtnTitle}>{title}</Text>
            <Text style={styles.hubBtnSubtitle}>{subtitle}</Text>
        </TouchableOpacity>
    );
}

function ServiceCard({ icon, title, desc, onPress, color, badge }: any) {
    return (
        <TouchableOpacity
            style={[styles.serviceCard, { borderBottomColor: color }]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={styles.serviceBadgeCorner}>
                <View style={[styles.serviceBadge, { backgroundColor: color }]}>
                    <Text style={styles.serviceBadgeText}>{badge}</Text>
                </View>
            </View>

            <View style={[styles.serviceIconContainer, { backgroundColor: color + '15' }]}>
                <MaterialIcons name={icon} size={28} color={color} />
            </View>

            <Text style={styles.serviceTitle}>{title}</Text>
            <Text style={styles.serviceDesc}>{desc}</Text>

            <View style={styles.serviceFooter}>
                <Text style={[styles.serviceLink, { color: color }]}>Découvrir</Text>
                <MaterialIcons name="chevron-right" size={18} color={color} />
            </View>
        </TouchableOpacity>
    );
}

function FeatureItem({ icon, title, desc }: any) {
    return (
        <View style={styles.featureItem}>
            <View style={styles.featureIconBg}>
                <MaterialIcons name={icon} size={22} color="#E96C2E" />
            </View>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureDesc}>{desc}</Text>
        </View>
    );
}

function StepItem({ number, title, desc, icon }: any) {
    return (
        <View style={styles.stepItem}>
            <View style={styles.stepHeader}>
                <View style={styles.stepNumberCircle}>
                    <Text style={styles.stepNumberText}>{number}</Text>
                </View>
                <MaterialIcons name={icon} size={20} color="#2B2E83" />
            </View>
            <Text style={styles.stepItemTitle}>{title}</Text>
            <Text style={styles.stepItemDesc}>{desc}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Hero Styles
    heroWrapper: {
        height: height * 0.6,
        width: width,
        position: 'relative',
    },
    heroBg: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    heroOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'flex-end',
        padding: 24,
    },
    heroContent: {
        marginBottom: 20,
    },
    loginHeaderBtn: {
        position: 'absolute',
        top: 60,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(43, 46, 131, 0.85)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10,
    },
    loginHeaderBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'FiraSans_700Bold',
        marginLeft: 8,
    },
    logoContainer: {
        marginBottom: 20,
        width: 200,
        height: 80,
    },
    heroLogo: {
        width: 120,
        height: 80,
        resizeMode: 'contain',
        left: -20,

    },
    heroTagline: {
        color: '#E96C2E',
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    heroMainTitle: {
        fontSize: 38,
        color: '#FFFFFF',
        fontFamily: 'Outfit_700Bold',
        marginBottom: 24,
        lineHeight: 46,
    },
    heroCTA: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E96C2E',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 30,
        alignSelf: 'flex-start',
        shadowColor: '#E96C2E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    heroCTAText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'FiraSans_700Bold',
        marginRight: 8,
    },
    heroActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    heroSecondaryCTA: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 30,
        marginLeft: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    heroSecondaryCTAText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'FiraSans_600SemiBold',
        marginLeft: 8,
    },
    // Services Styles
    servicesSection: {
        paddingVertical: 24,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        marginTop: -30,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    publicBadge: {
        backgroundColor: '#F0F1FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    publicBadgeText: {
        color: '#6366F1',
        fontSize: 10,
        fontFamily: 'FiraSans_700Bold',
    },
    servicesScroll: {
        paddingRight: 20,
        paddingBottom: 10,
    },
    serviceCard: {
        width: 200,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderBottomWidth: 4,
        alignItems: 'center', // Added to center everything
    },
    serviceBadgeCorner: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    serviceHeader: {
        marginBottom: 16,
        alignItems: 'center',
    },
    serviceIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    serviceBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    serviceBadgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontFamily: 'FiraSans_700Bold',
    },
    serviceTitle: {
        fontSize: 18,
        color: '#1F2937',
        fontFamily: 'FiraSans_700Bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    serviceDesc: {
        fontSize: 13,
        color: '#6B7280',
        fontFamily: 'FiraSans_400Regular',
        lineHeight: 18,
        height: 54,
        textAlign: 'center',
    },
    serviceFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        justifyContent: 'center',
    },
    serviceLink: {
        fontSize: 14,
        fontFamily: 'FiraSans_700Bold',
        marginRight: 4,
    },
    // Hub Styles
    hubContainer: {
        padding: 24,
        backgroundColor: '#F9FAFB',
    },
    hubTitle: {
        fontSize: 20,
        color: '#1F2937',
        fontFamily: 'FiraSans_700Bold',
        marginBottom: 20,
    },
    hubGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    hubBtn: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        alignItems: 'center', // Added to center title/subtitle too as it looks more premium centered
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    hubIconBg: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center', // Added to ensure visual centering
        marginBottom: 12,
    },
    hubBtnTitle: {
        fontSize: 15,
        color: '#1F2937',
        fontFamily: 'FiraSans_700Bold',
        marginBottom: 4,
    },
    hubBtnSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        fontFamily: 'FiraSans_400Regular',
    },
    // Terrain Banner
    terrainBanner: {
        marginHorizontal: 24,
        marginBottom: 32,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    terrainGradient: {
        flexDirection: 'row',
        padding: 24,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    terrainInfo: {
        flex: 1,
    },
    terrainBadge: {
        backgroundColor: '#E96C2E',
        color: '#FFFFFF',
        fontSize: 10,
        fontFamily: 'FiraSans_700Bold',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    terrainTitle: {
        fontSize: 22,
        color: '#FFFFFF',
        fontFamily: 'FiraSans_700Bold',
        marginBottom: 4,
    },
    terrainSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        fontFamily: 'FiraSans_400Regular',
    },
    terrainIconContainer: {
        width: 80,
        alignItems: 'flex-end',
        position: 'relative',
    },
    terrainArrow: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        padding: 4,
    },
    // Catalog Styles
    catalogSection: {
        marginBottom: 32,
    },
    catalogHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    catalogTitle: {
        fontSize: 22,
        color: '#1F2937',
        fontFamily: 'FiraSans_700Bold',
    },
    catalogSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'FiraSans_400Regular',
        marginTop: 2,
    },
    seeMore: {
        fontSize: 14,
        color: '#E96C2E',
        fontFamily: 'FiraSans_600SemiBold',
    },
    horizontalScroll: {
        paddingLeft: 24,
        paddingRight: 8,
    },
    villaCardPremium: {
        width: width * 0.75,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        marginRight: 16,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    villaImageContainer: {
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
    },
    villaImagePremium: {
        width: '100%',
        height: 180,
        resizeMode: 'cover',
    },
    villaBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    villaBadgeText: {
        fontSize: 10,
        fontFamily: 'FiraSans_700Bold',
        color: '#2B2E83',
    },
    villaDetails: {
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    villaName: {
        fontSize: 18,
        color: '#1F2937',
        fontFamily: 'FiraSans_700Bold',
        marginBottom: 6,
    },
    villaSpecs: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    specItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    specText: {
        fontSize: 13,
        color: '#6B7280',
        fontFamily: 'FiraSans_400Regular',
        marginLeft: 4,
    },
    villaPricePremium: {
        fontSize: 18,
        color: '#E96C2E',
        fontFamily: 'FiraSans_700Bold',
    },
    // Brand Styles
    brandSection: {
        padding: 24,
        backgroundColor: '#FFFFFF',
        marginHorizontal: 0,
    },
    brandTitle: {
        fontSize: 20,
        color: '#1F2937',
        fontFamily: 'FiraSans_700Bold',
        marginBottom: 24,
        textAlign: 'center',
    },
    featureRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    featureItem: {
        width: '46%',
        alignItems: 'center',
        textAlign: 'center',
    },
    featureIconBg: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FDEEE7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureTitle: {
        fontSize: 15,
        color: '#1F2937',
        fontFamily: 'FiraSans_700Bold',
        marginBottom: 6,
        textAlign: 'center',
    },
    featureDesc: {
        fontSize: 12,
        color: '#6B7280',
        fontFamily: 'FiraSans_400Regular',
        lineHeight: 16,
        textAlign: 'center',
    },
    // Steps Styles
    stepsSection: {
        padding: 24,
        backgroundColor: '#F3F4F6',
    },
    stepsTitle: {
        fontSize: 20,
        color: '#1F2937',
        fontFamily: 'FiraSans_700Bold',
        marginBottom: 24,
    },
    stepsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    stepItem: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    stepHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    stepNumberCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#2B2E83',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontFamily: 'FiraSans_700Bold',
    },
    stepItemTitle: {
        fontSize: 15,
        color: '#1F2937',
        fontFamily: 'FiraSans_700Bold',
        marginBottom: 4,
    },
    stepItemDesc: {
        fontSize: 12,
        color: '#6B7280',
        fontFamily: 'FiraSans_400Regular',
        lineHeight: 16,
    },
    // Footer Styles
    footerInfo: {
        padding: 24,
    },
    footerDisclaimer: {
        fontSize: 12,
        color: '#9CA3AF',
        fontFamily: 'FiraSans_400Regular',
        fontStyle: 'italic',
        lineHeight: 18,
    },
});
