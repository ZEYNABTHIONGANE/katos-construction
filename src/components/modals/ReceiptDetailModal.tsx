import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Platform,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { mobileInvoiceService, type MobilePaymentHistory } from '../../services/mobileInvoiceService';

const { width } = Dimensions.get('window');

interface ReceiptDetailModalProps {
    isVisible: boolean;
    onClose: () => void;
    payment: MobilePaymentHistory | null;
    clientName: string;
}

export const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({
    isVisible,
    onClose,
    payment,
    clientName
}) => {
    if (!payment) return null;

    const handlePrint = async () => {
        try {
            const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica'; padding: 20px; color: #333; }
              .header { border-bottom: 2px solid #2B2E83; padding-bottom: 10px; margin-bottom: 20px; }
              .title { color: #2B2E83; font-size: 24px; font-weight: bold; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
              .label { color: #666; font-size: 14px; }
              .value { font-weight: bold; font-size: 16px; }
              .amount-box { background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
              .amount { font-size: 32px; color: #3B82F6; font-weight: bold; }
              .footer { text-align: center; font-size: 12px; color: #999; margin-top: 40px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">KATOS CONSTRUCTION</div>
              <div style="font-size: 12px; margin-top: 5px;">Reçu de Paiement Personnel</div>
            </div>
            
            <div class="info-row">
              <div>
                <div class="label">Date</div>
                <div class="value">${mobileInvoiceService.formatDate(payment.date)}</div>
              </div>
              <div style="text-align: right;">
                <div class="label">Référence</div>
                <div class="value">${payment.reference || 'N/A'}</div>
              </div>
            </div>

            <div class="info-row" style="margin-top: 20px;">
              <div>
                <div class="label">Client</div>
                <div class="value">${clientName}</div>
              </div>
            </div>

            <div class="amount-box">
              <div class="label">MONTANT PAYÉ</div>
              <div class="amount">${mobileInvoiceService.formatCurrency(payment.amount)}</div>
              <div class="label" style="margin-top: 10px;">Méthode: ${payment.method}</div>
            </div>

            <div style="margin-top: 30px;">
              <div class="label">Notes</div>
              <div class="value">${payment.notes || 'Paiement de facture'}</div>
            </div>

            <div class="footer">
              <p>Merci de votre confiance.</p>
              <p>Katos Construction - Abidjan, Côte d'Ivoire</p>
            </div>
          </body>
        </html>
      `;

            if (Platform.OS === 'web') {
                // Simple print for web
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(html);
                    printWindow.document.close();
                    printWindow.print();
                }
            } else {
                const { uri } = await Print.printToFileAsync({ html });
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            }
        } catch (error) {
            console.error('Erreur lors de l\'impression:', error);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Aperçu du Reçu</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContent}>
                        <View style={styles.receiptContainer}>
                            <View style={styles.brandContainer}>
                                <Text style={styles.brandName}>KATOS CONSTRUCTION</Text>
                                <Text style={styles.receiptLabel}>REÇU DE PAIEMENT</Text>
                            </View>

                            <View style={styles.detailsGrid}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Client</Text>
                                    <Text style={styles.detailValue}>{clientName}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Date</Text>
                                    <Text style={styles.detailValue}>
                                        {mobileInvoiceService.formatDate(payment.date)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.amountContainer}>
                                <Text style={styles.amountLabel}>Montant Payé</Text>
                                <Text style={styles.amountValue}>
                                    {mobileInvoiceService.formatCurrency(payment.amount)}
                                </Text>
                                <Text style={styles.methodText}>
                                    Méthode: <Text style={styles.methodHighlight}>{payment.method}</Text>
                                </Text>
                            </View>

                            {payment.reference && (
                                <View style={styles.infoSection}>
                                    <Text style={styles.infoLabel}>Référence de transaction</Text>
                                    <Text style={styles.infoValue}>{payment.reference}</Text>
                                </View>
                            )}

                            <View style={styles.infoSection}>
                                <Text style={styles.infoLabel}>Notes</Text>
                                <Text style={styles.infoValue}>
                                    {payment.notes || "Paiement enregistré dans l'historique."}
                                </Text>
                            </View>

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>
                                    Ce document est un reçu de paiement électronique.
                                </Text>
                                <Text style={styles.footerBrand}>Katos Construction</Text>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>Fermer</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.printButton]}
                            onPress={handlePrint}
                        >
                            <Ionicons name="download-outline" size={20} color="white" />
                            <Text style={styles.printButtonText}>Télécharger PDF</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        width: width * 0.9,
        maxHeight: '85%',
        backgroundColor: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#F9FAFB',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    scrollContent: {
        padding: 20,
    },
    receiptContainer: {
        padding: 10,
    },
    brandContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    brandName: {
        fontSize: 22,
        fontWeight: '900',
        color: '#2B2E83',
        letterSpacing: 1,
    },
    receiptLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
        fontWeight: '500',
        letterSpacing: 2,
    },
    detailsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F3F4F6',
        paddingVertical: 16,
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
    },
    amountContainer: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
    },
    amountLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 8,
    },
    amountValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#3B82F6',
    },
    methodText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 12,
    },
    methodHighlight: {
        color: '#4B5563',
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    infoSection: {
        marginBottom: 16,
    },
    infoLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 14,
        color: '#4B5563',
    },
    footer: {
        marginTop: 32,
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    footerText: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    footerBrand: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#E96C2E',
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 12,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    cancelButton: {
        backgroundColor: '#F3F4F6',
    },
    cancelButtonText: {
        color: '#4B5563',
        fontWeight: '600',
    },
    printButton: {
        backgroundColor: '#2B2E83',
    },
    printButtonText: {
        color: 'white',
        fontWeight: '600',
    },
});
