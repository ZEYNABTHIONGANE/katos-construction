import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from './ui/Card';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { EmptyState } from './ui/EmptyState';
import { mobileInvoiceService, type MobilePaymentDashboard } from '../services/mobileInvoiceService';

interface PaymentDashboardProps {
  clientId: string;
  onInvoicePress?: (invoiceId: string) => void;
  onPaymentPress?: (paymentId: string) => void;
}

export const PaymentDashboard: React.FC<PaymentDashboardProps> = ({
  clientId,
  onInvoicePress,
  onPaymentPress
}) => {
  const [dashboard, setDashboard] = useState<MobilePaymentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, [clientId]);

  const loadDashboard = async () => {
    try {
      setError(null);
      const data = await mobileInvoiceService.getMobilePaymentDashboard(clientId);
      setDashboard(data);
    } catch (err) {
      console.error('Erreur lors du chargement du dashboard:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const getProgressColor = (progress: number): readonly [string, string] => {
    if (progress >= 80) return ['#10B981', '#34D399'] as const; // green
    if (progress >= 50) return ['#F59E0B', '#FCD34D'] as const; // yellow
    return ['#EF4444', '#F87171'] as const; // red
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <Text style={styles.loadingText}>Chargement des informations de paiement...</Text>
      </View>
    );
  }

  if (error || !dashboard) {
    return (
      <EmptyState
        icon="card-outline"
        title="Erreur de chargement"
        description={error || "Impossible de charger les informations de paiement"}
        actionText="Réessayer"
        onAction={loadDashboard}
      />
    );
  }

  const progressColors = getProgressColor(dashboard.paymentProgress);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* En-tête avec vue d'ensemble */}
      <LinearGradient
        colors={progressColors}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Situation financière</Text>
          <Text style={styles.progressText}>{dashboard.paymentProgress}% payé</Text>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${dashboard.paymentProgress}%` }]} />
          </View>

          <View style={styles.amountRow}>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Total projet</Text>
              <Text style={styles.amountValue}>
                {mobileInvoiceService.formatCurrency(dashboard.totalProjectCost)}
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Restant</Text>
              <Text style={styles.amountValue}>
                {mobileInvoiceService.formatCurrency(dashboard.totalRemaining)}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Prochaine échéance */}
      {dashboard.nextPaymentDue && (
        <Card style={styles.nextPaymentCard}>
          <View style={styles.nextPaymentHeader}>
            <Ionicons
              name={dashboard.nextPaymentDue.isOverdue ? "alert-circle" : "time-outline"}
              size={24}
              color={dashboard.nextPaymentDue.isOverdue ? "#EF4444" : "#F59E0B"}
            />
            <Text style={styles.nextPaymentTitle}>
              {dashboard.nextPaymentDue.isOverdue ? "Échéance dépassée" : "Prochaine échéance"}
            </Text>
          </View>

          <Text style={styles.nextPaymentAmount}>
            {mobileInvoiceService.formatCurrency(dashboard.nextPaymentDue.amount)}
          </Text>

          <Text style={[
            styles.nextPaymentDate,
            dashboard.nextPaymentDue.isOverdue && styles.overdueDate
          ]}>
            Facture {dashboard.nextPaymentDue.invoiceNumber} • {' '}
            {mobileInvoiceService.formatDate(dashboard.nextPaymentDue.dueDate)}
          </Text>
        </Card>
      )}

      {/* Statistiques rapides */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Ionicons name="document-text-outline" size={24} color="#3B82F6" />
          <Text style={styles.statNumber}>{dashboard.totalInvoices}</Text>
          <Text style={styles.statLabel}>Factures totales</Text>
        </Card>

        <Card style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
          <Text style={styles.statNumber}>{dashboard.paidInvoices}</Text>
          <Text style={styles.statLabel}>Factures payées</Text>
        </Card>

        <Card style={styles.statCard}>
          <Ionicons name="time-outline" size={24} color="#F59E0B" />
          <Text style={styles.statNumber}>{dashboard.pendingInvoices}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </Card>

        {dashboard.overdueInvoices > 0 && (
          <Card style={styles.statCard}>
            <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
            <Text style={styles.statNumber}>{dashboard.overdueInvoices}</Text>
            <Text style={styles.statLabel}>En retard</Text>
          </Card>
        )}
      </View>

      {/* Factures récentes */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Factures récentes</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {dashboard.recentInvoices.length === 0 ? (
          <Text style={styles.emptyText}>Aucune facture récente</Text>
        ) : (
          dashboard.recentInvoices.map((invoice) => (
            <TouchableOpacity
              key={invoice.id}
              style={styles.invoiceItem}
              onPress={() => onInvoicePress?.(invoice.id!)}
            >
              <View style={styles.invoiceIcon}>
                <Ionicons
                  name="document-text"
                  size={20}
                  color={mobileInvoiceService.getStatusColor(invoice.paymentStatus)}
                />
              </View>

              <View style={styles.invoiceContent}>
                <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
                <Text style={styles.invoiceDescription}>
                  {mobileInvoiceService.getTypeLabel(invoice.type)}
                </Text>
                <Text style={styles.invoiceDate}>
                  {mobileInvoiceService.formatRelativeDate(invoice.issueDate)}
                </Text>
              </View>

              <View style={styles.invoiceAmount}>
                <Text style={styles.invoiceTotal}>
                  {mobileInvoiceService.formatCurrency(invoice.totalAmount)}
                </Text>
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

              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))
        )}
      </Card>

      {/* Paiements récents */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Paiements récents</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {dashboard.recentPayments.length === 0 ? (
          <Text style={styles.emptyText}>Aucun paiement récent</Text>
        ) : (
          dashboard.recentPayments.map((payment) => (
            <TouchableOpacity
              key={payment.id}
              style={styles.paymentItem}
              onPress={() => onPaymentPress?.(payment.id!)}
            >
              <View style={styles.paymentIcon}>
                <Ionicons name="card" size={20} color="#10B981" />
              </View>

              <View style={styles.paymentContent}>
                <Text style={styles.paymentAmount}>
                  {mobileInvoiceService.formatCurrency(payment.amount)}
                </Text>
                <Text style={styles.paymentMethod}>
                  {payment.method} {payment.reference && `• ${payment.reference}`}
                </Text>
                <Text style={styles.paymentDate}>
                  {mobileInvoiceService.formatRelativeDate(payment.date)}
                </Text>
              </View>

              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </TouchableOpacity>
          ))
        )}
      </Card>

      {/* Progression mensuelle */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Progression mensuelle</Text>

        <View style={styles.monthlyProgress}>
          {dashboard.monthlyProgress.map((month, index) => (
            <View key={index} style={styles.monthItem}>
              <Text style={styles.monthLabel}>{month.month}</Text>

              <View style={styles.monthBar}>
                <View style={styles.monthBarBg}>
                  <View
                    style={[
                      styles.monthBarFill,
                      {
                        width: month.target > 0
                          ? `${Math.min((month.paid / month.target) * 100, 100)}%`
                          : '0%',
                        backgroundColor: month.paid >= month.target ? '#10B981' : '#3B82F6'
                      }
                    ]}
                  />
                </View>
              </View>

              <Text style={styles.monthAmount}>
                {mobileInvoiceService.formatCurrency(month.paid)}
                {month.target > 0 && (
                  <Text style={styles.monthTarget}>
                    /{mobileInvoiceService.formatCurrency(month.target)}
                  </Text>
                )}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.bottomSpacing} />
    </ScrollView>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  amountItem: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  nextPaymentCard: {
    margin: 16,
    padding: 16,
  },
  nextPaymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nextPaymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  nextPaymentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  nextPaymentDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  overdueDate: {
    color: '#EF4444',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  sectionCard: {
    margin: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sectionLink: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  invoiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  invoiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  invoiceContent: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  invoiceDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  invoiceDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  invoiceAmount: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  invoiceTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentContent: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  paymentMethod: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  monthlyProgress: {
    marginTop: 12,
  },
  monthItem: {
    marginBottom: 16,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  monthBar: {
    marginBottom: 6,
  },
  monthBarBg: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  monthBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  monthAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  monthTarget: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#9CA3AF',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default PaymentDashboard;