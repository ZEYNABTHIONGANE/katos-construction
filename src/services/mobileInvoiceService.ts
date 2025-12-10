import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Types pour la facturation côté mobile
export interface MobileInvoice {
  id?: string;
  clientId: string;
  invoiceNumber: string;
  type: 'initial' | 'progress' | 'final' | 'additional';

  // Montants
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;

  // Statut
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';

  // Dates
  issueDate: Timestamp;
  dueDate: Timestamp;
  paidDate?: Timestamp;

  // Détails
  description: string;
  notes?: string;
  items: MobileInvoiceItem[];

  // Fichiers
  documentUrl?: string;
  attachments?: string[];

  // Métadonnées
  createdAt: Timestamp;
  sentAt?: Timestamp;
}

export interface MobileInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: 'materials' | 'labor' | 'equipment' | 'other';
}

export interface MobilePaymentHistory {
  id?: string;
  invoiceId: string;
  clientId: string;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'check' | 'mobile_money';
  reference?: string;
  date: Timestamp;
  notes?: string;
  receivedBy: string;
}

export interface MobilePaymentDashboard {
  // Vue d'ensemble financière
  totalProjectCost: number;
  totalPaid: number;
  totalRemaining: number;
  paymentProgress: number; // Pourcentage payé (0-100)

  // Factures
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;

  // Prochaines échéances
  nextPaymentDue?: {
    amount: number;
    dueDate: Timestamp;
    invoiceNumber: string;
    isOverdue: boolean;
  };

  // Activité récente
  recentInvoices: MobileInvoice[];
  recentPayments: MobilePaymentHistory[];

  // Résumé mensuel
  monthlyProgress: {
    month: string;
    paid: number;
    target: number;
  }[];

  lastUpdated: Timestamp;
}

export class MobileInvoiceService {
  private invoicesCollection = 'invoices';
  private paymentsCollection = 'paymentHistory';

