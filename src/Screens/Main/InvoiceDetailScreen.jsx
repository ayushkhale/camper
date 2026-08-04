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
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import RNPrint from 'react-native-print';
import { generatePDF } from 'react-native-html-to-pdf';
import RNShare from 'react-native-share';
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
  ChevronLeft,
} from 'lucide-react-native';

const WhatsAppIcon = ({ size = 20, color = "#FFF", style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </Svg>
);

import CurvedHeader from '../../components/CurvedHeader';
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
  const [isDownloading, setIsDownloading] = useState(false);
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
    if (item.description?.toLowerCase().includes('opening balance')) return item.description;
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
    if (item.Subscription?.recurrencePattern || item.Subscription?.recurrence_pattern) {
      const pattern = item.Subscription.recurrencePattern || item.Subscription.recurrence_pattern;
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
  
  const previousDues = parseFloat(invoiceData?.previousDues || 0);
  const currentCharges = parseFloat(invoiceData?.totalAmount || 0);
  const amountPaid = parseFloat(invoiceData?.amountPaid || 0);
  
  const grandTotal = currentCharges + previousDues;
  const balanceDue = Math.max(0, grandTotal - amountPaid);

  const invoiceNum = invoiceData?.invoiceNumber || (invoiceData?.id ? `#${String(invoiceData.id).substring(0, 8).toUpperCase()}` : 'INV-001');

  const handleWhatsAppShare = async () => {
    try {
      const customerName = invoiceData?.customerName || invoiceData?.Customer?.name || 'Customer';
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

  const generateInvoiceHTML = () => {
      const customerName = invoiceData?.customerName || invoiceData?.Customer?.name || 'Customer';
      let itemsHtml = '';
      
      let allItems = deliveries.length > 0 ? deliveries : lineItems;
      const openingBalanceItem = lineItems.find(item => item.description?.toLowerCase().includes('opening balance'));
      if (deliveries.length > 0 && openingBalanceItem) {
        allItems = [openingBalanceItem, ...deliveries];
      }
      
      let renderedRows = 0;
      if (allItems.length > 0) {
        allItems.forEach((item, index) => {
          renderedRows++;
          const qty = item.fullUnitsDelivered || item.quantity || 1;
          const rate = item.unitPriceCharged || item.unitPrice || item.amount || 0;
          itemsHtml += `
            <tr>
              <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${index + 1}</td>
              <td style="border-right: 1px solid #000; padding: 4px;">${getProductName(item)}</td>
              <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${qty}</td>
              <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatCurrency(rate)}</td>
              <td style="padding: 4px; text-align: right;">${formatCurrency(rate * qty)}</td>
            </tr>
          `;
        });
      } else {
        renderedRows = 1;
        itemsHtml += `
          <tr>
            <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">1</td>
            <td style="border-right: 1px solid #000; padding: 4px;">Water Camper 20Ltr</td>
            <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">1</td>
            <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatCurrency(currentCharges)}</td>
            <td style="padding: 4px; text-align: right;">${formatCurrency(currentCharges)}</td>
          </tr>
        `;
      }
      
      const minRows = 15;
      const totalPages = Math.ceil(renderedRows / 25) || 1;
      
      if (renderedRows < minRows) {
        const rowsToAdd = minRows - renderedRows;
        for(let i = 0; i < rowsToAdd; i++) {
          itemsHtml += `
            <tr>
              <td style="border-right: 1px solid #000; padding: 4px; color: transparent;">-</td>
              <td style="border-right: 1px solid #000; padding: 4px; color: transparent;">-</td>
              <td style="border-right: 1px solid #000; padding: 4px; color: transparent;">-</td>
              <td style="border-right: 1px solid #000; padding: 4px; color: transparent;">-</td>
              <td style="padding: 4px; color: transparent;">-</td>
            </tr>
          `;
        }
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: Arial, Helvetica, sans-serif; 
                margin: 0; 
                padding: 0;
                color: #000; 
                font-size: 11px;
                background-color: #fff;
                counter-reset: page;
              }
              @page {
                size: A4;
                margin: 10mm;
              }
              .invoice-box {
                width: 100%;
                border: 1px solid #000;
                box-sizing: border-box;
              }
              tr { page-break-inside: avoid; }
              thead { display: table-header-group; }
              tfoot { display: table-footer-group; }
              .tax-title {
                text-align: center;
                font-weight: bold;
                font-size: 16px;
                padding: 5px;
                border-bottom: 1px solid #000;
                letter-spacing: 1px;
              }
              .info-grid {
                display: flex;
                border-bottom: 1px solid #000;
              }
              .info-left, .info-right {
                flex: 1;
                padding: 8px;
              }
              .info-left {
                border-right: 1px solid #000;
              }
              .info-block {
                margin-bottom: 10px;
              }
              .info-block strong {
                display: block;
                margin-bottom: 2px;
                font-size: 10px;
              }
              .customer-name {
                font-weight: bold;
                font-size: 13px;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
              }
              th { 
                border-bottom: 1px solid #000;
                border-right: 1px solid #000;
                padding: 6px 4px; 
                text-align: left; 
                font-weight: bold;
              }
              th:last-child {
                border-right: none;
              }
              th:nth-child(1) { text-align: center; width: 40px; }
              th:nth-child(3) { text-align: center; width: 60px; }
              th:nth-child(4) { text-align: right; width: 80px; }
              th:nth-child(5) { text-align: right; width: 100px; }
              
              .items-row {
                min-height: 200px; /* Force minimum height for tally look */
                vertical-align: top;
              }
              .items-row td {
                padding-bottom: 10px; /* Space out items */
              }
              
              .totals-section {
                border-top: 1px solid #000;
                display: flex;
              }
              .totals-left {
                flex: 1;
                border-right: 1px solid #000;
                padding: 8px;
              }
              .totals-right {
                width: 250px;
              }
              .total-row {
                display: flex;
                justify-content: space-between;
                padding: 4px 8px;
                border-bottom: 1px solid #ccc;
              }
              .total-row:last-child {
                border-bottom: none;
              }
              .total-row.bold {
                font-weight: bold;
                border-top: 1px solid #000;
                border-bottom: 1px solid #000;
                font-size: 12px;
                padding: 6px 8px;
              }
              .footer {
                text-align: center;
                font-size: 10px;
                border-top: 1px solid #000;
                padding: 8px 0;
                position: fixed;
                bottom: 5px;
                left: 10px;
                right: 10px;
                background-color: white;
              }
              .page-number::before {
                counter-increment: page;
                content: counter(page) "/${totalPages}";
              }
            </style>
          </head>
          <body>
            <div class="invoice-box">
              <div class="tax-title">TAX INVOICE</div>
              
              <div class="info-grid">
                <div class="info-left">
                  <div class="info-block">
                    <strong>Billed To:</strong>
                    <div class="customer-name">${customerName}</div>
                    ${invoiceData?.Customer?.phone ? `<div>Ph: ${invoiceData.Customer.phone}</div>` : ''}
                    ${invoiceData?.Customer?.address ? `<div>${invoiceData.Customer.address}</div>` : ''}
                  </div>
                </div>
                
                <div class="info-right">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <div>
                      <strong>Invoice No.</strong>
                      <div>${invoiceNum}</div>
                    </div>
                    <div style="text-align: right;">
                      <strong>Dated</strong>
                      <div>${formatDate(invoiceData?.created_at)}</div>
                    </div>
                  </div>
                  
                  <div style="margin-top: 15px;">
                    <strong>Billing Period</strong>
                    <div>
                      ${invoiceData?.periodStart && invoiceData?.periodEnd 
                        ? `${formatDate(invoiceData.periodStart)} to ${formatDate(invoiceData.periodEnd)}` 
                        : 'Monthly'}
                    </div>
                  </div>
                </div>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>Sl No.</th>
                    <th>Description of Goods</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody class="items-row">
                  ${itemsHtml}
                </tbody>
              </table>
              
              <div class="totals-section">
                <div class="totals-left">
                  <strong>Declaration</strong><br>
                  We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                </div>
                <div class="totals-right">
                  <div class="total-row">
                    <span>Sub Total</span>
                    <span>${formatCurrency(currentCharges)}</span>
                  </div>
                  <div class="total-row">
                    <span>Prev Balance</span>
                    <span>${formatCurrency(previousDues)}</span>
                  </div>
                  <div class="total-row bold">
                    <span>Grand Total</span>
                    <span>${formatCurrency(grandTotal)}</span>
                  </div>
                  <div class="total-row">
                    <span>Amount Paid</span>
                    <span>${formatCurrency(amountPaid)}</span>
                  </div>
                  <div class="total-row bold" style="border-top: none;">
                    <span>Balance Due</span>
                    <span>${formatCurrency(balanceDue)}</span>
                  </div>
                </div>
              </div>
              
              <div class="footer">
                <span style="float: left;">Computer Generated Invoice</span>
                <span class="page-number" style="float: right;"></span>
                <div style="clear: both;"></div>
              </div>
            </div>
          </body>
        </html>
      `;
      return htmlContent;
  };

  const handlePrint = async () => {
    try {
      const htmlContent = generateInvoiceHTML();
      await RNPrint.print({ html: htmlContent });
    } catch (error) {
      console.error('Error printing invoice:', error);
    }
  };

  const handleSharePDFWhatsApp = async () => {
    try {
      setIsDownloading(true);
      
      const customerName = invoiceData?.customerName || invoiceData?.Customer?.name || 'Customer';
      const dateStr = formatDate(invoiceData?.created_at);

      // Download the PDF from backend API as base64
      const targetId = invoiceId || initialInvoice?.id;
      const filePath = await api.downloadInvoicePDF(userToken, targetId, customerName);
      
      console.log('PDF downloaded to:', filePath);

      if (!filePath) {
        throw new Error('Failed to retrieve file path from download');
      }

      const safeName = customerName.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_');

      await RNShare.shareSingle({
        title: `${customerName} Invoice`,
        message: `Hello ${customerName},\n\nPlease find attached your invoice ${invoiceNum} dated ${dateStr}.\n\nThank you for your business!`,
        url: `file://${filePath}`,
        social: RNShare.Social.WHATSAPP,
        filename: `${safeName}_Invoice`, 
      });
    } catch (error) {
      console.error('Error sharing PDF to WhatsApp:', error);
      Alert.alert('Download Failed', error.message || 'Failed to download invoice PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <CurvedHeader
        title="Tax Invoice"
        leftIcon={<ChevronLeft size={28} color="#FFF" />}
        onLeftPress={() => navigation.goBack()}
        height={130}
        contentStyle={{ paddingTop: Platform.OS === 'ios' ? 40 : 20, paddingBottom: 25 }}
      />

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
        <>
          <ScrollView contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 16, paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>
          
          {/* Tally Style Invoice View */}
          <View style={{ borderWidth: 1, borderColor: '#000', marginHorizontal: 0, marginTop: 4, marginBottom: 24, backgroundColor: '#FFF' }}>
            <Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16, padding: 8, borderBottomWidth: 1, borderBottomColor: '#000', letterSpacing: 1, color: '#000' }}>TAX INVOICE</Text>
            
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' }}>
              <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: '#000', padding: 8 }}>
                <Text style={{ fontSize: 10, color: '#000', marginBottom: 2, fontWeight: 'bold' }}>Billed To:</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#000' }}>{invoiceData.Customer?.name || 'Customer'}</Text>
                {!!invoiceData.Customer?.phone && <Text style={{ fontSize: 11, color: '#000', marginTop: 2 }}>Ph: {invoiceData.Customer.phone}</Text>}
                {!!invoiceData.Customer?.address && <Text style={{ fontSize: 11, color: '#000', marginTop: 2 }}>{invoiceData.Customer.address}</Text>}
              </View>
              <View style={{ flex: 1, padding: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View>
                    <Text style={{ fontSize: 10, color: '#000', fontWeight: 'bold' }}>Invoice No.</Text>
                    <Text style={{ fontSize: 12, color: '#000', marginTop: 2 }}>{invoiceNum}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 10, color: '#000', fontWeight: 'bold' }}>Dated</Text>
                    <Text style={{ fontSize: 12, color: '#000', marginTop: 2 }}>{formatDate(invoiceData.created_at)}</Text>
                  </View>
                </View>
                <View>
                  <Text style={{ fontSize: 10, color: '#000', fontWeight: 'bold' }}>Billing Period</Text>
                  <Text style={{ fontSize: 12, color: '#000', marginTop: 2 }}>
                    {invoiceData.periodStart && invoiceData.periodEnd
                      ? `${formatDate(invoiceData.periodStart)} to ${formatDate(invoiceData.periodEnd)}`
                      : 'Monthly'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Table Header */}
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', backgroundColor: '#F9FAFB' }}>
              <Text style={{ width: 35, borderRightWidth: 1, borderRightColor: '#000', padding: 6, fontWeight: 'bold', fontSize: 10, textAlign: 'center', color: '#000' }}>Sl</Text>
              <Text style={{ flex: 1, borderRightWidth: 1, borderRightColor: '#000', padding: 6, fontWeight: 'bold', fontSize: 10, color: '#000' }}>Description of Goods</Text>
              <Text style={{ width: 40, borderRightWidth: 1, borderRightColor: '#000', padding: 6, fontWeight: 'bold', fontSize: 10, textAlign: 'center', color: '#000' }}>Qty</Text>
              <Text style={{ width: 60, borderRightWidth: 1, borderRightColor: '#000', padding: 6, fontWeight: 'bold', fontSize: 10, textAlign: 'right', color: '#000' }}>Rate</Text>
              <Text style={{ width: 70, padding: 6, fontWeight: 'bold', fontSize: 10, textAlign: 'right', color: '#000' }}>Amount</Text>
            </View>

            {/* Table Body */}
            {(() => {
              const elements = [];
              let allItems = deliveries.length > 0 ? deliveries : lineItems;
              const openingBalanceItem = lineItems.find(item => item.description?.toLowerCase().includes('opening balance'));
              if (deliveries.length > 0 && openingBalanceItem) {
                allItems = [openingBalanceItem, ...deliveries];
              }
              let renderedRows = 0;
              
              if (allItems.length > 0) {
                allItems.forEach((item, idx) => {
                  renderedRows++;
                  const qty = item.fullUnitsDelivered || item.quantity || 1;
                  const rate = parseFloat(item.unitPriceCharged || item.unitPrice || item.amount || 0);
                  const rowTotal = qty * rate;
                  elements.push(
                    <View key={item.id || idx} style={{ flexDirection: 'row', minHeight: 28 }}>
                      <Text style={{ width: 35, borderRightWidth: 1, borderRightColor: '#000', padding: 6, fontSize: 11, textAlign: 'center', color: '#000' }}>{idx + 1}</Text>
                      <Text style={{ flex: 1, borderRightWidth: 1, borderRightColor: '#000', padding: 6, fontSize: 11, color: '#000' }}>{getProductName(item)}</Text>
                      <Text style={{ width: 40, borderRightWidth: 1, borderRightColor: '#000', padding: 6, fontSize: 11, textAlign: 'center', color: '#000' }}>{qty}</Text>
                      <Text style={{ width: 60, borderRightWidth: 1, borderRightColor: '#000', padding: 6, fontSize: 11, textAlign: 'right', color: '#000' }}>{formatCurrency(rate)}</Text>
                      <Text style={{ width: 70, padding: 6, fontSize: 11, textAlign: 'right', color: '#000' }}>{formatCurrency(rowTotal)}</Text>
                    </View>
                  );
                });
              } else {
                renderedRows = 1;
                elements.push(
                  <View key="empty-fallback" style={{ flexDirection: 'row', minHeight: 28 }}>
                    <Text style={{ width: 35, borderRightWidth: 1, borderRightColor: '#000', padding: 6, fontSize: 11, textAlign: 'center', color: '#000' }}>1</Text>
                    <Text style={{ flex: 1, borderRightWidth: 1, borderRightColor: '#000', padding: 6, fontSize: 11, color: '#000' }}>Water Camper 20Ltr</Text>
                    <Text style={{ width: 40, borderRightWidth: 1, borderRightColor: '#000', padding: 6, fontSize: 11, textAlign: 'center', color: '#000' }}>1</Text>
                    <Text style={{ width: 60, borderRightWidth: 1, borderRightColor: '#000', padding: 6, fontSize: 11, textAlign: 'right', color: '#000' }}>{formatCurrency(currentCharges)}</Text>
                    <Text style={{ width: 70, padding: 6, fontSize: 11, textAlign: 'right', color: '#000' }}>{formatCurrency(currentCharges)}</Text>
                  </View>
                );
              }
              
              const minRows = 15;
              if (renderedRows < minRows) {
                const rowsToAdd = minRows - renderedRows;
                for(let i = 0; i < rowsToAdd; i++) {
                  elements.push(
                    <View key={`empty-${i}`} style={{ flexDirection: 'row', minHeight: 28 }}>
                      <Text style={{ width: 35, borderRightWidth: 1, borderRightColor: '#000', padding: 6, fontSize: 11, textAlign: 'center', color: 'transparent' }}>-</Text>
                      <Text style={{ flex: 1, borderRightWidth: 1, borderRightColor: '#000', padding: 6, fontSize: 11, color: 'transparent' }}>-</Text>
                      <Text style={{ width: 40, borderRightWidth: 1, borderRightColor: '#000', padding: 6, fontSize: 11, textAlign: 'center', color: 'transparent' }}>-</Text>
                      <Text style={{ width: 60, borderRightWidth: 1, borderRightColor: '#000', padding: 6, fontSize: 11, textAlign: 'right', color: 'transparent' }}>-</Text>
                      <Text style={{ width: 70, padding: 6, fontSize: 11, textAlign: 'right', color: 'transparent' }}>-</Text>
                    </View>
                  );
                }
              }
              
              return elements;
            })()}

            {/* Totals Section */}
            <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#000' }}>
              <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: '#000', padding: 8 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 10, color: '#000', marginBottom: 2 }}>Declaration</Text>
                <Text style={{ fontSize: 9, color: '#000', lineHeight: 12 }}>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</Text>
              </View>
              <View style={{ width: 180 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 6, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
                  <Text style={{ fontSize: 11, color: '#000' }}>Sub Total</Text>
                  <Text style={{ fontSize: 11, color: '#000' }}>{formatCurrency(currentCharges)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 6, borderBottomWidth: 1, borderBottomColor: '#000' }}>
                  <Text style={{ fontSize: 11, color: '#000' }}>Prev Balance</Text>
                  <Text style={{ fontSize: 11, color: '#000' }}>{formatCurrency(previousDues)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 8, borderBottomWidth: 1, borderBottomColor: '#000' }}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#000' }}>Grand Total</Text>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#000' }}>{formatCurrency(grandTotal)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 6, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
                  <Text style={{ fontSize: 11, color: '#000' }}>Amount Paid</Text>
                  <Text style={{ fontSize: 11, color: '#000' }}>{formatCurrency(amountPaid)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#000' }}>Balance Due</Text>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#000' }}>{formatCurrency(balanceDue)}</Text>
                </View>
              </View>
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


          {/* Footer Note */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Thank you for your business!</Text>
            <Text style={styles.footerSubtext}>Computer generated tax invoice. No signature required.</Text>
          </View>

        </ScrollView>
        
        {/* Floating Action Bar */}
        <View style={styles.floatingActionBar}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <TouchableOpacity 
              style={[styles.actionBtn, { flex: 1, backgroundColor: '#25D366', shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4, opacity: isDownloading ? 0.7 : 1 }]} 
              onPress={handleSharePDFWhatsApp}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <WhatsAppIcon size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]} numberOfLines={1}>Share PDF</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, { flex: 1, backgroundColor: '#128C7E', shadowColor: '#128C7E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 }]} 
              activeOpacity={0.7}
              onPress={handleWhatsAppShare}
            >
              <WhatsAppIcon size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]} numberOfLines={1}>Share Text</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.actionBtn, { width: '100%', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }]} 
            activeOpacity={0.7}
            onPress={handlePrint}
          >
            <Printer size={20} color="#334155" style={{ marginRight: 8 }} />
            <Text style={[styles.actionBtnText, { color: '#334155' }]}>Print Invoice</Text>
          </TouchableOpacity>
        </View>
        </>
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
  floatingActionBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionBtnText: {
    fontSize: 15,
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
