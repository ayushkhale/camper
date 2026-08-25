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
import Svg, { Path } from 'react-native-svg';
import RNPrint from 'react-native-print';
import { generatePDF } from 'react-native-html-to-pdf';
import RNShare from 'react-native-share';
import ReactNativeBlobUtil from 'react-native-blob-util';
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
  Download,
  ChevronLeft,
  User,
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
import { useTranslation } from 'react-i18next';
import { useAlert } from '../../context/AlertContext';

const InvoiceDetailScreen = () => {
  const { t, i18n } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { userToken, user } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const { invoiceId, invoice: initialInvoice } = route.params || {};

  const [invoiceData, setInvoiceData] = useState(initialInvoice || null);
  const [loading, setLoading] = useState(!initialInvoice?.Deliveries && !initialInvoice?.InvoiceLineItems);
  const [isSharingPdf, setIsSharingPdf] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isPrintingPdf, setIsPrintingPdf] = useState(false);
  const [error, setError] = useState(null);

  const fetchInvoiceDetail = async () => {
    if (!invoiceId && !initialInvoice?.id) return;
    const targetId = invoiceId || initialInvoice.id;
    setLoading(true);
    setError(null);
    try {
      console.log('ðŸ” [INVOICE FETCH] Fetching invoice details for ID:', targetId);
      const res = await api.getInvoiceById(userToken, targetId);
      console.log('ðŸ§¾ [INVOICE DETAILS RESPONSE]:', res);

      if (res && res.success && res.data) {
        setInvoiceData(res.data);
      } else if (res && (res.id || res.totalAmount)) {
        setInvoiceData(res);
      } else {
        if (initialInvoice) setInvoiceData(initialInvoice);
      }
    } catch (err) {
      console.error('âŒ Error fetching invoice detail:', err);
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
        return { label: t('invoices.paid').toUpperCase(), bg: '#ECFDF5', text: '#129c00ff' };
      case 'partially_paid':
        return { label: t('invoices.partiallyPaid').toUpperCase(), bg: '#EFF6FF', text: '#1D4ED8' };
      default:
        return { label: t('invoices.unpaid').toUpperCase(), bg: '#FEF2F2', text: '#980000ff' };
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
      const bName = invoiceData?.businessName || invoiceData?.VendorProfile?.businessName || 'Patidar Water Plant';
      const rawPhone = invoiceData?.customerPhone || invoiceData?.Customer?.phone;
      let cleanPhone = rawPhone ? String(rawPhone).replace(/[^0-9]/g, '') : '';
      if (cleanPhone.length === 10) {
        cleanPhone = `91${cleanPhone}`;
      }

      let message = `*INVOICE: ${invoiceNum}*\n`;
      message += `*Business:* ${bName}\n`;
      message += `*Customer:* ${customerName}\n`;
      message += `*Grand Total:* ${formatCurrency(grandTotal)}\n`;
      message += `*Paid:* ${formatCurrency(amountPaid)}\n`;
      message += `*Balance Due:* ${formatCurrency(balanceDue)}\n\n`;
      message += `Thank you for choosing ${bName}!`;

      const encodedMessage = encodeURIComponent(message);
      let whatsappUrl = `whatsapp://send?text=${encodedMessage}`;
      if (cleanPhone && cleanPhone.length >= 10) {
        whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`;
      }

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

  const getItemQuantity = (item) => {
    if (item.quantity !== undefined && item.quantity !== null) {
      return parseInt(item.quantity) || 0;
    }
    if (item.fullUnitsDelivered !== undefined && item.fullUnitsDelivered !== null) {
      return parseInt(item.fullUnitsDelivered) || 0;
    }
    if (item.description) {
      const match = item.description.match(/(\d+)\s*(?:can\(s\)|unit\(s\)|cans|units|jars|jar|pcs|pieces)/i);
      if (match && match[1]) {
        return parseInt(match[1]);
      }
      const leadingMatch = item.description.match(/\]\s*(\d+)/i);
      if (leadingMatch && leadingMatch[1]) {
        return parseInt(leadingMatch[1]);
      }
    }
    const status = (item.status || '').toLowerCase();
    if (status === 'skipped' || status === 'pending') {
      return 0;
    }
    return 1;
  };

  const getItemDetails = (item) => {
    let productName = item.productName || item.Product?.name || item.Subscription?.Product?.name;
    let rawDescription = item.description || '';
    let status = (item.status || '').toLowerCase();

    if (rawDescription) {
      const lowerDesc = rawDescription.toLowerCase();
      if (lowerDesc.includes('skipped') || lowerDesc.includes('not delivered (skipped)')) {
        status = 'skipped';
      } else if (lowerDesc.includes('pending') || lowerDesc.includes('not delivered (pending)')) {
        status = 'pending';
      } else if (lowerDesc.includes('delivered')) {
        status = 'delivered';
      }
    }

    if (!productName && rawDescription) {
      if (rawDescription.toLowerCase().includes('opening balance')) {
        productName = 'Opening Balance';
      } else if (rawDescription.includes(' of ') && rawDescription.includes(' on ')) {
        const match = rawDescription.match(/of (.+) on/i);
        if (match && match[1]) {
          productName = match[1].trim();
        }
      } else if (rawDescription.includes('Jar 30 rs')) {
        productName = 'Jar 30 rs';
      } else if (rawDescription.includes('Jar 25rs')) {
        productName = 'Jar 25rs';
      }
    }

    if (!productName) {
      productName = 'Jar 30 rs';
    }

    const dateStr = item.dateFormatted || (item.deliveryDate ? formatDate(item.deliveryDate) : '');
    const qty = getItemQuantity(item);

    // Clean up hardcoded manual bracket tags like [ONE-TIME ORDER DELIVERED] or [DELIVERED]
    let description = rawDescription.replace(/\[ONE-TIME ORDER DELIVERED\]|\[DELIVERED\]|\[NOT DELIVERED \(SKIPPED\)\]|\[NOT DELIVERED \(PENDING\)\]|\[DELIVERY\]/gi, '').trim();

    if (!description) {
      if (status === 'skipped') {
        description = `Skipped delivery${dateStr ? ` on ${dateStr}` : ''}`;
      } else if (status === 'pending') {
        description = `Pending delivery${dateStr ? ` on ${dateStr}` : ''}`;
      } else {
        description = `${qty} unit(s) delivered${dateStr ? ` on ${dateStr}` : ''}`;
      }
    }

    return { productName, description, status: status || 'delivered', qty };
  };

  const generateInvoiceHTML = () => {
    const bName = invoiceData?.businessName || invoiceData?.VendorProfile?.businessName || 'Patidar Water Plant';
    const bAddress = invoiceData?.businessAddress || invoiceData?.VendorProfile?.address || 'Indraprastha tower, Indore, Madhya Pradesh';
    const cName = invoiceData?.customerName || invoiceData?.Customer?.name || 'Customer';

    const rawCPhone = invoiceData?.customerPhone || invoiceData?.Customer?.phone;
    const rawCAddress = invoiceData?.customerAddress || invoiceData?.Customer?.address;
    const cPhone = rawCPhone && String(rawCPhone).trim() !== '' ? String(rawCPhone).trim() : 'N/A';
    const cAddress = rawCAddress && String(rawCAddress).trim() !== '' ? String(rawCAddress).trim() : 'N/A (Not Provided)';

    const dateFormatted = invoiceData?.generatedAtFormatted || formatDate(invoiceData?.generatedAt || invoiceData?.createdAt || invoiceData?.created_at);
    const periodStart = invoiceData?.periodStartFormatted || formatDate(invoiceData?.periodStart);
    const periodEnd = invoiceData?.periodEndFormatted || formatDate(invoiceData?.periodEnd);

    let itemsHtml = '';
    
    // Top Row: Opening Balance / Previous Dues if present
    if (previousDues > 0) {
      itemsHtml += `
        <tr style="background-color: #fffbeb;">
          <td style="padding: 8px 10px;">
            <div style="font-weight: bold; font-size: 11px; color: #0f172a;">Opening Balance / Previous Dues</div>
            <div style="font-size: 10px; margin-top: 3px; line-height: 1.4; color: #b45309; font-weight: bold;">[PREVIOUS DUES] Carried forward from previous billing period</div>
          </td>
          <td style="text-align: center; padding: 8px; color: #334155;">1</td>
          <td style="text-align: right; padding: 8px; color: #334155;">${formatCurrency(previousDues)}</td>
          <td style="text-align: right; padding: 8px; font-weight: bold; color: #0f172a;">${formatCurrency(previousDues)}</td>
        </tr>
      `;
    }

    let allItems = lineItems.length > 0 ? lineItems : deliveries;
    if (deliveries.length > 0 && lineItems.length === 0) {
      allItems = deliveries;
    }

    if (allItems.length > 0) {
      allItems.forEach((item, index) => {
        const { productName, description, status, qty } = getItemDetails(item);
        const rate = parseFloat(item.unitPrice || item.unitPriceCharged || (qty > 0 ? (item.amount / qty) : item.amount) || 0);
        const amount = parseFloat(item.amount !== undefined ? item.amount : (rate * qty));

        let statusBadgeClass = 'badge-delivered';
        if (status === 'skipped') statusBadgeClass = 'badge-skipped';
        else if (status === 'pending') statusBadgeClass = 'badge-pending';

        itemsHtml += `
            <tr>
              <td style="padding: 8px 10px;">
                <div style="font-weight: bold; font-size: 11px; color: #0f172a;">${productName}</div>
                <div style="font-size: 10px; margin-top: 3px; line-height: 1.4;" class="${statusBadgeClass}">${description}</div>
              </td>
              <td style="text-align: center; padding: 8px; color: #334155;">${qty}</td>
              <td style="text-align: right; padding: 8px; color: #334155;">${formatCurrency(rate)}</td>
              <td style="text-align: right; padding: 8px; font-weight: bold; color: #0f172a;">${formatCurrency(amount)}</td>
            </tr>
          `;
      });
    } else if (previousDues === 0) {
      itemsHtml += `
          <tr>
            <td style="padding: 8px 10px;">
              <div style="font-weight: bold; font-size: 11px; color: #0f172a;">Jar 30 rs</div>
              <div style="font-size: 10px; color: #15803d; margin-top: 3px;" class="badge-delivered">Water Delivery</div>
            </td>
            <td style="text-align: center; padding: 8px;">1</td>
            <td style="text-align: right; padding: 8px;">${formatCurrency(currentCharges)}</td>
            <td style="text-align: right; padding: 8px; font-weight: bold;">${formatCurrency(currentCharges)}</td>
          </tr>
        `;
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
                padding: 16px;
                color: #1e293b; 
                font-size: 11px;
                background-color: #fff;
              }
              @page {
                size: A4;
                margin: 8mm;
              }
              .header-container {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 16px;
              }
              .logo-block {
                padding: 0;
                margin: 0;
              }
              .vendor-details {
                text-align: right;
                font-size: 11px;
                color: #334155;
                line-height: 1.4;
              }
              .vendor-details .v-title {
                font-size: 15px;
                font-weight: bold;
                color: #1e3a8a;
                margin-bottom: 2px;
              }
              .header-divider {
                height: 1px;
                background-color: #cbd5e1;
                margin: 16px 0;
              }
              .meta-container {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 20px;
              }
              .billed-to {
                flex: 1;
              }
              .billed-to .section-label {
                font-size: 11px;
                font-weight: bold;
                color: #1e3a8a;
                margin-bottom: 4px;
                text-transform: uppercase;
              }
              .billed-to .c-name {
                font-size: 14px;
                font-weight: bold;
                color: #0f172a;
                margin-bottom: 2px;
              }
              .meta-right {
                text-align: right;
                font-size: 11px;
                line-height: 1.6;
              }
              .meta-right .m-label {
                font-weight: bold;
                color: #1e3a8a;
              }
              table.invoice-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 0;
              }
              table.invoice-table th { 
                background-color: #1e3a8a;
                color: #ffffff;
                padding: 10px 10px; 
                font-weight: bold;
                font-size: 11px;
                border: none;
              }
              table.invoice-table td { 
                padding: 8px 10px; 
                border-bottom: 1px solid #e2e8f0;
                border-top: none;
                border-left: none;
                border-right: none;
                font-size: 11px;
              }
              .badge-delivered { color: #15803d; font-weight: bold; }
              .badge-skipped { color: #b91c1c; font-weight: bold; }
              .badge-pending { color: #b45309; font-weight: bold; }
              
              .summary-container {
                display: flex;
                border: 1px solid #cbd5e1;
                border-top: 1.5px solid #cbd5e1;
                margin-top: 0;
                margin-bottom: 24px;
                box-sizing: border-box;
              }
              .notes-box {
                flex: 1;
                border-right: 1px solid #cbd5e1;
                padding: 10px 12px;
                background-color: #f8fafc;
                box-sizing: border-box;
              }
              .notes-box .n-label {
                font-size: 11px;
                font-weight: bold;
                color: #1e3a8a;
                margin-bottom: 4px;
              }
              .totals-box {
                width: 200px;
                border-collapse: collapse;
                background-color: #ffffff;
              }
              .totals-box td {
                padding: 6px 10px;
                border-bottom: 1px solid #e2e8f0;
                font-size: 10.5px;
                color: #64748b;
              }
              .totals-box tr.grand-row td {
                background-color: #1e3a8a;
                color: #ffffff;
                font-weight: bold;
                font-size: 11px;
                border-bottom: none;
              }
              .footer-tag {
                text-align: center;
                margin-top: 24px;
                font-size: 11.5px;
                font-weight: bold;
                color: #1e3a8a;
              }
            </style>
          </head>
          <body>
            <div class="header-container">
              <div class="logo-block" style="background-color: #1e3a8a; color: #ffffff; padding: 10px 16px; border-radius: 6px; font-size: 14px; font-weight: bold; letter-spacing: 1.5px; text-align: center;">
                INVOICE
              </div>
              <div class="vendor-details">
                <div class="v-title">${bName}</div>
                <div>${bAddress}</div>
              </div>
            </div>

            <div class="header-divider"></div>

            <div class="meta-container">
              <div class="billed-to" style="flex: 1.1; padding-right: 12px;">
                <div class="section-label">BILLED TO:</div>
                <div class="c-name">${cName}</div>
                <div style="margin-top: 3px; color: #334155;">
                  <span style="font-weight: bold; color: #1e3a8a; display: inline-block; width: 62px;">Phone:</span>
                  <span>${cPhone}</span>
                </div>
                <div style="margin-top: 3px; color: #334155;">
                  <span style="font-weight: bold; color: #1e3a8a; display: inline-block; width: 62px;">Address:</span>
                  <span>${cAddress}</span>
                </div>
              </div>

              <div class="meta-right" style="flex: 1; text-align: left; padding-left: 12px;">
                <div class="section-label" style="font-size: 11px; font-weight: bold; color: #1e3a8a; margin-bottom: 4px; text-transform: uppercase;">INVOICE DETAILS:</div>
                <div style="margin-top: 3px; color: #334155;">
                  <span style="font-weight: bold; color: #1e3a8a; display: inline-block; width: 72px;">Invoice #:</span>
                  <span style="font-weight: bold; color: #0f172a;">${invoiceNum}</span>
                </div>
                <div style="margin-top: 3px; color: #334155;">
                  <span style="font-weight: bold; color: #1e3a8a; display: inline-block; width: 72px;">Date:</span>
                  <span>${dateFormatted}</span>
                </div>
                <div style="margin-top: 3px; color: #334155;">
                  <span style="font-weight: bold; color: #1e3a8a; display: inline-block; width: 72px;">Period:</span>
                  <span>${periodStart} to ${periodEnd}</span>
                </div>
              </div>
            </div>

            <table class="invoice-table">
              <thead>
                <tr>
                  <th style="text-align: left; width: 45%;">Description</th>
                  <th style="text-align: center; width: 15%;">Quantity</th>
                  <th style="text-align: right; width: 20%;">Unit Price</th>
                  <th style="text-align: right; width: 20%;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="summary-container">
              <div class="notes-box">
                <div class="n-label">Notes</div>
                <div style="color: #475569; font-size: 9.5px; line-height: 1.4;">
                  Thank you for choosing ${bName}! Clean & Pure Water Delivery. All particulars are true and correct.
                </div>
              </div>

              <table class="totals-box">
                <tr>
                  <td>Current Charges</td>
                  <td style="text-align: right; font-weight: bold; color: #334155;">${formatCurrency(currentCharges)}</td>
                </tr>
                ${previousDues !== 0 ? `
                <tr>
                  <td style="color: ${previousDues > 0 ? '#64748b' : '#059669'};">${previousDues > 0 ? 'Previous Dues' : 'Advance Credit'}</td>
                  <td style="text-align: right; font-weight: bold; color: ${previousDues > 0 ? '#334155' : '#059669'};">${formatCurrency(previousDues)}</td>
                </tr>
                ` : ''}
                ${amountPaid > 0 ? `
                <tr>
                  <td>Amount Paid</td>
                  <td style="text-align: right; font-weight: bold; color: #059669;">${formatCurrency(amountPaid)}</td>
                </tr>
                ` : ''}
                <tr class="grand-row">
                  <td style="font-weight: bold; color: #ffffff;">Total Amount</td>
                  <td style="text-align: right; font-weight: bold; color: #ffffff; font-size: 12px;">${formatCurrency(balanceDue > 0 ? balanceDue : grandTotal)}</td>
                </tr>
              </table>
            </div>

            <div class="footer-tag">
              Thank you! We appreciate your business.
            </div>
          </body>
        </html>
      `;
    return htmlContent;
  };

  const handlePrint = async () => {
    try {
      setIsPrintingPdf(true);
      const customerName = invoiceData?.customerName || invoiceData?.Customer?.name || 'Customer';
      const targetId = invoiceId || initialInvoice?.id;

      let pdfFilePath = null;
      if (targetId && userToken) {
        try {
          pdfFilePath = await api.downloadInvoicePDF(userToken, targetId, customerName);
        } catch (apiErr) {
          console.warn('Backend PDF download for print failed, using local HTML fallback:', apiErr.message);
        }
      }

      if (pdfFilePath) {
        console.log('Printing downloaded backend PDF file from:', pdfFilePath);
        await RNPrint.print({ filePath: pdfFilePath });
      } else {
        const htmlContent = generateInvoiceHTML();
        await RNPrint.print({ html: htmlContent });
      }
    } catch (error) {
      console.error('Error printing invoice:', error);
      showAlert('Print Error', error.message || 'Could not print invoice', 'error');
    } finally {
      setIsPrintingPdf(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloadingPdf(true);
      const customerName = invoiceData?.customerName || invoiceData?.Customer?.name || 'Customer';
      const targetId = invoiceId || initialInvoice?.id;

      let filePath = null;
      if (targetId && userToken) {
        filePath = await api.downloadInvoicePDF(userToken, targetId, customerName);
        if (filePath) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (filePath) {
        showAlert(
          t('invoices.invoiceDownloaded'),
          t('invoices.downloadedMessage', { path: filePath }),
          [
            {
              text: t('invoices.openShare'),
              onPress: () => {
                const fileUrl = filePath.startsWith('file://') ? filePath : `file://${filePath}`;
                RNShare.open({
                  url: fileUrl,
                  type: 'application/pdf',
                  title: 'Open Invoice PDF',
                }).catch(() => {});
              }
            },
            { text: t('common.okay') }
          ]
        );
      } else {
        await handlePrint();
      }
    } catch (error) {
      console.log('Download notice:', error.message);
      await handlePrint();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleSharePDFWhatsApp = async () => {
    try {
      setIsSharingPdf(true);

      const customerName = invoiceData?.customerName || invoiceData?.Customer?.name || 'Customer';
      const dateStr = formatDate(invoiceData?.generatedAt || invoiceData?.createdAt || invoiceData?.created_at);
      const targetId = invoiceId || initialInvoice?.id;
      let filePath = null;

      try {
        filePath = await api.downloadInvoicePDF(userToken, targetId, customerName);
        console.log('PDF downloaded to:', filePath);
      } catch (dlErr) {
        console.warn('PDF download failed, falling back to text share:', dlErr.message);
      }

      // Check if file exists and has content BEFORE opening share sheet
      let isValidFile = false;
      if (filePath) {
        try {
          const fileExists = await ReactNativeBlobUtil.fs.exists(filePath);
          if (fileExists) {
            const fileStat = await ReactNativeBlobUtil.fs.stat(filePath);
            if (fileStat && parseInt(fileStat.size) > 0) {
              isValidFile = true;
            }
          }
        } catch (checkErr) {
          console.warn('File existence check failed:', checkErr.message);
        }
      }

      if (isValidFile && filePath) {
        // Short delay to ensure OS file lock is completely released
        await new Promise(resolve => setTimeout(resolve, 800));

        const fileUrl = filePath.startsWith('file://') ? filePath : `file://${filePath}`;
        const safeName = customerName.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_');

        const shareOptions = {
          title: `Share Invoice ${invoiceNum}`,
          message: `Hello ${customerName},\n\nPlease find attached your invoice ${invoiceNum} dated ${dateStr}.\n\nThank you for your business!`,
          url: fileUrl,
          type: 'application/pdf',
          filename: `${safeName}_Invoice`,
        };

        // Open native share chooser dialog directly so user selects WhatsApp or any preferred app
        await RNShare.open(shareOptions);
      } else {
        // Fallback to text share if PDF is not ready
        console.log('PDF file not valid or missing, falling back to text share');
        await handleWhatsAppShare();
      }
    } catch (error) {
      if (error && error.message !== 'User did not share') {
        console.error('Error in handleSharePDFWhatsApp, falling back to text share:', error);
        await handleWhatsAppShare();
      }
    } finally {
      setIsSharingPdf(false);
    }
  };

  const rawCPhone = invoiceData?.customerPhone || invoiceData?.Customer?.phone;
  const rawCAddress = invoiceData?.customerAddress || invoiceData?.Customer?.address;
  const cPhoneText = rawCPhone && String(rawCPhone).trim() !== '' ? String(rawCPhone).trim() : 'N/A';
  const cAddressText = rawCAddress && String(rawCAddress).trim() !== '' ? String(rawCAddress).trim() : 'N/A (Not Provided)';

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <CurvedHeader
        title={t('invoices.taxInvoice')}
        leftIcon={<ArrowLeft size={24} color="#0B409C" />}
        onLeftPress={() => navigation.goBack()}
        height={130}
        contentStyle={{ paddingTop: Platform.OS === 'ios' ? 40 : 20, paddingBottom: 25 }}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : !invoiceData ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={48} color={COLORS.danger} style={{ marginBottom: 12 }} />
          <Text style={styles.errorText}>{t('invoices.noInvoicesFound')}</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 16, paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>

            <View style={{
              borderWidth: 1,
              borderColor: '#CBD5E1',
              borderRadius: 12,
              marginTop: 4,
              marginBottom: 24,
              backgroundColor: '#FFFFFF',
              overflow: 'hidden',
              elevation: 4,
              shadowColor: '#1E3A8A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 10,
            }}>
              <View style={{ height: 5, backgroundColor: '#1E3A8A' }} />

              <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Left Navy Box: TAX INVOICE Badge */}
                <View style={{ backgroundColor: '#1E3A8A', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 9 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: 'Rubik-Bold', letterSpacing: 1.5 }}>
                    INVOICE
                  </Text>
                </View>

                {/* Right Vendor Details */}
                <View style={{ flex: 1, alignItems: 'flex-end', paddingLeft: 12 }}>
                  <Text style={{ color: '#1E3A8A', fontSize: 14, fontFamily: 'Rubik-Bold', textAlign: 'right' }}>
                    {invoiceData?.businessName || invoiceData?.VendorProfile?.businessName || 'Patidar Water Plant'}
                  </Text>
                  <Text style={{ color: '#475569', fontSize: 10.5, fontFamily: 'Rubik-SemiBold', textAlign: 'right', marginTop: 2, lineHeight: 14 }}>
                    {invoiceData?.businessAddress || invoiceData?.VendorProfile?.address || 'Indraprastha tower, Indore, Madhya Pradesh'}
                  </Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: '#E2E8F0', marginHorizontal: 16, marginBottom: 14 }} />

              <View style={{ paddingHorizontal: 16, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                {/* Left Column: Billed To */}
                <View style={{ flex: 1.1, paddingRight: 6 }}>
                  <Text style={{ fontSize: 10.5, color: '#1E3A8A', fontFamily: 'Rubik-Bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                    BILLED TO:
                  </Text>
                  <Text style={{ fontSize: 13.5, color: '#0F172A', fontFamily: 'Rubik-Bold', marginBottom: 3 }}>
                    {invoiceData.customerName || invoiceData.Customer?.name || 'Customer'}
                  </Text>
                  <View style={{ flexDirection: 'row', marginTop: 2, alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 10.5, color: '#1E3A8A', fontFamily: 'Rubik-Bold', width: 56 }}>Phone:</Text>
                    <Text style={{ fontSize: 10.5, color: '#334155', fontFamily: 'Rubik-SemiBold', flex: 1 }}>{cPhoneText}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', marginTop: 2, alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 10.5, color: '#1E3A8A', fontFamily: 'Rubik-Bold', width: 56 }}>Address:</Text>
                    <Text style={{ fontSize: 10.5, color: '#334155', fontFamily: 'Rubik-SemiBold', flex: 1, lineHeight: 14 }}>{cAddressText}</Text>
                  </View>
                </View>

                {/* Right Column: Invoice Details (Aligned from starting point) */}
                <View style={{ flex: 1, paddingLeft: 6 }}>
                  <Text style={{ fontSize: 10.5, color: '#1E3A8A', fontFamily: 'Rubik-Bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                    INVOICE DETAILS:
                  </Text>
                  <View style={{ flexDirection: 'row', marginTop: 2, alignItems: 'center' }}>
                    <Text style={{ fontSize: 10.5, color: '#1E3A8A', fontFamily: 'Rubik-Bold', width: 68 }}>Invoice #:</Text>
                    <Text style={{ fontSize: 10.5, color: '#0F172A', fontFamily: 'Rubik-Bold', flex: 1 }}>{invoiceNum}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', marginTop: 2, alignItems: 'center' }}>
                    <Text style={{ fontSize: 10.5, color: '#1E3A8A', fontFamily: 'Rubik-Bold', width: 68 }}>Date:</Text>
                    <Text style={{ fontSize: 10.5, color: '#334155', fontFamily: 'Rubik-SemiBold', flex: 1 }}>
                      {invoiceData?.generatedAtFormatted || formatDate(invoiceData?.generatedAt || invoiceData?.createdAt || invoiceData?.created_at)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', marginTop: 2, alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 10.5, color: '#1E3A8A', fontFamily: 'Rubik-Bold', width: 68 }}>Period:</Text>
                    <Text style={{ fontSize: 10.5, color: '#334155', fontFamily: 'Rubik-SemiBold', flex: 1, lineHeight: 14 }}>
                      {invoiceData.periodStart && invoiceData.periodEnd
                        ? `${invoiceData.periodStartFormatted || formatDate(invoiceData.periodStart)} to ${invoiceData.periodEndFormatted || formatDate(invoiceData.periodEnd)}`
                        : 'Monthly'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', backgroundColor: '#1E3A8A', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#1E3A8A' }}>
                <Text style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 10, fontWeight: 'bold', fontSize: 10.5, color: '#FFFFFF' }}>Description</Text>
                <Text style={{ width: 55, paddingVertical: 8, paddingHorizontal: 4, fontWeight: 'bold', fontSize: 10.5, textAlign: 'center', color: '#FFFFFF' }}>Quantity</Text>
                <Text style={{ width: 65, paddingVertical: 8, paddingHorizontal: 4, fontWeight: 'bold', fontSize: 10.5, textAlign: 'right', color: '#FFFFFF' }}>Unit Price</Text>
                <Text style={{ width: 75, paddingVertical: 8, paddingHorizontal: 8, fontWeight: 'bold', fontSize: 10.5, textAlign: 'right', color: '#FFFFFF' }}>Total</Text>
              </View>

              {(() => {
                let allItems = lineItems.length > 0 ? lineItems : deliveries;
                if (deliveries.length > 0 && lineItems.length === 0) {
                  allItems = deliveries;
                }

                return (
                  <>
                    {/* Top Row: Opening Balance / Previous Dues or Advance Credit */}
                    {previousDues !== 0 && (
                      <View style={{ flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderColor: '#E2E8F0', backgroundColor: previousDues > 0 ? '#FFFBEB' : '#ECFDF5', alignItems: 'center' }}>
                        <View style={{ flex: 1, paddingRight: 6 }}>
                          <Text style={{ fontSize: 11.5, fontFamily: 'Rubik-Bold', color: '#0F172A' }}>
                            {previousDues > 0 ? 'Opening Balance / Previous Dues' : 'Opening Balance / Advance Credit'}
                          </Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 3 }}>
                            <View style={{ backgroundColor: previousDues > 0 ? '#FEF3C7' : '#D1FAE5', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, marginRight: 4, marginBottom: 2 }}>
                              <Text style={{ fontSize: 8.5, fontFamily: 'Rubik-Bold', color: previousDues > 0 ? '#B45309' : '#047857', textTransform: 'uppercase' }}>
                                {previousDues > 0 ? 'PREVIOUS DUES' : 'ADVANCE CREDIT'}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 10, color: previousDues > 0 ? '#92400E' : '#065F46', fontFamily: 'Rubik-SemiBold', lineHeight: 14, flex: 1 }}>
                              {previousDues > 0 ? 'Carried forward from previous billing period' : 'Prepaid balance / advance deposit'}
                            </Text>
                          </View>
                        </View>

                        <Text style={{ width: 55, textAlign: 'center', fontSize: 11, color: '#334155' }}>1</Text>
                        <Text style={{ width: 65, textAlign: 'right', fontSize: 11, color: '#334155' }}>{formatCurrency(previousDues)}</Text>
                        <Text style={{ width: 75, textAlign: 'right', fontSize: 11.5, fontFamily: 'Rubik-Bold', color: previousDues > 0 ? '#0F172A' : '#047857' }}>{formatCurrency(previousDues)}</Text>
                      </View>
                    )}

                    {allItems.length === 0 && previousDues === 0 ? (
                      <View style={{ flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 10, borderBottomWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, fontFamily: 'Rubik-Bold', color: '#0F172A' }}>Jar 30 rs</Text>
                          <Text style={{ fontSize: 10, color: '#15803D', fontFamily: 'Rubik-SemiBold', marginTop: 2 }}>[DELIVERED] Water Delivery</Text>
                        </View>
                        <Text style={{ width: 55, textAlign: 'center', fontSize: 11, color: '#334155' }}>1</Text>
                        <Text style={{ width: 65, textAlign: 'right', fontSize: 11, color: '#334155' }}>{formatCurrency(currentCharges)}</Text>
                        <Text style={{ width: 75, textAlign: 'right', fontSize: 11, fontFamily: 'Rubik-Bold', color: '#0F172A' }}>{formatCurrency(currentCharges)}</Text>
                      </View>
                    ) : (
                      allItems.map((item, idx) => {
                        const { productName, description, status, qty } = getItemDetails(item);
                        const rate = parseFloat(item.unitPrice || item.unitPriceCharged || (qty > 0 ? (item.amount / qty) : item.amount) || 0);
                        const amount = parseFloat(item.amount !== undefined ? item.amount : (rate * qty));

                        let statusColor = '#64748B';
                        let statusBg = '#F8FAFC';
                        if (status === 'delivered') {
                          statusColor = '#15803D';
                          statusBg = '#ECFDF5';
                        } else if (status === 'skipped') {
                          statusColor = '#B91C1C';
                          statusBg = '#FEF2F2';
                        } else if (status === 'pending') {
                          statusColor = '#B45309';
                          statusBg = '#FFFBEB';
                        }

                        return (
                          <View key={item.id || idx} style={{ flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderColor: '#E2E8F0', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', alignItems: 'center' }}>
                            <View style={{ flex: 1, paddingRight: 6 }}>
                              <Text style={{ fontSize: 11.5, fontFamily: 'Rubik-Bold', color: '#0F172A' }}>{productName}</Text>
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 3 }}>
                                <View style={{ backgroundColor: statusBg, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, marginRight: 4, marginBottom: 2 }}>
                                  <Text style={{ fontSize: 8.5, fontFamily: 'Rubik-Bold', color: statusColor, textTransform: 'uppercase' }}>
                                    {status || 'DELIVERY'}
                                  </Text>
                                </View>
                                <Text style={{ fontSize: 10, color: '#475569', fontFamily: 'Rubik-SemiBold', lineHeight: 14, flex: 1 }}>
                                  {description}
                                </Text>
                              </View>
                            </View>

                            <Text style={{ width: 55, textAlign: 'center', fontSize: 11, color: '#334155' }}>{qty}</Text>
                            <Text style={{ width: 65, textAlign: 'right', fontSize: 11, color: '#334155' }}>{formatCurrency(rate)}</Text>
                            <Text style={{ width: 75, textAlign: 'right', fontSize: 11.5, fontFamily: 'Rubik-Bold', color: '#0F172A' }}>{formatCurrency(amount)}</Text>
                          </View>
                        );
                      })
                    )}
                  </>
                );
              })()}

              <View style={{ flexDirection: 'row', borderTopWidth: 1.5, borderColor: '#CBD5E1' }}>
                <View style={{ flex: 1, borderRightWidth: 1, borderColor: '#CBD5E1', padding: 10, backgroundColor: '#F8FAFC' }}>
                  <Text style={{ fontSize: 11, fontFamily: 'Rubik-Bold', color: '#1E3A8A', marginBottom: 3 }}>Notes</Text>
                  <Text style={{ fontSize: 9.5, color: '#475569', lineHeight: 13 }}>
                    Thank you for choosing {invoiceData?.businessName || invoiceData?.VendorProfile?.businessName || 'Patidar Water Plant'}! Clean & Pure Water Delivery. All particulars are true and correct.
                  </Text>
                </View>

                {/* Totals Table Box */}
                <View style={{ width: 175, backgroundColor: '#FFFFFF' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 1, borderColor: '#E2E8F0' }}>
                    <Text style={{ fontSize: 10.5, color: '#64748B' }}>Current Charges</Text>
                    <Text style={{ fontSize: 10.5, color: '#334155', fontFamily: 'Rubik-Bold' }}>{formatCurrency(currentCharges)}</Text>
                  </View>

                  {previousDues !== 0 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 1, borderColor: '#E2E8F0' }}>
                      <Text style={{ fontSize: 10.5, color: previousDues > 0 ? '#64748B' : '#059669' }}>
                        {previousDues > 0 ? 'Previous Dues' : 'Advance Credit'}
                      </Text>
                      <Text style={{ fontSize: 10.5, color: previousDues > 0 ? '#334155' : '#059669', fontFamily: 'Rubik-Bold' }}>
                        {formatCurrency(previousDues)}
                      </Text>
                    </View>
                  )}

                  {amountPaid > 0 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 1, borderColor: '#E2E8F0' }}>
                      <Text style={{ fontSize: 10.5, color: '#64748B' }}>Amount Paid</Text>
                      <Text style={{ fontSize: 10.5, color: '#059669', fontFamily: 'Rubik-Bold' }}>{formatCurrency(amountPaid)}</Text>
                    </View>
                  )}

                  {/* Solid Navy Total Row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, paddingHorizontal: 8, backgroundColor: '#1E3A8A' }}>
                    <Text style={{ fontSize: 11, fontFamily: 'Rubik-Bold', color: '#FFFFFF' }}>Total Amount</Text>
                    <Text style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#FFFFFF' }}>
                      {formatCurrency(balanceDue > 0 ? balanceDue : grandTotal)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Footer Tag */}
              <View style={{ backgroundColor: '#F8FAFC', paddingVertical: 10, borderTopWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontFamily: 'Rubik-Bold', color: '#1E3A8A' }}>
                  Thank you! We appreciate your business.
                </Text>
              </View>
            </View>

            {/* Record Payment Action Button */}
            {invoiceData.status !== 'paid' && balanceDue > 0 && user?.role !== 'staff' && (
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
                <Text style={styles.payBtnText}>{t('payments.recordPayment')} ({formatCurrency(balanceDue)})</Text>
              </TouchableOpacity>
            )}


            {/* Footer Note */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('invoices.thankYou')}</Text>
              <Text style={styles.footerSubtext}>{t('invoices.computerGenerated')}</Text>
            </View>

            {/* Metadata Section */}
            <View style={styles.metadataSection}>
              <Text style={styles.metadataLabel}>Last Modified By</Text>
              <View style={styles.metadataUserRow}>
                <User size={14} color="#64748B" />
                <Text style={styles.metadataValue}>
                  {invoiceData.updatedBy?.name || 'System'} ({invoiceData.updatedBy?.role || 'admin'})
                </Text>
              </View>
              {invoiceData.updatedAt && (
                <Text style={styles.metadataTime}>
                  {new Date(invoiceData.updatedAt).toLocaleString()}
                </Text>
              )}
            </View>

          </ScrollView>

          {/* Floating Action Bar */}
          <View style={styles.floatingActionBar}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <TouchableOpacity
                style={[styles.actionBtn, { flex: 1, backgroundColor: '#25D366', shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4, opacity: isSharingPdf ? 0.7 : 1 }]}
                onPress={handleSharePDFWhatsApp}
                disabled={isSharingPdf}
              >
                {isSharingPdf ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <WhatsAppIcon size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]} numberOfLines={1}>{t('invoices.sharePdf')}</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { flex: 1, backgroundColor: '#128C7E', shadowColor: '#128C7E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 }]}
                activeOpacity={0.7}
                onPress={handleWhatsAppShare}
              >
                <WhatsAppIcon size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]} numberOfLines={1}>{t('invoices.shareText')}</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.actionBtn, { flex: 1, backgroundColor: '#1E3A8A', shadowColor: '#1E3A8A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2, opacity: isPrintingPdf ? 0.7 : 1 }]}
                activeOpacity={0.7}
                onPress={handlePrint}
                disabled={isPrintingPdf}
              >
                {isPrintingPdf ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Printer size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={[styles.actionBtnText, { color: '#FFFFFF', fontSize: 13 }]} numberOfLines={1}>{t('invoices.printInvoice') || 'Print Invoice'}</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { flex: 1, backgroundColor: '#0F172A', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2, opacity: isDownloadingPdf ? 0.7 : 1 }]}
                activeOpacity={0.7}
                onPress={handleDownloadPDF}
                disabled={isDownloadingPdf}
              >
                {isDownloadingPdf ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Download size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={[styles.actionBtnText, { color: '#FFFFFF', fontSize: 13 }]} numberOfLines={1}>Download PDF</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textPlaceholder,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-Bold',
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  invoiceNumText: {
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-Bold',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  customerName: {
    fontSize: 17,
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textSecondary,
  },
  metaValueText: {
    fontSize: 13,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
  },
  periodRow: {
    marginTop: 2,
  },
  periodValueText: {
    fontSize: 13,
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },
  itemsHeaderTotalLabel: {
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
  },
  itemMainCol: {
    flex: 1,
    paddingRight: 8,
  },
  productNameText: {
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.primary,
  },
  emptyCansText: {
    fontSize: 11,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textSecondary,
  },
  qtyPriceText: {
    fontSize: 11,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textPlaceholder,
    marginTop: 4,
  },
  amountCol: {
    width: 75,
    alignItems: 'flex-end',
  },
  rowAmountText: {
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textSecondary,
  },
  totalValue: {
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
  },
  balanceValue: {
    fontSize: 20,
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-Bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  footerSubtext: {
    fontSize: 11,
    fontFamily: 'Rubik-SemiBold',
    color: '#94A3B8',
    marginTop: 2,
  },
  metadataSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metadataLabel: {
    fontSize: 12,
    fontFamily: 'Rubik-Bold',
    color: '#64748B',
    marginBottom: 8,
  },
  metadataUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 13,
    fontFamily: 'Rubik-SemiBold',
    color: '#334155',
    marginLeft: 6,
  },
  metadataTime: {
    fontSize: 11,
    fontFamily: 'Rubik-Medium',
    color: '#94A3B8',
  },
});

export default InvoiceDetailScreen;

