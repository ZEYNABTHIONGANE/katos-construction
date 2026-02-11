
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import AppHeader from '../components/AppHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'VillaDetail'>;

const { width } = Dimensions.get('window');

export default function VillaDetailScreen({ navigation, route }: Props) {
    const { villaType } = route.params;

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader
                title={villaType}
                showBack={true}
                showNotification={false}
                onBackPress={() => navigation.goBack()}
            />
            <ScrollView>
                <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop' }}
                    style={styles.mainImage}
                />

                <View style={styles.content}>
                    <Text style={styles.title}>{villaType}</Text>
                    <View style={styles.tagRow}>
                        <View style={styles.tag}>
                            <MaterialIcons name="square-foot" size={16} color="#6B7280" />
                            <Text style={styles.tagText}>150m²</Text>
                        </View>
                        <View style={styles.tag}>
                            <MaterialIcons name="bed" size={16} color="#6B7280" />
                            <Text style={styles.tagText}>4 Chambres</Text>
                        </View>
                        <View style={styles.tag}>
                            <MaterialIcons name="bathtub" size={16} color="#6B7280" />
                            <Text style={styles.tagText}>3 SDB</Text>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.description}>
                        La {villaType} offre un cadre de vie exceptionnel avec des finitions de haute qualité.
                        Conçue pour maximiser l'espace et la lumière naturelle, elle est idéale pour une famille moderne.
                    </Text>

                    <Text style={styles.sectionTitle}>Points Forts</Text>
                    <View style={styles.featureItem}>
                        <MaterialIcons name="done" size={20} color="#E96C2E" />
                        <Text style={styles.featureText}>Matériaux haut de gamme</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <MaterialIcons name="done" size={20} color="#E96C2E" />
                        <Text style={styles.featureText}>Sécurité 24/7</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <MaterialIcons name="done" size={20} color="#E96C2E" />
                        <Text style={styles.featureText}>Espaces verts aménagés</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.ctaBtn}
                        onPress={() => navigation.navigate('ProspectForm', { interestedProject: villaType })}
                    >
                        <Text style={styles.ctaBtnText}>Je suis intéressé</Text>
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
    mainImage: {
        width: width,
        height: 250,
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 28,
        color: '#2B2E83',
        fontFamily: 'FiraSans_700Bold',
        marginBottom: 10,
    },
    tagRow: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 15,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 5,
    },
    tagText: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'FiraSans_500Medium',
    },
    sectionTitle: {
        fontSize: 20,
        color: '#2B2E83',
        fontFamily: 'FiraSans_700Bold',
        marginTop: 20,
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        color: '#4B5563',
        fontFamily: 'FiraSans_400Regular',
        lineHeight: 24,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 10,
    },
    featureText: {
        fontSize: 16,
        color: '#4B5563',
        fontFamily: 'FiraSans_400Regular',
    },
    ctaBtn: {
        backgroundColor: '#E96C2E',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 20,
    },
    ctaBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'FiraSans_700Bold',
    },
});
