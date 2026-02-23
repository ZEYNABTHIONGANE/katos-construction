
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
import { terrainService } from '../services/terrainService';
import { FirebaseTerrain } from '../types/firebase';
import { LinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<RootStackParamList, 'TerrainList'>;

export default function TerrainListScreen({ navigation }: Props) {
    const [terrains, setTerrains] = useState<FirebaseTerrain[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchZone, setSearchZone] = useState('');

    useEffect(() => {
        const unsubscribe = terrainService.subscribeToTerrains((data) => {
            setTerrains(data);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const filteredTerrains = searchZone
        ? terrains.filter(t => t.zone.toLowerCase().includes(searchZone.toLowerCase()))
        : terrains;

    const renderTerrain = ({ item }: { item: FirebaseTerrain }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('TerrainDetail', { terrain: item })}
        >
            <Image
                source={{ uri: require('../utils/cloudinaryUtils').optimizeCloudinaryUrl(item.images?.[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2232&auto=format&fit=crop', { width: 600, quality: 'auto' }) }}
                style={styles.image}
            />
            <View style={styles.cardContent}>
                <View style={styles.headerRow}>
                    <Text style={styles.ref}>{item.reference}</Text>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                </View>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.infoRow}>
                    <View style={styles.infoBox}>
                        <MaterialIcons name="square-foot" size={16} color="#6B7280" />
                        <Text style={styles.infoText}>{item.surface} m²</Text>
                    </View>
                    <View style={styles.infoBox}>
                        <MaterialIcons name="place" size={16} color="#6B7280" />
                        <Text style={styles.infoText}>{item.zone}</Text>
                    </View>
                </View>
                <View style={styles.priceRow}>
                    <Text style={styles.price}>
                        {item.price.toLocaleString()} {item.currency}
                    </Text>
                    <View style={styles.docType}>
                        <Text style={styles.docTypeText}>{item.documentType}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#2B2E83" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.title}>Trouver un terrain</Text>
                <View style={{ width: 24 }} />
            </View>
            <View style={styles.contentContainer}>

                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Rechercher une zone (ex: Yenne)"
                        value={searchZone}
                        onChangeText={setSearchZone}
                        placeholderTextColor="#9CA3AF"
                    />
                    {searchZone.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchZone('')} style={{ padding: 5 }}>
                            <MaterialIcons name="close" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#2B2E83" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredTerrains}
                        renderItem={renderTerrain}
                        keyExtractor={(item) => item.id!}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <MaterialIcons name="landscape" size={64} color="#D1D5DB" />
                                <Text style={styles.emptyText}>Aucun terrain disponible dans cette zone.</Text>
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
        backgroundColor: '#2B2E83',
    },
    contentContainer: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#2B2E83',
        paddingTop: 50,
    },

    title: {
        fontSize: 18,
        fontFamily: 'FiraSans_700Bold',
        color: '#FFFFFF',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        margin: 20,
        paddingHorizontal: 15,
        borderRadius: 12,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'FiraSans_400Regular',
        color: '#1F2937',
    },
    list: {
        padding: 20,
        paddingTop: 0,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 3,
    },
    image: {
        width: '100%',
        height: 200,
    },
    cardContent: {
        padding: 15,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    ref: {
        fontSize: 12,
        fontFamily: 'FiraSans_600SemiBold',
        color: '#E96C2E',
    },
    statusBadge: {
        backgroundColor: '#DEF7EC',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontFamily: 'FiraSans_700Bold',
        color: '#03543F',
    },
    name: {
        fontSize: 18,
        fontFamily: 'FiraSans_700Bold',
        color: '#1F2937',
        marginBottom: 10,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    infoText: {
        fontSize: 14,
        fontFamily: 'FiraSans_400Regular',
        color: '#6B7280',
        marginLeft: 5,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    price: {
        fontSize: 18,
        fontFamily: 'FiraSans_700Bold',
        color: '#2B2E83',
    },
    docType: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    docTypeText: {
        fontSize: 11,
        fontFamily: 'FiraSans_600SemiBold',
        color: '#4B5563',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    empty: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: 'FiraSans_400Regular',
        color: '#6B7280',
        marginTop: 15,
        textAlign: 'center',
    },
});
