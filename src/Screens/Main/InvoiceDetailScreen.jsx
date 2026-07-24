import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ShieldCheck
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

const InvoiceDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userToken } = useContext(AuthContext);
  
  const { invoiceId, invoice: initialInvoice } = route.params || {};

  const [invoiceData, setInvoiceData] = useState(initialInvoice || null);
  const [loading, setLoading] = useState(!initialInvoice?.InvoiceLineItems);
  const [error, setError] = useState(null);

  const fetchInvoiceDetail = async () => {
    if (!invoiceId && !initialInvoice?.id) return;
    const targetId = invoiceId || initialInvoice.id;
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 [INVOICE FETCH] Fetching invoice details for ID:', targetId);
      const res = await api.getInvoiceById(userToken, targetId);
      
      console.log('🧾 [INVOICE DETAILS RESPONSE]:', JSON.stringify(res, null, 2));

      if (res && res.success && res.data) {
        setInvoiceData(res.data);
      } else if (res && (res.id || res.totalAmount)) {
        setInvoiceData(res);
      } else {
        // Fallback to initial passed invoice if response doesn't wrap data expectedly
        if (initialInvoice) setInvoiceData(initialInvoice);
      }
    } catch (err) {
      console.error('❌ Error fetching invoice detail:', err);
      setError(err.message || 'Failed to load invoice details');
      if (initialInvoice) setInvoiceData(initialInvoice);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceDetail();
  }, [invoiceId]);

  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return `₹${num.toFixed(2)}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return { label: 'PAID', bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
      case 'partially_paid':
        return { label: 'PARTIALLY PAID', bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' };
      default:
        return { label: 'PENDING', bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
    }
  };

  const statusInfo = getStatusBadge(invoiceData?.status);
  const lineItems = invoiceData?.InvoiceLineItems || invoiceData?.lineItems || [];
  const totalAmount = parseFloat(invoiceData?.totalAmount || 0);
  const amountPaid = parseFloat(invoiceData?.amountPaid || 0);
  const balanceDue = totalAmount - amountPaid;

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice Details</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading invoice details...</Text>
        </View>
      ) : !invoiceData ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={48} color={COLORS.danger} style={{ marginBottom: 12 }} />
          <Text style={styles.errorText}>Invoice not found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Direct Full-Screen Invoice Document */}
          <View style={styles.invoiceContainer}>
            
            {/* Top Branding & Status Banner */}
            <View style={styles.paperTopRow}>
              <View>
                <View style={styles.logoRow}>
                  <FileText size={22} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.brandTitle}>INVOICE</Text>
                </View>
                <Text style={styles.invoiceIdText}>
                  #{String(invoiceData.id || '').substring(0, 8).toUpperCase()}
                </Text>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg, borderColor: statusInfo.border }]}>
                <Text style={[styles.statusBadgeText, { color: statusInfo.text }]}>
                  {statusInfo.label}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Dates & Billing Info Grid */}
            <View style={styles.metaGrid}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Date Issued</Text>
                <Text style={styles.metaValue}>
                  {invoiceData.created_at ? new Date(invoiceData.created_at).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
              
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Billing Period</Text>
                <Text style={styles.metaValue}>
                  {invoiceData.periodStart && invoiceData.periodEnd ? (
                    `${invoiceData.periodStart} to ${invoiceData.periodEnd}`
                  ) : 'Monthly'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Customer Information (Billed To) */}
            <View style={styles.billedToContainer}>
              <Text style={styles.sectionHeader}>BILLED TO</Text>
              <Text style={styles.customerName}>{invoiceData.Customer?.name || 'Customer'}</Text>
              
              {invoiceData.Customer?.phone && (
                <View style={styles.infoRow}>
                  <Phone size={14} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={styles.infoText}>{invoiceData.Customer.phone}</Text>
                </View>
              )}
              
              {invoiceData.Customer?.address && (
                <View style={styles.infoRow}>
                  <MapPin size={14} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={styles.infoText}>{invoiceData.Customer.address}</Text>
                </View>
              )}
            </View>

            {/* Line Items Table */}
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableColHeader, { flex: 2 }]}>ITEM / DESCRIPTION</Text>
                <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'right' }]}>AMOUNT</Text>
              </View>

              {lineItems.length === 0 ? (
                <View style={styles.tableRowEmpty}>
                  <Text style={styles.emptyTableText}>Water Supply Delivery Charge</Text>
                  <Text style={styles.emptyTableAmount}>{formatCurrency(totalAmount)}</Text>
                </View>
              ) : (
                lineItems.map((item, idx) => (
                  <View key={idx} style={[styles.tableRow, idx === lineItems.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={[styles.tableCellDesc, { flex: 2 }]}>
                      {item.description || 'Water Delivery'}
                    </Text>
                    <Text style={[styles.tableCellAmount, { flex: 1, textAlign: 'right' }]}>
                      {formatCurrency(item.amount)}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* Financial Totals Breakdown */}
            <View style={styles.totalsContainer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Amount Paid</Text>
                <Text style={[styles.totalValue, { color: COLORS.success }]}>{formatCurrency(amountPaid)}</Text>
              </View>

              <View style={[styles.totalRow, styles.balanceDueRow]}>
                <Text style={styles.balanceDueLabel}>Balance Due</Text>
                <Text style={[styles.balanceDueValue, { color: balanceDue > 0 ? COLORS.danger : COLORS.success }]}>
                  {formatCurrency(balanceDue)}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPlaceholder,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Geologica-Bold',
    color: COLORS.danger,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  invoiceContainer: {
    backgroundColor: '#FFFFFF',
  },
  paperTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 22,
    fontFamily: 'Geologica-Bold',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  invoiceIdText: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: 'Geologica-Bold',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },

  // Meta Grid
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 13,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },

  // Billed To
  billedToContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  customerName: {
    fontSize: 17,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
  },

  // Line Items Table
  tableContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 20,
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableColHeader: {
    fontSize: 11,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textSecondary,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableCellDesc: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPrimary,
  },
  tableCellAmount: {
    fontSize: 13,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },
  tableRowEmpty: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  emptyTableText: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPrimary,
  },
  emptyTableAmount: {
    fontSize: 13,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },

  // Totals breakdown
  totalsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
  },
  totalValue: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },
  balanceDueRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginBottom: 0,
  },
  balanceDueLabel: {
    fontSize: 15,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },
  balanceDueValue: {
    fontSize: 18,
    fontFamily: 'Geologica-Bold',
  },

  // Footer
  receiptFooter: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Geologica-Bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  footerSubtext: {
    fontSize: 10,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPlaceholder,
  },
});

export default InvoiceDetailScreen;
