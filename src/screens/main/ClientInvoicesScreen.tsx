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
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterModal } from '../../components/modals/FilterModal';
import {
  mobileInvoiceService,
  type MobileInvoice,
  type MobilePaymentHistory
} from '../../services/mobileInvoiceService';
import { useAuthContext } from '../../context/AuthContext';

export const ClientInvoicesScreen: React.FC = () => {
  const { user } = useAuthContext();
  const [invoices, setInvoices] = useState<MobileInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<MobileInvoice[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<MobilePaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    if (user?.clientId) {
      loadInvoices();
    }
  }, [user?.clientId]);

  useEffect(() => {
    filterInvoices();
  }, [invoices, activeTab]);

  const loadInvoices = async () => {
    if (!user?.clientId) return;

    try {
      setError(null);
      const [invoicesData, paymentsData] = await Promise.all([
        mobileInvoiceService.getClientInvoices(user.clientId),
        mobileInvoiceService.getClientPaymentHistory(user.clientId)
      ]);

      setInvoices(invoicesData);
      setPaymentHistory(paymentsData);
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
      case 'paid':
        return invoices.filter(inv => inv.paymentStatus === 'paid').length;
      case 'pending':
        return invoices.filter(inv => inv.paymentStatus === 'pending').length;
      case 'overdue':
        return invoices.filter(inv => inv.paymentStatus === 'overdue').length;
      default:
        return invoices.length;
    }
  };

  const handleInvoicePress = (invoice: MobileInvoice) => {
    // Navigation vers les détails de la facture
    // TODO: Implémenter la navigation
    console.log('Ouvrir facture:', invoice.id);
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
        <Text style={styles.loadingText}>Chargement des factures...</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes factures</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Résumé rapide */}
      <View style={styles.summary}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total des factures</Text>
          <Text style={styles.summaryValue}>{invoices.length}</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Montant total</Text>
          <Text style={styles.summaryValue}>
            {mobileInvoiceService.formatCurrency(
              invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
            )}
          </Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Restant à payer</Text>
          <Text style={[styles.summaryValue, styles.remainingValue]}>
            {mobileInvoiceService.formatCurrency(
              invoices.reduce((sum, inv) => sum + inv.remainingAmount, 0)
            )}
          </Text>
        </Card>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          {[
            { key: 'all', label: 'Toutes' },
            { key: 'pending', label: 'En attente' },
            { key: 'paid', label: 'Payées' },
            { key: 'overdue', label: 'En retard' }
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
        data={filteredInvoices}
        renderItem={renderInvoiceItem}
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
          // TODO: Implémenter les filtres avancés
          console.log('Filtres appliqués:', filters);
          setShowFilterModal(false);
        }}
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
});

export default ClientInvoicesScreen;