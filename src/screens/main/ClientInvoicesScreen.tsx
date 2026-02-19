import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  Dimensions
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, LoadingSpinner, EmptyState } from '../../components/ui';
import { FilterModal } from '../../components/modals/FilterModal';
import {
  mobileInvoiceService,
  type MobileInvoice,
  type MobilePaymentHistory
} from '../../services/mobileInvoiceService';
import { useAuth } from '../../contexts/AuthContext';
import AppHeader from '../../components/AppHeader';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../../hooks/useNotifications';
import { ReceiptDetailModal } from '../../components/modals/ReceiptDetailModal';

export const ClientInvoicesScreen: React.FC = () => {
  const { userData } = useAuth();
  const [invoices, setInvoices] = useState<MobileInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<MobileInvoice[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<MobilePaymentHistory[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overdue' | 'history'>('history');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<MobilePaymentHistory | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const { unreadCount } = useNotifications();
  const navigation = useNavigation<any>();

  const loadInvoices = useCallback(async () => {
    if (!userData?.clientId) return;

    try {
      setError(null);
      const [invoicesData, paymentsData, dashboardData] = await Promise.all([
        mobileInvoiceService.getClientInvoices(userData.clientId),
        mobileInvoiceService.getClientPaymentHistory(userData.clientId),
        mobileInvoiceService.getMobilePaymentDashboard(userData.clientId)
      ]);

      setInvoices(invoicesData);
      setPaymentHistory(paymentsData);
      setDashboard(dashboardData);
    } catch (err) {
      console.error('Erreur lors du chargement des factures:', err);
      setError('Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
    }
  }, [userData?.clientId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInvoices();
    setRefreshing(false);
  }, [loadInvoices]);

  const filterInvoices = useCallback(() => {
    let filtered = [...invoices];

    switch (activeTab as string) {
      case 'overdue':
        filtered = filtered.filter(inv => inv.paymentStatus === 'overdue');
        break;
      default:
        // Tous les factures
        break;
    }

    setFilteredInvoices(filtered);
  }, [invoices, activeTab]);

  useEffect(() => {
    if (userData?.clientId) {
      loadInvoices();
    }
  }, [userData?.clientId, loadInvoices]);

  useEffect(() => {
    filterInvoices();
  }, [filterInvoices]);

  const getTabCount = useCallback((tab: typeof activeTab) => {
    switch (tab) {
      case 'overdue':
        return invoices.filter(inv => inv.paymentStatus === 'overdue').length;
      case 'history':
        return paymentHistory.length;
      default:
        return 0;
    }
  }, [invoices, paymentHistory]);

  const handleInvoicePress = useCallback((invoice: MobileInvoice) => {
    console.log('Ouvrir facture:', invoice.id);
  }, []);

  const handlePaymentPress = useCallback((payment: MobilePaymentHistory) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  }, []);

  const handleDownloadInvoice = useCallback((invoice: MobileInvoice) => {
    if (invoice.documentUrl) {
      console.log('Télécharger facture:', invoice.documentUrl);
    }
  }, []);

  const renderInvoiceItem = useCallback(({ item: invoice }: { item: MobileInvoice }) => (
    <TouchableOpacity
      style={styles.invoiceCard}
      onPress={() => handleInvoicePress(invoice)}
      activeOpacity={0.8}
    >
      <View style={styles.cardIndicator} />
      <Card style={styles.invoiceCardContent}>
        <View style={styles.invoiceHeader}>
          <View style={styles.invoiceInfo}>
            <View style={styles.invoiceNumberRow}>
              <Ionicons name="document-text" size={18} color="#2B2E83" />
              <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            </View>
            <Text style={styles.invoiceType}>
              {mobileInvoiceService.getTypeLabel(invoice.type)}
            </Text>
          </View>

          <View style={[
            styles.statusBadge,
            { backgroundColor: mobileInvoiceService.getStatusColor(invoice.paymentStatus) + '15' }
          ]}>
            <View style={[styles.statusDot, { backgroundColor: mobileInvoiceService.getStatusColor(invoice.paymentStatus) }]} />
            <Text style={[
              styles.statusText,
              { color: mobileInvoiceService.getStatusColor(invoice.paymentStatus) }
            ]}>
              {mobileInvoiceService.getStatusLabel(invoice.paymentStatus)}
            </Text>
          </View>
        </View>

        <Text style={styles.invoiceDescription} numberOfLines={1}>
          {invoice.description}
        </Text>

        <View style={styles.invoiceDetailsGrid}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
            <Text style={styles.detailText}>
              {mobileInvoiceService.formatDate(invoice.issueDate)}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons
              name="time-outline"
              size={14}
              color={mobileInvoiceService.isOverdue(invoice.dueDate) ? "#EF4444" : "#9CA3AF"}
            />
            <Text style={[
              styles.detailText,
              mobileInvoiceService.isOverdue(invoice.dueDate) && styles.overdueText
            ]}>
              {mobileInvoiceService.formatDate(invoice.dueDate)}
            </Text>
          </View>
        </View>

        <View style={styles.cardSeparator} />

        <View style={styles.invoiceFooter}>
          <View style={styles.amounts}>
            <Text style={styles.amountLabel}>Total à régler</Text>
            <Text style={styles.totalAmount}>
              {mobileInvoiceService.formatCurrency(invoice.totalAmount)}
            </Text>
          </View>

          <TouchableOpacity style={styles.viewInvoiceButton}>
            <Text style={styles.viewInvoiceText}>Détails</Text>
            <Ionicons name="chevron-forward" size={14} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  ), [handleInvoicePress]);

  const renderHistoryItem = useCallback(({ item: payment }: { item: MobilePaymentHistory }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => handlePaymentPress(payment)}
      style={styles.historyCardWrapper}
    >
      <Card style={styles.historyCard}>
        <View style={styles.historyIconContainer}>
          <LinearGradient
            colors={['#2B2E83', '#4A4DB4']}
            style={styles.historyIconGradient}
          >
            <Ionicons name="receipt" size={20} color="#FFFFFF" />
          </LinearGradient>
        </View>

        <View style={styles.historyMain}>
          <View style={styles.historyTop}>
            <Text style={styles.historyTitle}>Paiement validé</Text>
            <Text style={styles.historyValue}>
              {mobileInvoiceService.formatCurrency(payment.amount)}
            </Text>
          </View>

          <View style={styles.historyBottom}>
            <View style={styles.historyMethodInfo}>
              <Ionicons
                name={payment.method === 'mobile_money' ? 'phone-portrait-outline' : 'business-outline'}
                size={12}
                color="#6B7280"
              />
              <Text style={styles.historyMethodLabel}>
                {payment.method === 'bank_transfer' ? 'Virement' :
                  payment.method === 'mobile_money' ? 'Mobile money' : 'Espèces'}
              </Text>
            </View>
            <Text style={styles.historyDateLabel}>
              {mobileInvoiceService.formatDate(payment.date)}
            </Text>
          </View>
        </View>

        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
        </View>
      </Card>
    </TouchableOpacity>
  ), [handlePaymentPress]);

  const renderEmptyState = useCallback(() => {
    const emptyStates: Record<string, { icon: any; title: string; description: string }> = {
      all: {
        icon: "document-text-outline",
        title: "Aucune facture",
        description: "Vous n'avez pas encore reçu de factures."
      },
      paid: {
        icon: "checkmark-circle-outline",
        title: "Aucune facture payée",
        description: "Aucune facture n'a encore été payée."
      },
      pending: {
        icon: "time-outline",
        title: "Aucune facture en attente",
        description: "Toutes vos factures sont à jour."
      },
      overdue: {
        icon: "alert-circle-outline",
        title: "Aucune facture en retard",
        description: "Félicitations ! Tous vos paiements sont à jour."
      },
      history: {
        icon: "receipt-outline",
        title: "Aucun historique",
        description: "Vous n'avez pas encore effectué de paiements."
      }
    };

    const state = emptyStates[activeTab] || emptyStates.all;

    return (
      <EmptyState
        icon={state.icon}
        title={state.title}
        description={state.description}
      />
    );
  }, [activeTab]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <Text style={styles.loadingText}>Chargement des paiements...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <EmptyState
          icon="alert-circle-outline"
          title="Erreur de chargement"
          description={error}
          actionText="Réessayer"
          onAction={loadInvoices}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Mes Paiements"
        showBack={false}
        showNotification={true}
        notificationCount={unreadCount}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />


      {/* Résumé financier moderne */}
      <View style={styles.summarySection}>
        <LinearGradient
          colors={['#2B2E83', '#1A1C54']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mainSummaryCard}
        >
          <View style={styles.summaryDecoration} />

          <View style={styles.summaryTopRow}>
            <View>
              <Text style={styles.summaryTitleLabel}>Total du Projet</Text>
              <Text style={styles.summaryMainValue}>
                {mobileInvoiceService.formatCurrency(dashboard?.totalProjectCost || 0)}
              </Text>
            </View>
            <View style={styles.projectIconCircle}>
              <FontAwesome5 name="building" size={20} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryStatsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.statLabel}>Payé</Text>
              <Text style={styles.statValue}>
                {mobileInvoiceService.formatCurrency(dashboard?.totalPaid || 0)}
              </Text>
            </View>

            <View style={styles.statVerticalDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#E96C2E' }]} />
              <Text style={styles.statLabel}>Reste</Text>
              <Text style={styles.statValue}>
                {mobileInvoiceService.formatCurrency(dashboard?.totalRemaining || 0)}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Modern Tab Selector */}
      <View style={styles.tabsWrapper}>
        <View style={styles.modernTabs}>
          {[
            { key: 'overdue', label: 'En retard', icon: 'alert-circle' },
            { key: 'history', label: 'Historique', icon: 'list' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.9}
              style={[
                styles.modernTab,
                activeTab === tab.key && styles.activeModernTab
              ]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? '#FFFFFF' : '#6B7280'}
                style={{ marginRight: 6 }}
              />
              <Text style={[
                styles.modernTabText,
                activeTab === tab.key && styles.activeModernTabText
              ]}>
                {tab.label}
              </Text>
              {getTabCount(tab.key as any) > 0 && (
                <View style={[
                  styles.tabBadge,
                  activeTab === tab.key ? styles.activeTabBadge : styles.inactiveTabBadge
                ]}>
                  <Text style={[
                    styles.tabBadgeText,
                    activeTab === tab.key ? styles.activeTabBadgeText : styles.inactiveTabBadgeText
                  ]}>
                    {getTabCount(tab.key as any)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Liste des factures */}
      <FlatList
        data={(activeTab === 'history' ? paymentHistory : filteredInvoices) as any[]}
        renderItem={activeTab === 'history' ? renderHistoryItem : renderInvoiceItem as any}
        keyExtractor={(item) => item.id!}
        style={styles.invoicesList}
        contentContainerStyle={styles.invoicesListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* Modal de filtres */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={(filters) => {
          console.log('Appliquer filtres:', filters);
          setShowFilterModal(false);
        }}
      />

      <ReceiptDetailModal
        isVisible={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        payment={selectedPayment}
        clientName={`${userData?.displayName || 'Client'}`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
  },

  // Summary Section
  summarySection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  mainSummaryCard: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    shadowColor: '#2B2E83',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  summaryDecoration: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitleLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'FiraSans_700Bold',
  },
  summaryMainValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'FiraSans_700Bold',
    marginTop: 4,
  },
  projectIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 6,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    marginBottom: 2,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  statVerticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 15,
  },

  // Tabs Style
  tabsWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  modernTabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 6,
  },
  modernTab: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  activeModernTab: {
    backgroundColor: '#2B2E83',
    shadowColor: '#2B2E83',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modernTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeModernTabText: {
    color: '#FFFFFF',
  },
  tabBadge: {
    marginLeft: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  activeTabBadge: {
    backgroundColor: '#FFFFFF',
  },
  inactiveTabBadge: {
    backgroundColor: '#D1D5DB',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeTabBadgeText: {
    color: '#2B2E83',
  },
  inactiveTabBadgeText: {
    color: '#FFFFFF',
  },

  // Invoices List
  invoicesList: {
    flex: 1,
  },
  invoicesListContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Invoice Card
  invoiceCard: {
    marginBottom: 20,
    position: 'relative',
  },
  cardIndicator: {
    position: 'absolute',
    left: 0,
    top: 20,
    bottom: 20,
    width: 4,
    backgroundColor: '#2B2E83',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    zIndex: 10,
  },
  invoiceCardContent: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  invoiceType: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  invoiceDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 16,
  },
  invoiceDetailsGrid: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  overdueText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  cardSeparator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amounts: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B2E83',
  },
  viewInvoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewInvoiceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },

  // History Card
  historyCardWrapper: {
    marginBottom: 16,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  historyIconContainer: {
    marginRight: 16,
  },
  historyIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyMain: {
    flex: 1,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  historyValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#10B981',
  },
  historyBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyMethodLabel: {
    fontSize: 11,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  historyDateLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  chevronContainer: {
    marginLeft: 12,
  },
});

export default ClientInvoicesScreen;