  /**
   * Récupérer toutes les factures d'un client (côté mobile)
   */
  async getClientInvoices(clientId: string): Promise<MobileInvoice[]> {
    try {
      const q = query(
        collection(db, this.invoicesCollection),
        where('clientId', '==', clientId),
        where('status', '!=', 'draft'), // Ne pas afficher les brouillons côté mobile
        orderBy('status'),
        orderBy('issueDate', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MobileInvoice[];
    } catch (error) {
      console.error('Erreur lors de la récupération des factures:', error);
      throw error;
    }
  }

  /**
   * Écouter les factures en temps réel (pour notifications)
   */
  subscribeToClientInvoices(
    clientId: string,
    callback: (invoices: MobileInvoice[]) => void
  ): () => void {
    const q = query(
      collection(db, this.invoicesCollection),
      where('clientId', '==', clientId),
      where('status', '!=', 'draft'),
      orderBy('status'),
      orderBy('issueDate', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const invoices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MobileInvoice[];
      callback(invoices);
    });
  }

  /**
   * Récupérer une facture par ID
   */
  async getInvoiceById(invoiceId: string): Promise<MobileInvoice | null> {
    try {
      const docRef = doc(db, this.invoicesCollection, invoiceId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      } as MobileInvoice;
    } catch (error) {
      console.error('Erreur lors de la récupération de la facture:', error);
      return null;
    }
  }

  /**
   * Récupérer l'historique des paiements d'un client
   */
  async getClientPaymentHistory(clientId: string): Promise<MobilePaymentHistory[]> {
    try {
      const q = query(
        collection(db, this.paymentsCollection),
        where('clientId', '==', clientId),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MobilePaymentHistory[];
    } catch (error) {
      console.error('Erreur lors de la récupération des paiements:', error);
      throw error;
    }
  }

  /**
   * Construire le dashboard de paiement pour mobile
   */
  async getMobilePaymentDashboard(clientId: string): Promise<MobilePaymentDashboard> {
    try {
      const [invoices, payments] = await Promise.all([
        this.getClientInvoices(clientId),
        this.getClientPaymentHistory(clientId)
      ]);

      // Calculs principaux
      const totalProjectCost = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const totalRemaining = totalProjectCost - totalPaid;
      const paymentProgress = totalProjectCost > 0 ? Math.round((totalPaid / totalProjectCost) * 100) : 0;

      // Compteurs de factures
      const paidInvoices = invoices.filter(inv => inv.paymentStatus === 'paid').length;
      const pendingInvoices = invoices.filter(inv => inv.paymentStatus === 'pending').length;
      const overdueInvoices = invoices.filter(inv => inv.paymentStatus === 'overdue').length;

      // Prochaine échéance
      const now = new Date();
      const unpaidInvoices = invoices.filter(inv =>
        inv.paymentStatus !== 'paid' && inv.status !== 'cancelled'
      );

      let nextPaymentDue;
      if (unpaidInvoices.length > 0) {
        // Trier par date d'échéance
        const sortedUnpaid = unpaidInvoices.sort((a, b) =>
          a.dueDate.toDate().getTime() - b.dueDate.toDate().getTime()
        );

        const nextInvoice = sortedUnpaid[0];
        nextPaymentDue = {
          amount: nextInvoice.remainingAmount,
          dueDate: nextInvoice.dueDate,
          invoiceNumber: nextInvoice.invoiceNumber,
          isOverdue: nextInvoice.dueDate.toDate() < now
        };
      }

      // Progression mensuelle (6 derniers mois)
      const monthlyProgress = this.calculateMonthlyProgress(payments, invoices);

      return {
        totalProjectCost,
        totalPaid,
        totalRemaining,
        paymentProgress,
        totalInvoices: invoices.length,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        nextPaymentDue,
        recentInvoices: invoices.slice(0, 3),
        recentPayments: payments.slice(0, 3),
        monthlyProgress,
        lastUpdated: Timestamp.now()
      };
    } catch (error) {
      console.error('Erreur lors de la création du dashboard:', error);
      throw error;
    }
  }

  /**
   * Calculer la progression mensuelle des paiements
   */
  private calculateMonthlyProgress(
    payments: MobilePaymentHistory[],
    invoices: MobileInvoice[]
  ): { month: string; paid: number; target: number; }[] {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthPayments = payments.filter(payment => {
        const paymentDate = payment.date.toDate();
        return paymentDate >= monthDate && paymentDate < nextMonth;
      });

      const monthInvoices = invoices.filter(invoice => {
        const invoiceDate = invoice.dueDate.toDate();
        return invoiceDate >= monthDate && invoiceDate < nextMonth;
      });

      const paid = monthPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const target = monthInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);

      months.push({
        month: monthDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        paid,
        target
      });
    }

    return months;
  }

  /**
   * Obtenir les factures par statut
   */
  async getInvoicesByStatus(
    clientId: string,
    status: MobileInvoice['paymentStatus']
  ): Promise<MobileInvoice[]> {
    const invoices = await this.getClientInvoices(clientId);
    return invoices.filter(invoice => invoice.paymentStatus === status);
  }

  /**
   * Obtenir les factures en retard
   */
  async getOverdueInvoices(clientId: string): Promise<MobileInvoice[]> {
    const invoices = await this.getClientInvoices(clientId);
    const now = new Date();

    return invoices.filter(invoice =>
      invoice.paymentStatus !== 'paid' &&
      invoice.status !== 'cancelled' &&
      invoice.dueDate.toDate() < now
    );
  }

  /**
   * Calculer les statistiques rapides pour un widget
   */
  async getQuickStats(clientId: string): Promise<{
    totalDue: number;
    nextPaymentAmount: number;
    daysUntilNextPayment: number;
    paymentProgress: number;
  }> {
    try {
      const dashboard = await this.getMobilePaymentDashboard(clientId);

      let daysUntilNextPayment = 0;
      if (dashboard.nextPaymentDue) {
        const now = new Date();
        const dueDate = dashboard.nextPaymentDue.dueDate.toDate();
        const timeDiff = dueDate.getTime() - now.getTime();
        daysUntilNextPayment = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      }

      return {
        totalDue: dashboard.totalRemaining,
        nextPaymentAmount: dashboard.nextPaymentDue?.amount || 0,
        daysUntilNextPayment,
        paymentProgress: dashboard.paymentProgress
      };
    } catch (error) {
      console.error('Erreur lors du calcul des stats rapides:', error);
      return {
        totalDue: 0,
        nextPaymentAmount: 0,
        daysUntilNextPayment: 0,
        paymentProgress: 0
      };
    }
  }

  /**
   * Utilitaires pour l'affichage mobile
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount) + ' FCFA';
  }

  getStatusColor(status: MobileInvoice['paymentStatus']): string {
    const colors = {
      paid: '#10B981', // green
      pending: '#F59E0B', // yellow
      partial: '#6366F1', // indigo
      overdue: '#EF4444' // red
    };
    return colors[status] || colors.pending;
  }

  getStatusLabel(status: MobileInvoice['paymentStatus']): string {
    const labels = {
      paid: 'Payée',
      pending: 'En attente',
      partial: 'Partiellement payée',
      overdue: 'En retard'
    };
    return labels[status] || labels.pending;
  }

  getTypeLabel(type: MobileInvoice['type']): string {
    const labels = {
      initial: 'Facture initiale',
      progress: 'Facture d\'avancement',
      final: 'Facture finale',
      additional: 'Facture supplémentaire'
    };
    return labels[type] || labels.initial;
  }

  formatDate(timestamp: Timestamp): string {
    const date = timestamp.toDate();
    return date.toLocaleDateString('fr-FR');
  }

  formatRelativeDate(timestamp: Timestamp): string {
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Aujourd\'hui';
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)} semaines`;

    return date.toLocaleDateString('fr-FR');
  }

  isDueToday(dueDate: Timestamp): boolean {
    const today = new Date();
    const due = dueDate.toDate();

    return today.toDateString() === due.toDateString();
  }

  isDueSoon(dueDate: Timestamp, days: number = 7): boolean {
    const now = new Date();
    const due = dueDate.toDate();
    const timeDiff = due.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    return daysDiff > 0 && daysDiff <= days;
  }

  isOverdue(dueDate: Timestamp): boolean {
    const now = new Date();
    const due = dueDate.toDate();

    return due < now;
  }
}

export const mobileInvoiceService = new MobileInvoiceService();