
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { projectService } from '../services/projectService';
import { FirebaseProject } from '../types/firebase';

type Props = NativeStackScreenProps<RootStackParamList, 'VillaList'>;

export default function VillaListScreen({ navigation }: Props) {
    const [villas, setVillas] = useState<FirebaseProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = projectService.subscribeToProjects((data) => {
            setVillas(data);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const types = ['F3', 'F4', 'F6'];

    const filteredVillas = villas.filter(v => {
        const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = !selectedType || v.type === selectedType;
        return matchesSearch && matchesType;
    });

    const renderVilla = ({ item }: { item: FirebaseProject }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('VillaDetail', { villa: item })}
        >
            <View style={styles.imageWrapper}>
                <Image
                    source={{ uri: require('../utils/cloudinaryUtils').optimizeCloudinaryUrl(item.images?.[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop', { width: 600, quality: 'auto' }) }}
                    style={styles.image}
                />
                <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{item.type}</Text>
                </View>
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.name}>{item.name}</Text>

                <View style={styles.specsRow}>
                    <View style={styles.specItem}>
                        <MaterialIcons name="square-foot" size={16} color="#6B7280" />
                        <Text style={styles.specText}>{item.surface || 'N/A'} m²</Text>
                    </View>
                    <View style={styles.specItem}>
                        <MaterialIcons name="king-bed" size={16} color="#6B7280" />
                        <Text style={styles.specText}>{item.bedrooms || '0'} p.</Text>
                    </View>
                </View>

                <View style={styles.footerRow}>
                    <Text style={styles.price}>
                        {item.price?.toLocaleString()} {item.currency || 'FCFA'}
                    </Text>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('ProspectForm', { interestedProject: item.name })}
                    >
                        <Text style={styles.actionBtnText}>Étude</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#2B2E83" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.title}>Modèles de Villas</Text>
                <View style={{ width: 40 }} />
            </View>
            <View style={styles.contentContainer}>
                <View style={styles.searchSection}>
                    <View style={styles.searchContainer}>
                        <MaterialIcons name="search" size={20} color="#9CA3AF" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Rechercher un modèle..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    <View style={styles.filterRow}>
                        <TouchableOpacity
                            style={[styles.filterChip, !selectedType && styles.filterChipActive]}
                            onPress={() => setSelectedType(null)}
                        >
                            <Text style={[styles.filterChipText, !selectedType && styles.filterChipTextActive]}>Tous</Text>
                        </TouchableOpacity>
                        {types.map(type => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.filterChip, selectedType === type && styles.filterChipActive]}
                                onPress={() => setSelectedType(type)}
                            >
                                <Text style={[styles.filterChipText, selectedType === type && styles.filterChipTextActive]}>{type}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#2B2E83" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredVillas}
                        renderItem={renderVilla}
                        keyExtractor={(item) => item.id!}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <MaterialIcons name="home-work" size={64} color="#D1D5DB" />
                                <Text style={styles.emptyText}>Aucun modèle ne correspond à votre recherche.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    contentContainer: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 70,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#2B2E83',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,

    },
    backBtn: {
        padding: 8,
    },
    title: {
        fontSize: 20,
        fontFamily: 'FiraSans_700Bold',
        color: '#FFFFFF',
    },
    searchSection: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        marginTop: 15,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        borderRadius: 12,
        height: 44,
        marginBottom: 15,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        fontFamily: 'FiraSans_400Regular',
        color: '#1F2937',
    },
    filterRow: {
        flexDirection: 'row',
        gap: 10,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
    },
    filterChipActive: {
        backgroundColor: '#2B2E83',
    },
    filterChipText: {
        fontSize: 14,
        fontFamily: 'FiraSans_600SemiBold',
        color: '#6B7280',
    },
    filterChipTextActive: {
        color: '#FFFFFF',
    },
    list: {
        padding: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    imageWrapper: {
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    typeBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(43, 46, 131, 0.9)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    typeBadgeText: {
        fontSize: 12,
        fontFamily: 'FiraSans_700Bold',
        color: '#FFFFFF',
    },
    cardContent: {
        padding: 16,
    },
    name: {
        fontSize: 18,
        fontFamily: 'FiraSans_700Bold',
        color: '#1F2937',
        marginBottom: 10,
    },
    specsRow: {
        flexDirection: 'row',
        marginBottom: 15,
        gap: 20,
    },
    specItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    specText: {
        fontSize: 14,
        fontFamily: 'FiraSans_400Regular',
        color: '#6B7280',
        marginLeft: 6,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    price: {
        fontSize: 18,
        fontFamily: 'FiraSans_700Bold',
        color: '#E96C2E',
    },
    actionBtn: {
        backgroundColor: '#FDEEE7',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    actionBtnText: {
        fontSize: 14,
        fontFamily: 'FiraSans_700Bold',
        color: '#E96C2E',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    empty: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 15,
        fontFamily: 'FiraSans_400Regular',
        color: '#6B7280',
        marginTop: 15,
        textAlign: 'center',
    },
});
