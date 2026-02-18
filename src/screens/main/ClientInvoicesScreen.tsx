import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  useEffect(() => {
    if (userData?.clientId) {
      loadInvoices();
    }
  }, [userData?.clientId]);

  useEffect(() => {
    filterInvoices();
  }, [invoices, activeTab]);

  const loadInvoices = async () => {
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
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvoices();
    setRefreshing(false);
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    switch (activeTab) {
      case 'paid':
        filtered = filtered.filter(inv => inv.paymentStatus === 'paid');
        break;
      case 'pending':
        filtered = filtered.filter(inv => inv.paymentStatus === 'pending');
        break;
      case 'overdue':
        filtered = filtered.filter(inv => inv.paymentStatus === 'overdue');
        break;
      default:
        // Tous les factures
        break;
    }

    setFilteredInvoices(filtered);
  };

  const getTabCount = (tab: typeof activeTab) => {
    switch (tab) {
      case 'overdue':
        return invoices.filter(inv => inv.paymentStatus === 'overdue').length;
      case 'history':
        return paymentHistory.length;
      default:
        return 0;
    }
  };

  const handleInvoicePress = (invoice: MobileInvoice) => {
    // Navigation vers les détails de la facture
    // TODO: Implémenter la navigation
    console.log('Ouvrir facture:', invoice.id);
  };

  const handlePaymentPress = (payment: MobilePaymentHistory) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  const handleDownloadInvoice = (invoice: MobileInvoice) => {
    if (invoice.documentUrl) {
      // TODO: Implémenter le téléchargement
      console.log('Télécharger facture:', invoice.documentUrl);
    }
  };

  const renderInvoiceItem = ({ item: invoice }: { item: MobileInvoice }) => (
    <TouchableOpacity
      style={styles.invoiceCard}
      onPress={() => handleInvoicePress(invoice)}
      activeOpacity={0.7}
    >
      <Card style={styles.invoiceCardContent}>
        <View style={styles.invoiceHeader}>
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <Text style={styles.invoiceType}>
              {mobileInvoiceService.getTypeLabel(invoice.type)}
            </Text>
          </View>

          <View style={[
            styles.statusBadge,
            { backgroundColor: mobileInvoiceService.getStatusColor(invoice.paymentStatus) + '20' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: mobileInvoiceService.getStatusColor(invoice.paymentStatus) }
            ]}>
              {mobileInvoiceService.getStatusLabel(invoice.paymentStatus)}
            </Text>
          </View>
        </View>

        <Text style={styles.invoiceDescription} numberOfLines={2}>
          {invoice.description}
        </Text>

        <View style={styles.invoiceDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              Émise le {mobileInvoiceService.formatDate(invoice.issueDate)}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons
              name={mobileInvoiceService.isDueToday(invoice.dueDate) ? "alert-circle" : "time-outline"}
              size={16}
              color={mobileInvoiceService.isOverdue(invoice.dueDate) ? "#EF4444" : "#F59E0B"}
            />
            <Text style={[
              styles.detailText,
              mobileInvoiceService.isOverdue(invoice.dueDate) && styles.overdueText
            ]}>
              Échéance {mobileInvoiceService.formatDate(invoice.dueDate)}
            </Text>
          </View>
        </View>

        <View style={styles.invoiceFooter}>
          <View style={styles.amounts}>
            <Text style={styles.totalAmount}>
              {mobileInvoiceService.formatCurrency(invoice.totalAmount)}
            </Text>
            {invoice.remainingAmount > 0 && (
              <Text style={styles.remainingAmount}>
                Reste: {mobileInvoiceService.formatCurrency(invoice.remainingAmount)}
              </Text>
            )}
          </View>

          <View style={styles.invoiceActions}>
            {invoice.documentUrl && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDownloadInvoice(invoice)}
              >
                <Ionicons name="download-outline" size={20} color="#3B82F6" />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item: payment }: { item: MobilePaymentHistory }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => handlePaymentPress(payment)}
      style={styles.historyCardWrapper}
    >
      <Card style={styles.historyCard}>
        <View style={styles.historyIcon}>
          <Ionicons name="receipt-outline" size={24} color="#2B2E83" />
        </View>
        <View style={styles.historyContent}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Reçu de paiement</Text>
            <Text style={styles.historyAmount}>
              {mobileInvoiceService.formatCurrency(payment.amount)}
            </Text>
          </View>
          <Text style={styles.historyMethod}>
            Méthode: {payment.method === 'bank_transfer' ? 'Virement' :
              payment.method === 'mobile_money' ? 'Mobile Money' :
                payment.method === 'cash' ? 'Espèces' : payment.method}
          </Text>
          <View style={styles.historyFooter}>
            <Text style={styles.historyDate}>
              {mobileInvoiceService.formatDate(payment.date)}
            </Text>
            <View style={styles.viewBadge}>
              <Text style={styles.viewBadgeText}>Voir reçu</Text>
              <Ionicons name="chevron-forward" size={12} color="#3B82F6" />
            </View>
          </View>
          {payment.reference && (
            <Text style={styles.historyRef}>Réf: {payment.reference}</Text>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    const emptyStates = {
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

    const state = emptyStates[activeTab];

    return (
      <EmptyState
        icon={state.icon}
        title={state.title}
        description={state.description}
      />
    );
  };

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
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Mes Paiements"
        showBack={false}
        showNotification={true}
        notificationCount={unreadCount}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />


      {/* Résumé financier */}
      <View style={styles.summary}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Montant Total Project</Text>
          <Text style={styles.summaryValue}>
            {mobileInvoiceService.formatCurrency(dashboard?.totalProjectCost || 0)}
          </Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Montant Versé</Text>
          <Text style={[styles.summaryValue, styles.paidValue]}>
            {mobileInvoiceService.formatCurrency(dashboard?.totalPaid || 0)}
          </Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Reste à Payer</Text>
          <Text style={[styles.summaryValue, styles.remainingValue]}>
            {mobileInvoiceService.formatCurrency(dashboard?.totalRemaining || 0)}
          </Text>
        </Card>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          {[
            { key: 'overdue', label: 'Retards' },
            { key: 'history', label: 'Historique' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText
              ]}>
                {tab.label} ({getTabCount(tab.key as any)})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  summary: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  remainingValue: {
    color: '#F59E0B',
  },
  paidValue: {
    color: '#10B981',
  },
  tabsContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabs: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 8,
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  invoicesList: {
    flex: 1,
  },
  invoicesListContent: {
    padding: 16,
    paddingBottom: 32,
  },
  invoiceCard: {
    marginBottom: 12,
  },
  invoiceCardContent: {
    padding: 16,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  invoiceType: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  invoiceDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  invoiceDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  overdueText: {
    color: '#EF4444',
    fontWeight: '500',
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  amounts: {
    flex: 1,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  remainingAmount: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
  },
  invoiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  historyCard: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  historyCardWrapper: {
    marginBottom: 12,
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  historyContent: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  historyMethod: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  historyRef: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    fontStyle: 'italic',
  },
  viewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  viewBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3B82F6',
  },
});

export default ClientInvoicesScreen;