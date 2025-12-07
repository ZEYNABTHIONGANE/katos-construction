import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChefTabParamList } from '../../types';
import AppHeader from '../../components/AppHeader';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { chantierService } from '../../services/chantierService';
import { clientSelectionService } from '../../services/clientSelectionService';
import { clientService } from '../../services/clientService';
import { FirebaseChantier, FirebaseClientSelection } from '../../types/firebase';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<ChefTabParamList, 'ChefDashboard'>;

interface StatCard {
  id: string;
  title: string;
  value: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  backgroundColor: string;
}

export default function ChefDashboardScreen({ navigation }: Props) {
  const { user, userData, loading: authLoading } = useAuth();
  const [chantiers, setChantiers] = useState<FirebaseChantier[]>([]);
  const [clientSelections, setClientSelections] = useState<FirebaseClientSelection[]>([]);
  const [clientNames, setClientNames] = useState<{ [key: string]: string }>({});
  const [stats, setStats] = useState<StatCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllSelectionsModal, setShowAllSelectionsModal] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      loadChefData();
    }
  }, [user, authLoading]);

  const loadChefData = async () => {
    try {
      setLoading(true);

      if (!user) {
        Alert.alert('Erreur', 'Vous devez être connecté pour accéder à cette page');
        return;
      }

      // Use the authenticated user's ID as the chef ID
      const chefId = user.uid;

      // Set up real-time listener for chef chantiers
      const unsubscribeChantiers = chantierService.subscribeToChefChantiers(chefId, (chantiersData) => {
        setChantiers(chantiersData);
        updateStats(chantiersData);
        setLoading(false);
      });

      // Set up real-time listener for client selections
      const unsubscribeSelections = clientSelectionService.subscribeToAllSelections((selectionsData) => {
        setClientSelections(selectionsData);
        // Load client names for each selection
        loadClientNames(selectionsData);
      });

      return () => {
        unsubscribeChantiers();
        unsubscribeSelections();
      };
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
      setLoading(false);
    }
  };

  const updateStats = (chantiersData: FirebaseChantier[]) => {
    const totalChantiers = chantiersData.length;
    const chantiersActifs = chantiersData.filter(c => c.status === 'En cours').length;
    const chantiersTermines = chantiersData.filter(c => c.status === 'Terminé').length;
    const chantiersEnRetard = chantiersData.filter(c => c.status === 'En retard').length;

    const newStats: StatCard[] = [
      {
        id: '1',
        title: 'Projets actifs',
        value: chantiersActifs.toString(),
        icon: 'domain',
        color: '#2B2E83',
        backgroundColor: '#F8F9FF',
      },
      {
        id: '2',
        title: 'Terminés',
        value: chantiersTermines.toString(),
        icon: 'check-circle',
        color: '#4CAF50',
        backgroundColor: '#F1F8E9',
      },
      {
        id: '3',
        title: 'En retard',
        value: chantiersEnRetard.toString(),
        icon: 'warning',
        color: '#F44336',
        backgroundColor: '#FFEBEE',
      },
      {
        id: '4',
        title: 'Total projets',
        value: totalChantiers.toString(),
        icon: 'assessment',
        color: '#E96C2E',
        backgroundColor: '#FFF7ED',
      },
    ];

    setStats(newStats);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };

  const loadClientNames = async (selectionsData: FirebaseClientSelection[]) => {
    const uniqueClientIds = [...new Set(selectionsData.map(s => s.clientId))];
    const names: { [key: string]: string } = {};

    console.log('Loading client names for IDs:', uniqueClientIds);

    // Récupérons tous les clients d'un coup pour optimiser
    try {
      const allClients = await clientService.getClients();
      console.log('All clients loaded:', allClients.length);

      for (const clientId of uniqueClientIds) {
        // Chercher par userId d'abord
        let client = allClients.find(c => c.userId === clientId);
        console.log('Client found by userId for', clientId, ':', client);

        // Si pas trouvé par userId, chercher par id du document
        if (!client) {
          client = allClients.find(c => c.id === clientId);
          console.log('Client found by id for', clientId, ':', client);
        }

        if (client) {
          names[clientId] = `${client.prenom} ${client.nom}`;
          console.log('Set client name for', clientId, ':', names[clientId]);
        } else {
          names[clientId] = `Client ${clientId.substring(0, 8)}...`;
          console.log('Using fallback name for:', clientId);
        }
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      // En cas d'erreur, utiliser des noms de fallback
      for (const clientId of uniqueClientIds) {
        names[clientId] = `Client ${clientId.substring(0, 8)}...`;
      }
    }

    console.log('Final client names mapping:', names);
    setClientNames(names);
  };

  const getClientName = (clientId: string) => {
    return clientNames[clientId] || `Client ${clientId.substring(0, 8)}...`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (authLoading || loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <AppHeader
          title="Tableau de bord"
          showNotification={true}
          onNotificationPress={() => {}}
        />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#2B2E83" />
          <Text style={styles.loadingText}>Chargement en cours...</Text>
        </View>
      </View>
    );
  }
  const handleProjectPress = (chantier: FirebaseChantier) => {
    if (chantier.id) {
      navigation.navigate('ChefChantiers', { selectedChantierId: chantier.id });
    } else {
      navigation.navigate('ChefChantiers', {});
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours':
        return '#E0B043';
      case 'En retard':
        return '#F44336';
      case 'Terminé':
        return '#4CAF50';
      default:
        return '#9CA3AF';
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Tableau de bord"
        showNotification={true}
        onNotificationPress={() => {}}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ExpoLinearGradient
          colors={['#2B2E83', '#E96C2E']}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.welcomeSection}
        >
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.name}>{userData?.displayName || user?.displayName || 'Chef'}</Text>
          <Text style={styles.subtitle}>Chef de chantier chez Katos Construction</Text>
        </ExpoLinearGradient>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Aperçu général</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat) => (
              <TouchableOpacity key={stat.id} style={styles.statCard}>
                <View style={[styles.statCardContent, { backgroundColor: stat.backgroundColor }]}>
                  <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
                    <MaterialIcons name={stat.icon} size={28} color={stat.color} />
                  </View>
                  <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={styles.statTitle}>{stat.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      <View style={styles.projectsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Projets en cours</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('ChefChantiers')}
          >
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {chantiers.slice(0, 3).map((chantier) => (
          <TouchableOpacity
            key={chantier.id}
            style={styles.projectCard}
            onPress={() => handleProjectPress(chantier)}
            activeOpacity={0.7}
          >
            <View style={styles.projectCardInner}>
              <View style={styles.projectHeader}>
                <View style={styles.projectInfo}>
                  <Text style={styles.projectName}>{chantier.name}</Text>
                  <Text style={styles.clientName}>{chantier.address}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(chantier.status) }]}>
                  <Text style={styles.statusText}>{chantier.status}</Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Progression</Text>
                  <Text style={styles.progressValue}>{chantier.globalProgress}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <ExpoLinearGradient
                    colors={['#2B2E83', '#E96C2E']}
                    start={[0, 0]}
                    end={[1, 0]}
                    style={[
                      styles.progressFill,
                      { width: `${chantier.globalProgress}%` }
                    ]}
                  />
                </View>
              </View>

              <View style={styles.projectFooter}>
                <View style={styles.dueDateContainer}>
                  <View style={styles.iconContainer}>
                    <MaterialIcons name="schedule" size={18} color="#2B2E83" />
                  </View>
                  <Text style={styles.dueDate}>Échéance: {formatDate(chantier.plannedEndDate)}</Text>
                </View>
                <View style={styles.arrowContainer}>
                  <MaterialIcons name="arrow-forward-ios" size={18} color="#2B2E83" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {chantiers.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="domain" size={64} color="#E0E0E0" />
            <Text style={styles.emptyStateText}>Aucun chantier assigné</Text>
            <Text style={styles.emptyStateSubtext}>
              Vous n'avez pas encore de chantiers assignés
            </Text>
          </View>
        )}
      </View>

      {/* Section des sélections clients */}
      <View style={styles.selectionsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sélections clients récentes</Text>
          <TouchableOpacity onPress={() => setShowAllSelectionsModal(true)}>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {clientSelections.slice(0, 3).map((selection) => (
          <TouchableOpacity
            key={selection.id}
            style={styles.selectionCard}
            activeOpacity={0.7}
          >
            <View style={styles.selectionCardInner}>
              <View style={styles.selectionHeader}>
                <View style={styles.selectionInfo}>
                  <Text style={styles.selectionClient}>{getClientName(selection.clientId)}</Text>
                  <Text style={styles.selectionDate}>{formatDateTime(selection.submittedAt)}</Text>
                </View>
                <View style={[styles.selectionStatusBadge, {
                  backgroundColor: selection.status === 'submitted' ? '#FFC107' :
                                   selection.status === 'approved' ? '#4CAF50' : '#F44336'
                }]}>
                  <Text style={styles.selectionStatusText}>
                    {selection.status === 'submitted' ? 'Nouveau' :
                     selection.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                  </Text>
                </View>
              </View>

              <View style={styles.selectionContent}>
                <Text style={styles.selectionItemCount}>
                  {selection.selections.length} matériau(x) sélectionné(s)
                </Text>

                {/* Affichage détaillé de chaque matériau */}
                <View style={styles.materialsDetailContainer}>
                  {selection.selections.map((item, index) => (
                    <View key={index} style={styles.materialDetailCard}>
                      <View style={styles.materialImageContainer}>
                        <Image
                          source={{ uri: item.materialImageUrl }}
                          style={styles.materialImage}
                          onError={(e) => {
                            (e.target as any).src = 'https://images.unsplash.com/photo-1604079628040-94301bb21b91?w=400';
                          }}
                        />
                      </View>

                      <View style={styles.materialDetails}>
                        <View style={styles.materialHeader}>
                          <Text style={styles.materialNameDetail} numberOfLines={2}>
                            {item.materialName}
                          </Text>
                          <View style={styles.materialCategoryBadge}>
                            <Text style={styles.materialCategoryText}>
                              {item.materialCategory}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.materialPriceContainer}>
                          <MaterialIcons name="attach-money" size={16} color="#4CAF50" />
                          <Text style={styles.materialPrice}>
                            {formatPrice(item.materialPrice)}
                          </Text>
                        </View>

                        <View style={styles.materialDateContainer}>
                          <MaterialIcons name="access-time" size={14} color="#6B7280" />
                          <Text style={styles.materialSelectedDate}>
                            Sélectionné le {formatDateTime(item.selectedAt)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Statistiques de la sélection */}
                <View style={styles.selectionStats}>
                  <View style={styles.statItem}>
                    <MaterialIcons name="category" size={16} color="#2B2E83" />
                    <Text style={styles.statLabel}>Catégories:</Text>
                    <Text style={styles.statValue}>
                      {[...new Set(selection.selections.map(s => s.materialCategory))].length}
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <MaterialIcons name="schedule" size={16} color="#E96C2E" />
                    <Text style={styles.statLabel}>Soumis:</Text>
                    <Text style={styles.statValue}>
                      {formatDateTime(selection.submittedAt)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.selectionFooter}>
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalAmount}>
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XOF',
                      minimumFractionDigits: 0,
                    }).format(selection.totalAmount)}
                  </Text>
                </View>
                <View style={styles.arrowContainer}>
                  <MaterialIcons name="arrow-forward-ios" size={16} color="#2B2E83" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {clientSelections.length === 0 && (
          <View style={styles.emptySelections}>
            <MaterialIcons name="shopping-cart" size={48} color="#E0E0E0" />
            <Text style={styles.emptySelectionsText}>Aucune sélection client</Text>
            <Text style={styles.emptySelectionsSubtext}>
              Les sélections des clients apparaîtront ici
            </Text>
          </View>
        )}
      </View>
      </ScrollView>

      {/* Modal pour voir toutes les sélections */}
      <Modal
        visible={showAllSelectionsModal}
        animationType="slide"
        onRequestClose={() => setShowAllSelectionsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Toutes les sélections clients</Text>
            <TouchableOpacity
              onPress={() => setShowAllSelectionsModal(false)}
              style={styles.modalCloseButton}
            >
              <MaterialIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={clientSelections}
            keyExtractor={(item) => item.id || ''}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalContent}
            renderItem={({ item: selection }) => (
              <View style={styles.fullSelectionCard}>
                <View style={styles.selectionCardInner}>
                  <View style={styles.selectionHeader}>
                    <View style={styles.selectionInfo}>
                      <Text style={styles.selectionClient}>{getClientName(selection.clientId)}</Text>
                      <Text style={styles.selectionDate}>{formatDateTime(selection.submittedAt)}</Text>
                    </View>
                    <View style={[styles.selectionStatusBadge, {
                      backgroundColor: selection.status === 'submitted' ? '#FFC107' :
                                       selection.status === 'approved' ? '#4CAF50' : '#F44336'
                    }]}>
                      <Text style={styles.selectionStatusText}>
                        {selection.status === 'submitted' ? 'Nouveau' :
                         selection.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.selectionContent}>
                    <Text style={styles.selectionItemCount}>
                      {selection.selections.length} matériau(x) sélectionné(s)
                    </Text>

                    {/* Affichage détaillé de chaque matériau */}
                    <View style={styles.materialsDetailContainer}>
                      {selection.selections.map((item, index) => (
                        <View key={index} style={styles.materialDetailCard}>
                          <View style={styles.materialImageContainer}>
                            <Image
                              source={{ uri: item.materialImageUrl }}
                              style={styles.materialImage}
                              onError={(e) => {
                                (e.target as any).src = 'https://images.unsplash.com/photo-1604079628040-94301bb21b91?w=400';
                              }}
                            />
                          </View>

                          <View style={styles.materialDetails}>
                            <View style={styles.materialHeader}>
                              <Text style={styles.materialNameDetail} numberOfLines={2}>
                                {item.materialName}
                              </Text>
                              <View style={styles.materialCategoryBadge}>
                                <Text style={styles.materialCategoryText}>
                                  {item.materialCategory}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.materialPriceContainer}>
                              <MaterialIcons name="attach-money" size={16} color="#4CAF50" />
                              <Text style={styles.materialPrice}>
                                {formatPrice(item.materialPrice)}
                              </Text>
                            </View>

                            <View style={styles.materialDateContainer}>
                              <MaterialIcons name="access-time" size={14} color="#6B7280" />
                              <Text style={styles.materialSelectedDate}>
                                Sélectionné le {formatDateTime(item.selectedAt)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>

                    {/* Statistiques de la sélection */}
                    <View style={styles.selectionStats}>
                      <View style={styles.statItem}>
                        <MaterialIcons name="category" size={16} color="#2B2E83" />
                        <Text style={styles.statLabel}>Catégories:</Text>
                        <Text style={styles.statValue}>
                          {[...new Set(selection.selections.map(s => s.materialCategory))].length}
                        </Text>
                      </View>

                      <View style={styles.statItem}>
                        <MaterialIcons name="schedule" size={16} color="#E96C2E" />
                        <Text style={styles.statLabel}>Soumis:</Text>
                        <Text style={styles.statValue}>
                          {formatDateTime(selection.submittedAt)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.selectionFooter}>
                    <View style={styles.totalContainer}>
                      <Text style={styles.totalLabel}>Total:</Text>
                      <Text style={styles.totalAmount}>
                        {formatPrice(selection.totalAmount)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptySelections}>
                <MaterialIcons name="shopping-cart" size={48} color="#E0E0E0" />
                <Text style={styles.emptySelectionsText}>Aucune sélection client</Text>
                <Text style={styles.emptySelectionsSubtext}>
                  Les sélections des clients apparaîtront ici
                </Text>
              </View>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  welcomeSection: {
    paddingHorizontal: 25,
    paddingVertical: 30,
    marginTop: 15,
    marginHorizontal: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  greeting: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_400Regular',
    opacity: 0.9,
  },
  name: {
    fontSize: 28,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_700Bold',
    marginTop: 5,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
    opacity: 0.8,
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#2B2E83',
    fontFamily: 'FiraSans_700Bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  statCardContent: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'FiraSans_700Bold',
    marginBottom: 6,
  },
  statTitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'FiraSans_600SemiBold',
    textAlign: 'center',
  },
  projectsContainer: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#E96C2E',
    fontFamily: 'FiraSans_600SemiBold',
  },
  projectCard: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
    minHeight: 120,
  },
  projectCardInner: {
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    color: '#E96C2E',
    fontFamily: 'FiraSans_600SemiBold',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
  },
  progressValue: {
    fontSize: 14,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  dueDate: {
    fontSize: 13,
    color: '#4B5563',
    fontFamily: 'FiraSans_600SemiBold',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6B7280',
    fontFamily: 'FiraSans_600SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'FiraSans_400Regular',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // Styles pour les sélections clients
  selectionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  selectionCard: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  selectionCardInner: {
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  selectionInfo: {
    flex: 1,
  },
  selectionClient: {
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 4,
  },
  selectionDate: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
  },
  selectionStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  selectionStatusText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
    textTransform: 'uppercase',
  },
  selectionContent: {
    marginBottom: 12,
  },
  selectionItemCount: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'FiraSans_500Medium',
    marginBottom: 8,
  },
  selectionMaterials: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#E96C2E',
  },
  materialName: {
    fontSize: 13,
    color: '#374151',
    fontFamily: 'FiraSans_400Regular',
    marginBottom: 2,
  },
  moreItems: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_500Medium',
    fontStyle: 'italic',
    marginTop: 4,
  },
  selectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    marginRight: 8,
  },
  totalAmount: {
    fontSize: 16,
    color: '#E96C2E',
    fontFamily: 'FiraSans_700Bold',
  },
  emptySelections: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptySelectionsText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'FiraSans_600SemiBold',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySelectionsSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'FiraSans_400Regular',
    textAlign: 'center',
  },

  // Styles pour l'affichage détaillé des matériaux
  materialsDetailContainer: {
    marginTop: 12,
  },
  materialDetailCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#E96C2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  materialImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },
  materialImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  materialDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  materialNameDetail: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'FiraSans_600SemiBold',
    flex: 1,
    marginRight: 8,
    lineHeight: 18,
  },
  materialCategoryBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  materialCategoryText: {
    fontSize: 10,
    color: '#3730A3',
    fontFamily: 'FiraSans_600SemiBold',
    textTransform: 'uppercase',
  },
  materialPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  materialPrice: {
    fontSize: 13,
    color: '#059669',
    fontFamily: 'FiraSans_700Bold',
    marginLeft: 4,
  },
  materialDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  materialSelectedDate: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    marginLeft: 4,
  },

  // Styles pour les statistiques
  selectionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_500Medium',
    marginLeft: 4,
    marginRight: 4,
  },
  statValue: {
    fontSize: 12,
    color: '#1F2937',
    fontFamily: 'FiraSans_600SemiBold',
  },

  // Styles pour la modal "Voir tout"
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2B2E83',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 60,
  },
  modalTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_700Bold',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    padding: 20,
  },
  fullSelectionCard: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
});