import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
  Linking,
} from 'react-native';
import RNPrint from 'react-native-print';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  FileText,
  Phone,
  MapPin,
  AlertCircle,
  CreditCard,
  MessageCircle,
  Printer,
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
  const [loading, setLoading] = useState(!initialInvoice?.Deliveries && !initialInvoice?.InvoiceLineItems);
  const [error, setError] = useState(null);

  const fetchInvoiceDetail = async () => {
    if (!invoiceId && !initialInvoice?.id) return;
    const targetId = invoiceId || initialInvoice.id;
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 [INVOICE FETCH] Fetching invoice details for ID:', targetId);
      const res = await api.getInvoiceById(userToken, targetId);
      console.log('🧾 [INVOICE DETAILS RESPONSE]:', res);

      if (res && res.success && res.data) {
        setInvoiceData(res.data);
      } else if (res && (res.id || res.totalAmount)) {
        setInvoiceData(res);
      } else {
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

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const str = String(dateStr).split('T')[0];
    const parts = str.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = String(parts[1]).padStart(2, '0');
      const day = String(parseInt(parts[2], 10)).padStart(2, '0');
      return `${day}-${month}-${year}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return { label: 'PAID', bg: '#ECFDF5', text: '#129c00ff' };
      case 'partially_paid':
        return { label: 'PARTIALLY\nPAID', bg: '#EFF6FF', text: '#1D4ED8' };
      default:
        return { label: 'UNPAID', bg: '#FEF2F2', text: '#980000ff' };
    }
  };

  const getProductName = (item) => {
    if (item.Subscription?.Product?.name) return item.Subscription.Product.name;
    if (item.Product?.name) return item.Product.name;
    if (item.productName) return item.productName;
    if (item.name) return item.name;
    if (item.description && !item.description.includes('Water Delivery') && !item.description.includes('Delivery Charge')) {
      return item.description;
    }
    return 'Water Camper 20Ltr';
  };

  const getSubOrOrderTag = (item) => {
    if (item.Subscription?.recurrencePattern) {
      const pattern = item.Subscription.recurrencePattern;
      if (pattern === 'daily') return 'Daily Subscription';
      if (pattern === 'weekly') return 'Weekly Subscription';
      if (pattern === 'alternate_days' || pattern === 'alternate') return 'Alternate Days Sub';
      return `${pattern} Sub`;
    }
    if (item.subscriptionId || item.subscription_id) return 'Subscription Delivery';
    if (item.oneTimeOrderId || item.oneTimeOrderItemId) return 'One-Time Order';
    return 'Water Supply';
  };

  const statusInfo = getStatusBadge(invoiceData?.status);
  const deliveries = invoiceData?.Deliveries || invoiceData?.deliveries || [];
  const lineItems = invoiceData?.InvoiceLineItems || invoiceData?.lineItems || [];
  
  const totalAmount = parseFloat(invoiceData?.totalAmount || 0);
  const amountPaid = parseFloat(invoiceData?.amountPaid || 0);
  const balanceDue = Math.max(0, totalAmount - amountPaid);

  const invoiceNum = invoiceData?.invoiceNumber || (invoiceData?.id ? `#${String(invoiceData.id).substring(0, 8).toUpperCase()}` : 'INV-001');

  const handleWhatsAppShare = async () => {
    try {
      const customerName = invoiceData?.Customer?.name || 'Customer';
      let message = `*INVOICE ${invoiceNum}*\n`;
      message += `Date: ${formatDate(invoiceData?.created_at)}\n`;
      message += `Customer: ${customerName}\n\n`;
      message += `*Items:*\n`;
      
      const allItems = deliveries.length > 0 ? deliveries : lineItems;
      if (allItems.length > 0) {
        allItems.forEach(item => {
          const qty = item.fullUnitsDelivered || item.quantity || 1;
          const rate = item.unitPriceCharged || item.unitPrice || item.amount || 0;
          message += `- ${getProductName(item)} (x${qty}) = ${formatCurrency(rate * qty)}\n`;
        });
      } else {
        message += `- Water Camper 20Ltr = ${formatCurrency(totalAmount)}\n`;
      }
      
      message += `\n*Total:* ${formatCurrency(totalAmount)}\n`;
      message += `*Paid:* ${formatCurrency(amountPaid)}\n`;
      message += `*Balance Due: ${formatCurrency(balanceDue)}*\n\n`;
      message += `Thank you for your business!`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `whatsapp://send?text=${encodedMessage}`;
      
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Share.share({ message });
      }
    } catch (error) {
      console.error('Error sharing invoice:', error);
    }
  };

  const handlePrint = async () => {
    try {
      const customerName = invoiceData?.Customer?.name || 'Customer';
      let itemsHtml = '';
      const allItems = deliveries.length > 0 ? deliveries : lineItems;
      
      if (allItems.length > 0) {
        allItems.forEach(item => {
          const qty = item.fullUnitsDelivered || item.quantity || 1;
          const rate = item.unitPriceCharged || item.unitPrice || item.amount || 0;
          itemsHtml += `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${getProductName(item)}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #475569;">${qty}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #0f172a; font-weight: bold;">${formatCurrency(rate * qty)}</td>
            </tr>
          `;
        });
      } else {
        itemsHtml += `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">Water Camper 20Ltr</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #475569;">1</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #0f172a; font-weight: bold;">${formatCurrency(totalAmount)}</td>
          </tr>
        `;
      }

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif; padding: 40px; color: #333; }
              .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
              .title { font-size: 24px; font-weight: bold; color: #1e3a8a; letter-spacing: 0.5px; }
              .subtitle { font-size: 16px; color: #64748b; margin-top: 5px; }
              .details { margin-bottom: 40px; line-height: 1.6; display: flex; justify-content: space-between; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
              th { padding: 12px; border-bottom: 2px solid #cbd5e1; text-align: left; color: #64748b; font-size: 14px; text-transform: uppercase; }
              th:nth-child(2) { text-align: center; }
              th:nth-child(3) { text-align: right; }
              .totals { margin-left: auto; width: 300px; text-align: right; font-size: 16px; line-height: 2; }
              .totals-row { display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding: 5px 0; }
              .balance { font-size: 20px; font-weight: bold; color: #0f172a; background-color: #f8fafc; padding: 10px; border-radius: 8px; margin-top: 10px; display: flex; justify-content: space-between; }
              .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">Invoice</div>
              <div class="subtitle">${invoiceNum}</div>
            </div>
            
            <div class="details">
              <div>
                <strong style="color:#475569">Billed To:</strong><br>
                <span style="font-size:18px; color:#0f172a; font-weight:bold;">${customerName}</span>
              </div>
              <div style="text-align:right">
                <strong style="color:#475569">Date:</strong><br>
                <span style="font-size:16px; color:#0f172a;">${formatDate(invoiceData?.created_at)}</span>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div class="totals">
              <div class="totals-row"><span>Subtotal:</span> <span>${formatCurrency(totalAmount)}</span></div>
              <div class="totals-row"><span>Amount Paid:</span> <span>${formatCurrency(amountPaid)}</span></div>
              <div class="balance"><span>Balance Due:</span> <span>${formatCurrency(balanceDue)}</span></div>
            </div>
            
            <div class="footer">
              <strong>Thank you for your business!</strong><br>
              Computer generated tax invoice. No signature required.
            </div>
          </body>
        </html>
      `;

      await RNPrint.print({ html: htmlContent });
    } catch (error) {
      console.error('Error printing invoice:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tax Invoice</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading invoice...</Text>
        </View>
      ) : !invoiceData ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={48} color={COLORS.danger} style={{ marginBottom: 12 }} />
          <Text style={styles.errorText}>Invoice not found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Top Title & Status Header */}
          <View style={styles.topRow}>
            <View>
              <View style={styles.brandRow}>
                <FileText size={22} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.brandTitle}>TAX INVOICE</Text>
              </View>
              <Text style={styles.invoiceNumText}>{invoiceNum}</Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusInfo.text }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Customer & Invoice Meta Details */}
          <View style={styles.metaSection}>
            <View style={styles.metaRowGroup}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.sectionLabel}>BILLED TO</Text>
                <Text style={styles.customerName}>{invoiceData.Customer?.name || 'Customer'}</Text>
                {!!invoiceData.Customer?.phone && (
                  <View style={styles.infoRow}>
                    <Phone size={13} color={COLORS.textSecondary} style={{ marginRight: 5 }} />
                    <Text style={styles.infoText}>{invoiceData.Customer.phone}</Text>
                  </View>
                )}
                {!!invoiceData.Customer?.address && (
                  <View style={styles.infoRow}>
                    <MapPin size={13} color={COLORS.textSecondary} style={{ marginRight: 5 }} />
                    <Text style={styles.infoText}>{invoiceData.Customer.address}</Text>
                  </View>
                )}
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.sectionLabel}>DATE ISSUED</Text>
                <Text style={styles.metaValueText}>{formatDate(invoiceData.created_at)}</Text>
              </View>
            </View>

            {/* Billing Period Row */}
            <View style={styles.periodRow}>
              <Text style={styles.sectionLabel}>BILLING PERIOD</Text>
              <Text style={styles.periodValueText}>
                {invoiceData.periodStart && invoiceData.periodEnd
                  ? `${formatDate(invoiceData.periodStart)}  to  ${formatDate(invoiceData.periodEnd)}`
                  : 'Monthly'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Deliveries & Items Section Header */}
          <View style={styles.itemsHeaderRow}>
            <Text style={styles.itemsHeaderTitle}>
              DELIVERIES ({deliveries.length > 0 ? deliveries.length : lineItems.length})
            </Text>
            <Text style={styles.itemsHeaderTotalLabel}>TOTAL</Text>
          </View>

          {/* Items List */}
          {deliveries.length > 0 ? (
            deliveries.map((item, idx) => {
              const qty = parseInt(item.fullUnitsDelivered) || 1;
              const rate = parseFloat(item.unitPriceCharged || 0);
              const rowTotal = qty * rate;
              const prodName = getProductName(item);
              const subTag = getSubOrOrderTag(item);
              const dateFormatted = formatDate(item.deliveryDate);

              return (
                <View key={item.id || idx} style={styles.deliveryRow}>
                  <View style={styles.dateCol}>
                    <Text style={styles.dateText}>{dateFormatted}</Text>
                  </View>

                  <View style={styles.itemMainCol}>
                    <Text style={styles.productNameText}>{prodName}</Text>
                    <View style={styles.subTagRow}>
                      <Text style={styles.subTagText}>{subTag}</Text>
                      {item.emptyUnitsCollected > 0 && (
                        <Text style={styles.emptyCansText}>
                          • Returned {item.emptyUnitsCollected} empty
                        </Text>
                      )}
                    </View>
                    <Text style={styles.qtyPriceText}>
                      Qty: {qty}  ×  {formatCurrency(rate)}
                    </Text>
                  </View>

                  <View style={styles.amountCol}>
                    <Text style={styles.rowAmountText}>
                      {formatCurrency(rowTotal > 0 ? rowTotal : rate)}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : lineItems.length > 0 ? (
            lineItems.map((item, idx) => {
              const qty = item.quantity || 1;
              const rate = parseFloat(item.unitPrice || item.amount);
              const rowTotal = parseFloat(item.amount);
              const prodName = getProductName(item);
              const dateFormatted = formatDate(item.createdAt || invoiceData.created_at);

              return (
                <View key={idx} style={styles.deliveryRow}>
                  <View style={styles.dateCol}>
                    <Text style={styles.dateText}>{dateFormatted}</Text>
                  </View>

                  <View style={styles.itemMainCol}>
                    <Text style={styles.productNameText}>{prodName}</Text>
                    <Text style={styles.subTagText}>Subscription Item</Text>
                    <Text style={styles.qtyPriceText}>
                      Qty: {qty}  ×  {formatCurrency(rate)}
                    </Text>
                  </View>

                  <View style={styles.amountCol}>
                    <Text style={styles.rowAmountText}>{formatCurrency(rowTotal)}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.deliveryRow}>
              <View style={styles.itemMainCol}>
                <Text style={styles.productNameText}>Water Camper 20Ltr</Text>
              </View>
              <View style={styles.amountCol}>
                <Text style={styles.rowAmountText}>{formatCurrency(totalAmount)}</Text>
              </View>
            </View>
          )}

          <View style={styles.divider} />

          {/* Financial Totals */}
          <View style={styles.totalsBlock}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Amount Paid</Text>
              <Text style={[styles.totalValue, { color: COLORS.success }]}>{formatCurrency(amountPaid)}</Text>
            </View>

            <View style={[styles.totalRow, styles.balanceRow]}>
              <Text style={styles.balanceLabel}>Balance Due</Text>
              <Text style={[styles.balanceValue, { color: balanceDue > 0 ? COLORS.danger : COLORS.success }]}>
                {formatCurrency(balanceDue)}
              </Text>
            </View>
          </View>

          {/* Record Payment Action Button */}
          {invoiceData.status !== 'paid' && balanceDue > 0 && (
            <TouchableOpacity
              style={styles.payBtn}
              activeOpacity={0.85}
              onPress={() => {
                navigation.navigate('MainDrawer', {
                  screen: 'MainTabs',
                  params: {
                    screen: 'Payments',
                    params: { customerId: invoiceData.CustomerId || invoiceData.Customer?.id, prefillAmount: balanceDue }
                  }
                });
              }}
            >
              <CreditCard size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.payBtnText}>Record Payment ({formatCurrency(balanceDue)})</Text>
            </TouchableOpacity>
          )}

          {/* Action Buttons: WhatsApp & Print */}
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#Ecfdf5', borderColor: '#d1fae5' }]} 
              activeOpacity={0.7}
              onPress={handleWhatsAppShare}
            >
              <MessageCircle size={20} color="#059669" style={{ marginRight: 8 }} />
              <Text style={[styles.actionBtnText, { color: '#059669' }]}>WhatsApp</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }]} 
              activeOpacity={0.7}
              onPress={handlePrint}
            >
              <Printer size={20} color="#475569" style={{ marginRight: 8 }} />
              <Text style={[styles.actionBtnText, { color: '#475569' }]}>Print PDF</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Note */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Thank you for your business!</Text>
            <Text style={styles.footerSubtext}>Computer generated tax invoice. No signature required.</Text>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontFamily: 'Geologica-Bold',
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  invoiceNumText: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 9,
    fontFamily: 'Geologica-Bold',
    letterSpacing: 0.6,
    textAlign: 'right',
    lineHeight: 11,
  },

  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 18,
  },

  // Metadata Section
  metaSection: {
    gap: 12,
  },
  metaRowGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  customerName: {
    fontSize: 17,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
  },
  metaValueText: {
    fontSize: 13,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },
  periodRow: {
    marginTop: 2,
  },
  periodValueText: {
    fontSize: 13,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    marginTop: 2,
  },

  // Deliveries Table Section
  itemsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#0F172A',
    marginBottom: 4,
  },
  itemsHeaderTitle: {
    fontSize: 11,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },
  itemsHeaderTotalLabel: {
    fontSize: 11,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },

  // Structured Delivery Row
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  dateCol: {
    width: 90,
    paddingRight: 8,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },
  itemMainCol: {
    flex: 1,
    paddingRight: 8,
  },
  productNameText: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  subTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    flexWrap: 'wrap',
  },
  subTagText: {
    fontSize: 11,
    fontFamily: 'Geologica-Medium',
    color: COLORS.primary,
  },
  emptyCansText: {
    fontSize: 11,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
  },
  qtyPriceText: {
    fontSize: 11,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPlaceholder,
    marginTop: 4,
  },
  amountCol: {
    width: 75,
    alignItems: 'flex-end',
  },
  rowAmountText: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },

  // Totals Section
  totalsBlock: {
    marginTop: 4,
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
  balanceRow: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 0,
  },
  balanceLabel: {
    fontSize: 16,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },
  balanceValue: {
    fontSize: 20,
    fontFamily: 'Geologica-Bold',
  },

  // Record Payment Button
  payBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  payBtnText: {
    fontSize: 15,
    fontFamily: 'Geologica-Bold',
    color: '#FFFFFF',
  },

  // WhatsApp & Print Actions
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 14,
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
