
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Linking,
    FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { LinearGradient } from 'expo-linear-gradient';
import { useClientAuth } from '../hooks/useClientAuth';
import { useShowcaseData } from '../hooks/useShowcaseData';
import { authService } from '../services/authService';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ActivityIndicator } from 'react-native';
import { optimizeCloudinaryUrl, getVideoThumbnailUrl, optimizeCloudinaryVideoUrl } from '../utils/cloudinaryUtils';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'Showcase'>;

const { width, height } = Dimensions.get('window');

// Fallback data if Firebase is empty
const DEFAULT_HERO = {
    title: 'AS SALAM SA KEUR',
    subtitle: 'Nouveau programme résidentiel',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6199f7d009?q=80&w=2070&auto=format&fit=crop',
    description: "Votre partenaire de confiance pour des projets immobiliers d'exception au Sénégal. Découvrez notre expertise et nos réalisations."
};
const DEFAULT_CAROUSEL_DATA = [
    {
        id: '1',
        title: "Des villas d'exception au Sénégal",
        tagline: "Construisons l'avenir ensemble",
        image: 'https://images.unsplash.com/photo-1600585154340-be6199f7d009?q=80&w=2070&auto=format&fit=crop',
    },
    {
        id: '2',
        title: "Simulation gratuite en 2 minutes",
        tagline: "Planifiez votre budget",
        image: 'https://images.unsplash.com/photo-1541888086414-b80c33fb3537?q=80&w=2070&auto=format&fit=crop',
    },
    {
        id: '3',
        title: "Un expert BTP à votre écoute",
        tagline: "Conseils techniques gratuits",
        image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2070&auto=format&fit=crop',
    }
];

