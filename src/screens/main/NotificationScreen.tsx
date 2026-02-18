import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    RefreshControl,
    ActivityIndicator,
    Animated,
    Modal,
    ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useClientSpecificData } from '../../hooks/useClientSpecificData';
import AppHeader from '../../components/AppHeader';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { Toast } from 'toastify-react-native';

import {
    collection,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    Timestamp,
    doc,
    updateDoc,
    deleteDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';

import { Notification } from '../../types';

export default function NotificationScreen() {
    const navigation = useNavigation<any>();
    const { clientInfo } = useClientSpecificData();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'reminders' | 'received'>('reminders');
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

    useEffect(() => {
        if (!clientInfo?.id) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', clientInfo.id),
            limit(100)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Notification[];

            // Sort by createdAt desc in JavaScript to avoid needing a composite index
            const sortedDocs = [...docs].sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });

            setNotifications(sortedDocs);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching notifications:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [clientInfo?.id]);

    const onRefresh = () => {
        setRefreshing(true);
        // onSnapshot will handle the update if Firestore re-syncs
        setTimeout(() => setRefreshing(false), 1000);
    };

    const handleDeleteNotification = async (notificationId: string) => {
        try {
            await deleteDoc(doc(db, 'notifications', notificationId));
            Toast.success('Notification supprimée');
        } catch (error) {
            console.error('Error deleting notification:', error);
            Toast.error('Erreur lors de la suppression');
        }
    };

    const handleNotificationPress = async (notification: any) => {
        // Show detail modal
        setSelectedNotification(notification);

        // Mark as read in Firestore
        try {
            if (!notification.isRead) {
                await updateDoc(doc(db, 'notifications', notification.id), {
                    isRead: true
                });
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleAction = () => {
        if (!selectedNotification) return;

        const notification = selectedNotification;
        setSelectedNotification(null);

        // Navigate based on type
        if (notification.type === 'payment') {
            navigation.navigate('ClientInvoices');
        } else if (notification.type === 'document_upload') {
            navigation.navigate('Documents');
        }
    };

    const renderRightActions = (progress: any, dragX: any, notificationId: string) => {
        const trans = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [0, 100],
            extrapolate: 'clamp',
        });

        return (
            <TouchableOpacity
                style={styles.deleteAction}
                onPress={() => handleDeleteNotification(notificationId)}
            >
                <Animated.View
                    style={[
                        styles.deleteActionContent,
                        {
                            transform: [{ translateX: trans }],
                        },
                    ]}
                >
                    <MaterialIcons name="delete" size={28} color="#FFFFFF" />
                    <Text style={styles.deleteText}>Supprimer</Text>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    const renderNotificationItem = ({ item }: { item: any }) => {
        const date = item.createdAt?.toDate() || new Date();

        return (
            <Swipeable
                renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}
                friction={2}
                rightThreshold={40}
            >
                <TouchableOpacity
                    style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
                    onPress={() => handleNotificationPress(item)}
                    activeOpacity={0.7}
                >
                    <View style={styles.iconContainer}>
                        <MaterialIcons
                            name={getIconName(item.type)}
                            size={24}
                            color={!item.isRead ? '#2B2E83' : '#9CA3AF'}
                        />
                    </View>
                    <View style={styles.contentContainer}>
                        <Text style={[styles.title, !item.isRead && styles.unreadText]}>{item.title}</Text>
                        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
                        <Text style={styles.date}>{date.toLocaleDateString('fr-FR')} à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                    {!item.isRead && <View style={styles.unreadDot} />}
                </TouchableOpacity>
            </Swipeable>
        );
    };

    const getIconName = (type: string) => {
        switch (type) {
            case 'payment': return 'receipt';
            case 'document_upload': return 'description';
            case 'material_selection': return 'shopping-cart';
            default: return 'notifications';
        }
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                <AppHeader
                    title="Notifications"
                    showBack={true}
                    showNotification={false}
                />

                <View style={styles.tabBar}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'reminders' && styles.activeTab]}
                        onPress={() => setActiveTab('reminders')}
                    >
                        <Text style={[styles.tabText, activeTab === 'reminders' && styles.activeTabText]}>Rappels</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'received' && styles.activeTab]}
                        onPress={() => setActiveTab('received')}
                    >
                        <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>Paiements Reçus</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#2B2E83" style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={notifications.filter(n =>
                            activeTab === 'received'
                                ? n.title === 'Paiement reçu'
                                : n.title !== 'Paiement reçu'
                        )}
                        renderItem={renderNotificationItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <MaterialIcons name="notifications-none" size={64} color="#E5E7EB" />
                                <Text style={styles.emptyText}>
                                    {activeTab === 'received'
                                        ? 'Aucun paiement reçu pour le moment'
                                        : 'Aucun rappel pour le moment'}
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>

            {/* Notification Detail Modal */}
            <Modal
                visible={!!selectedNotification}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedNotification(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setSelectedNotification(null)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={[styles.modalIconContainer, { backgroundColor: selectedNotification?.type === 'payment' ? '#F0F1FF' : '#FFF7ED' }]}>
                                <MaterialIcons
                                    name={selectedNotification ? getIconName(selectedNotification.type) : 'notifications'}
                                    size={32}
                                    color={selectedNotification?.type === 'payment' ? '#2B2E83' : '#E96C2E'}
                                />
                            </View>
                            <TouchableOpacity onPress={() => setSelectedNotification(null)}>
                                <MaterialIcons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalTitle}>{selectedNotification?.title}</Text>

                        <ScrollView style={styles.modalScroll}>
                            <Text style={styles.modalMessage}>{selectedNotification?.message}</Text>
                        </ScrollView>

                        <Text style={styles.modalDate}>
                            {selectedNotification?.createdAt?.toDate().toLocaleDateString('fr-FR')} à {selectedNotification?.createdAt?.toDate().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setSelectedNotification(null)}
                            >
                                <Text style={styles.closeButtonText}>Fermer</Text>
                            </TouchableOpacity>

                            {(selectedNotification?.type === 'payment' || selectedNotification?.type === 'document_upload') && (
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={handleAction}
                                >
                                    <Text style={styles.actionButtonText}>
                                        {selectedNotification.type === 'payment' ? 'Voir mes paiements' : 'Voir les documents'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    listContent: {
        paddingVertical: 8,
        paddingBottom: 20,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 20,
        marginHorizontal: 4,
    },
    activeTab: {
        backgroundColor: '#F0F1FF',
    },
    tabText: {
        fontSize: 14,
        fontFamily: 'FiraSans_500Medium',
        color: '#9CA3AF',
    },
    activeTabText: {
        color: '#2B2E83',
        fontFamily: 'FiraSans_600SemiBold',
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        alignItems: 'center',
    },
    unreadItem: {
        backgroundColor: '#F0F1FF',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    contentContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontFamily: 'FiraSans_600SemiBold',
        color: '#374151',
        marginBottom: 4,
    },
    unreadText: {
        color: '#2B2E83',
    },
    message: {
        fontSize: 14,
        fontFamily: 'FiraSans_400Regular',
        color: '#6B7280',
        marginBottom: 8,
    },
    date: {
        fontSize: 12,
        fontFamily: 'FiraSans_400Regular',
        color: '#9CA3AF',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2B2E83',
        marginLeft: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#9CA3AF',
        fontFamily: 'FiraSans_400Regular',
    },
    deleteAction: {
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'flex-end',
        width: 100,
        height: '100%',
    },
    deleteActionContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
    },
    deleteText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontFamily: 'FiraSans_600SemiBold',
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    modalIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'FiraSans_700Bold',
        color: '#1F2937',
        marginBottom: 12,
    },
    modalScroll: {
        maxHeight: 200,
        marginBottom: 16,
    },
    modalMessage: {
        fontSize: 16,
        fontFamily: 'FiraSans_400Regular',
        color: '#4B5563',
        lineHeight: 24,
    },
    modalDate: {
        fontSize: 12,
        fontFamily: 'FiraSans_400Regular',
        color: '#9CA3AF',
        marginBottom: 24,
        textAlign: 'right',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    closeButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        fontFamily: 'FiraSans_600SemiBold',
        color: '#4B5563',
    },
    actionButton: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#2B2E83',
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: 16,
        fontFamily: 'FiraSans_600SemiBold',
        color: '#FFFFFF',
    },
});