export default function ShowcaseScreen({ navigation }: Props) {
    const { isAuthenticated: isClientAuthenticated } = useClientAuth();
    const [isFirebaseAuthenticated, setIsFirebaseAuthenticated] = React.useState(!!auth.currentUser);
    const { content, villas, loading: dataLoading } = useShowcaseData();
    const [activeIndex, setActiveIndex] = React.useState(0);
    const flatListRef = React.useRef<FlatList>(null);

    const carouselData = content?.carousel && content.carousel.length > 0 ? content.carousel : DEFAULT_CAROUSEL_DATA;

    React.useEffect(() => {
        const interval = setInterval(() => {
            let nextIndex = activeIndex + 1;
            if (nextIndex >= carouselData.length) {
                nextIndex = 0;
            }
            if (flatListRef.current) {
                flatListRef.current.scrollToIndex({ index: nextIndex, animated: true });
            }
            setActiveIndex(nextIndex);
        }, 5000);
        return () => clearInterval(interval);
    }, [activeIndex, carouselData.length]);

    const handleScroll = (event: any) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / width);
        setActiveIndex(index);
    };

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

    const handleWhatsAppContact = () => {
        const phone = '221770326990';
        const message = "Bonjour Katos, je souhaite obtenir des conseils pour mon projet de construction.";
        const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
        const webUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Linking.openURL(webUrl);
            }
        }).catch(() => Linking.openURL(webUrl));
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
            <StatusBar barStyle="light-content" />

            {/* Barre de bienvenue bleue */}
            <View style={styles.welcomeHeader}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
                        <View>
                            <Text style={styles.welcomeText}>Bienvenue chez</Text>
                            <Text style={styles.brandName}>Katos Construction</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.profileCircle}
                            onPress={handleLogin}
                        >
                            <MaterialIcons name="login" size={28} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>

            <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
                <ScrollView showsVerticalScrollIndicator={false} bounces={true}>

                    {/* Hero section : Carousel publicitaire */}
                    <View style={styles.carouselContainer}>
                        <FlatList
                            ref={flatListRef}
                            data={carouselData}
                            keyExtractor={(item) => item.id}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                            renderItem={({ item }) => (
                                <View style={styles.heroSimple}>
                                    {(item.type === 'video' || /\.(mp4|mov|avi|webm|mkv)(\?|$)/i.test(item.image || '')) ? (
                                        <Video
                                            source={{ uri: optimizeCloudinaryVideoUrl(item.image) }}
                                            style={styles.heroImageSimple}
                                            resizeMode={ResizeMode.COVER}
                                            shouldPlay
                                            isLooping
                                            isMuted
                                            usePoster
                                            posterSource={{ uri: getVideoThumbnailUrl(item.image, { width: 800 }) }}
                                            posterStyle={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                                        />
                                    ) : (
                                        <Image
                                            source={{ uri: optimizeCloudinaryUrl(item.image || DEFAULT_HERO.imageUrl, { width: 800 }) }}
                                            style={styles.heroImageSimple}
                                            contentFit="cover"
                                            transition={300}
                                        />
                                    )}
                                    <LinearGradient
                                        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
                                        style={styles.heroOverlaySimple}
                                    >
                                        <Text style={styles.heroTaglineSimple}>{item.tagline}</Text>
                                        <Text style={styles.heroTitleSimple}>{item.title}</Text>
                                    </LinearGradient>
                                </View>
                            )}
                        />
                        <View style={styles.pagination}>
                            {carouselData.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        activeIndex === index ? styles.activeDot : {}
                                    ]}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Grille de services (Pas de carrousel) */}
                    <View style={styles.toolsSection}>
                        <View style={styles.sectionHeaderFixed}>
                            <Text style={styles.sectionTitle}>Outils & Services</Text>
                        </View>

                        <View style={styles.toolsGrid}>
                            <ToolCard
                                icon="calculate"
                                title="Simulateur"
                                onPress={() => navigation.navigate('BudgetEstimator' as any)}
                                color="#2B2E83"
                            />
                            <ToolCard
                                icon="fact-check"
                                title="Guide Achat"
                                onPress={() => navigation.navigate('BuyerChecklist' as any)}
                                color="#E96C2E"
                            />
                            <ToolCard
                                icon="support-agent"
                                title="Expertise"
                                onPress={() => navigation.navigate('BTPAdvice' as any)}
                                color="#2B2E83"
                            />
                            <ToolCard
                                icon="assignment"
                                title="Mon Projet"
                                onPress={() => handleBecomeOwner()}
                                color="#E96C2E"
                            />
                        </View>
                    </View>

                    {/* Nos Solutions - Boutons larges colorés */}
                    <View style={styles.hubContainer}>
                        <Text style={styles.sectionTitle}>Nos Solutions</Text>
                        <View style={styles.hubButtonsRow}>
                            <TouchableOpacity
                                style={[styles.largeHubBtn, { backgroundColor: '#2B2E83' }]}
                                onPress={() => navigation.navigate('VillaList' as any)}
                            >
                                <MaterialIcons name="holiday-village" size={32} color="#FFFFFF" />
                                <Text style={styles.largeHubBtnText}>Villas & Biens</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.largeHubBtn, { backgroundColor: '#F9FAFB', borderWidth: 2, borderColor: '#2B2E83' }]}
                                onPress={() => navigation.navigate('TerrainList' as any)}
                            >
                                <MaterialIcons name="landscape" size={32} color="#2B2E83" />
                                <Text style={[styles.largeHubBtnText, { color: '#2B2E83' }]}>Terrains</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Catalogue Villa - Style épuré */}
                    {villas.length > 0 && (
                        <View style={styles.catalogSection}>
                            <View style={styles.catalogHeader}>
                                <Text style={styles.sectionTitle}>Réalisations</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('VillaList' as any)}>
                                    <Text style={styles.seeMore}>Tout voir</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                                {villas.map((villa) => (
                                    <TouchableOpacity
                                        key={villa.id}
                                        style={styles.villaCardMobile}
                                        onPress={() => navigation.navigate('VillaDetail', { villa })}
                                    >
                                        <Image
                                            source={{ uri: optimizeCloudinaryUrl(villa.images?.[0], { width: 600, quality: 'auto' }) }}
                                            style={styles.villaImageMobile}
                                        />
                                        <View style={styles.villaInfoMobile}>
                                            <Text style={styles.villaNameMobile}>{villa.name}</Text>
                                            <Text style={styles.villaPriceMobile}>
                                                {villa.price?.toLocaleString()} {villa.currency || 'FCFA'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Section Mission & Confidence */}
                    <View style={styles.missionSection}>
                        <View style={styles.missionCard}>
                            <MaterialIcons name="lightbulb" size={32} color="#E96C2E" style={{ marginBottom: 15 }} />
                            <Text style={styles.missionTitle}>Pourquoi utiliser Katos ?</Text>
                            <Text style={styles.missionDesc}>
                                Une application conçue pour accompagner tous ceux qui souhaitent se lancer dans la construction au Sénégal sans savoir par où passer, ou qui ont besoin de conseils d'experts en BTP.
                            </Text>
                        </View>

                        <View style={styles.trustGrid}>
                            <View style={styles.trustItem}>
                                <MaterialIcons name="security" size={24} color="#10B981" />
                                <Text style={styles.trustText}>Données 100% sécurisées</Text>
                            </View>
                            <View style={styles.trustItem}>
                                <MaterialIcons name="redeem" size={24} color="#2B2E83" />
                                <Text style={styles.trustText}>Outils 100% gratuits</Text>
                            </View>
                        </View>
                    </View>

                    {/* Contact WhatsApp */}
                    <View style={styles.whatsappSection}>
                        <Text style={styles.whatsappTitle}>Besoin d'aide ?</Text>
                        <Text style={styles.whatsappSubtitle}>Nos experts vous répondent directement</Text>
                        <TouchableOpacity
                            style={styles.whatsappBtn}
                            onPress={handleWhatsAppContact}
                            activeOpacity={0.8}
                        >
                            <FontAwesome name="whatsapp" size={28} color="#FFFFFF" />
                            <Text style={styles.whatsappBtnText}>Contactez-nous sur WhatsApp</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footerSimple}>
                        <Text style={styles.footerText}>Katos Construction © 2024</Text>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>

        </View>
    );
}

function ToolCard({ icon, title, onPress, color }: any) {
    return (
        <TouchableOpacity style={styles.toolCard} onPress={onPress}>
            <View style={[styles.toolIconContainer, { backgroundColor: color + '10' }]}>
                <MaterialIcons name={icon} size={28} color={color} />
            </View>
            <Text style={styles.toolTitle}>{title}</Text>
        </TouchableOpacity>
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
    // Welcome Header
    welcomeHeader: {
        backgroundColor: '#2B2E83',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    welcomeText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontFamily: 'FiraSans_400Regular',
    },
    brandName: {
        color: '#FFFFFF',
        fontSize: 22,
        fontFamily: 'FiraSans_700Bold',
    },
    profileCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Carousel Header
    carouselContainer: {
        marginBottom: 20,
    },
    heroSimple: {
        height: height * 0.3,
        width: width - 40,
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 25,
        overflow: 'hidden',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 5,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#D1D5DB',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: '#E96C2E',
        width: 24,
    },
    heroImageSimple: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    heroOverlaySimple: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        justifyContent: 'flex-end',
    },
    heroTaglineSimple: {
        color: '#E96C2E',
        fontSize: 12,
        fontFamily: 'FiraSans_700Bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    heroTitleSimple: {
        color: '#FFFFFF',
        fontSize: 24,
        fontFamily: 'FiraSans_700Bold',
        marginTop: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    // Tools Grid
    toolsSection: {
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 22,
        fontFamily: 'FiraSans_700Bold',
        color: '#111827',
        marginBottom: 20,
    },
    sectionHeaderFixed: {
        marginBottom: 15,
    },
    toolsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    toolCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    toolIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    toolTitle: {
        fontSize: 14,
        fontFamily: 'FiraSans_700Bold',
        color: '#111827',
    },
    // Hub
    hubContainer: {
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    hubButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    largeHubBtn: {
        width: '48%',
        padding: 25,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    largeHubBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontFamily: 'FiraSans_700Bold',
        marginTop: 10,
    },
    // Catalog
    catalogSection: {
        marginBottom: 30,
    },
    catalogHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    seeMore: {
        color: '#E96C2E',
        fontFamily: 'FiraSans_700Bold',
        fontSize: 14,
    },
    horizontalScroll: {
        paddingLeft: 20,
        paddingRight: 10,
    },
    villaCardMobile: {
        width: 250,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginRight: 15,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
        marginBottom: 10,
        marginLeft: 2,
    },
    villaImageMobile: {
        width: '100%',
        height: 150,
        resizeMode: 'cover',
    },
    villaInfoMobile: {
        padding: 15,
    },
    villaNameMobile: {
        fontSize: 16,
        fontFamily: 'FiraSans_700Bold',
        color: '#111827',
    },
    villaPriceMobile: {
        fontSize: 15,
        color: '#E96C2E',
        fontFamily: 'FiraSans_700Bold',
        marginTop: 4,
    },
    // Mission & Confidence
    missionSection: {
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    missionCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 25,
        padding: 25,
        marginBottom: 20,
        borderLeftWidth: 5,
        borderLeftColor: '#E96C2E',
    },
    missionTitle: {
        fontSize: 18,
        fontFamily: 'FiraSans_700Bold',
        color: '#111827',
        marginBottom: 8,
    },
    missionDesc: {
        fontSize: 14,
        fontFamily: 'FiraSans_400Regular',
        color: '#4B5563',
        lineHeight: 22,
    },
    trustGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    trustItem: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        gap: 8,
    },
    trustText: {
        fontSize: 12,
        fontFamily: 'FiraSans_600SemiBold',
        color: '#111827',
        flex: 1,
    },
    // WhatsApp Section
    whatsappSection: {
        marginHorizontal: 20,
        padding: 30,
        backgroundColor: '#2B2E83',
        borderRadius: 25,
        alignItems: 'center',
        marginBottom: 30,
        shadowColor: '#2B2E83',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    whatsappTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontFamily: 'FiraSans_700Bold',
        marginBottom: 8,
    },
    whatsappSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontFamily: 'FiraSans_400Regular',
        marginBottom: 25,
        textAlign: 'center',
    },
    whatsappBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#25D366',
        paddingHorizontal: 25,
        paddingVertical: 15,
        borderRadius: 20,
        gap: 12,
    },
    whatsappBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'FiraSans_700Bold',
    },
    // Footer
    footerSimple: {
        padding: 40,
        alignItems: 'center',
    },
    footerText: {
        color: '#9CA3AF',
        fontSize: 12,
        fontFamily: 'FiraSans_400Regular',
    },
});
