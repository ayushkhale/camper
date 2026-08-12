import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  Modal,
  FlatList,
  TouchableWithoutFeedback
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, ChevronDown, Check, X, Search, User, Filter, AlertCircle, FileText, Calendar } from 'lucide-react-native';
import CurvedHeader from '../../components/CurvedHeader';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import AddCustomerModal from '../../components/modals/AddCustomerModal';

const GenerateInvoiceScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { userToken } = useContext(AuthContext);
  const { showAlert, showPopup } = useAlert();

  const initialCustomerId = route.params?.customerId || '';

  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [periodStart, setPeriodStart] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().split('T')[0]);
  
  const [customers, setCustomers] = useState([]);
  const [apiError, setApiError] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [preSummary, setPreSummary] = useState(null);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'customer'
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [addCustomerVisible, setAddCustomerVisible] = useState(false);

  const formatDateString = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const parseDateString = (str) => {
    if (!str) return new Date();
    const parts = str.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date();
  };

  const onStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setPeriodStart(formatDateString(selectedDate));
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setPeriodEnd(formatDateString(selectedDate));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchPreSummary();
  }, [customerId]);

  const fetchPreSummary = async () => {
    try {
      const res = await api.getUninvoicedPreSummary(userToken, customerId);
      if (res.success && res.data) {
        let totalUninvoiced = 0;
        let totalEst = 0;
        res.data.forEach(item => {
          totalUninvoiced += (item.uninvoicedDeliveries || 0);
          totalEst += (item.estimatedTotal || 0);
        });
        if (totalUninvoiced > 0) {
          setPreSummary({ deliveries: totalUninvoiced, total: totalEst });
        } else {
          setPreSummary(null);
        }
      } else {
        setPreSummary(null);
      }
    } catch (err) {
      console.log('Error fetching pre-summary', err);
    }
  };

  const fetchData = async () => {
    try {
      const custRes = await api.listCustomers(userToken);
      if (custRes.success) {
        setCustomers(custRes.data || []);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setApiError('Failed to load customers');
    } finally {
      setLoadingData(false);
    }
  };

  const validate = () => {
    if (!customerId) return 'Please select a customer';
    if (!periodStart || !/^\d{4}-\d{2}-\d{2}$/.test(periodStart)) return 'Start Date must be in YYYY-MM-DD format';
    if (!periodEnd || !/^\d{4}-\d{2}-\d{2}$/.test(periodEnd)) return 'End Date must be in YYYY-MM-DD format';
    if (new Date(periodStart) > new Date(periodEnd)) return 'Start Date cannot be after End Date';
    return null;
  };

  const handleSubmit = async () => {
    const errorMsg = validate();
    if (errorMsg) {
      setApiError(errorMsg);
      showPopup('Notice', errorMsg, [{ text: 'OK' }]);
      return;
    }
    
    setSubmitting(true);
    setApiError('');

    const payload = { periodStart, periodEnd };
    if (customerId) payload.customerId = customerId;

    try {
      console.log('--- GenerateInvoiceScreen: Payload ---', payload);
      const response = await api.generateInvoices(userToken, payload);
      console.log('--- GenerateInvoiceScreen: Response ---', JSON.stringify(response, null, 2));
      const msg = response?.message || '';

      const customerName = customerId ? getCustomerName(customerId) : '';
      const searchQuery = customerName !== 'Select a Customer' ? customerName : '';

      const navigateToInvoice = () => {
        if (response.data?.invoices && response.data.invoices.length === 1) {
          const inv = response.data.invoices[0];
          navigation.replace('InvoiceDetail', { invoiceId: inv.id, invoice: inv });
        } else {
          navigation.navigate('InvoiceList', { searchQuery });
        }
      };

      if (response && response.success && (response.data?.invoicesGenerated === undefined || response.data?.invoicesGenerated > 0)) {
        showAlert('Success', msg || 'Invoices generated successfully', 'success');
        navigateToInvoice();
      } else {
        showAlert('Notice', 'Invoice already generated for this period. Redirecting...', 'info');
        setTimeout(() => {
          navigation.navigate('InvoiceList', { searchQuery });
        }, 1500);
      }
    } catch (err) {
      const customerName = customerId ? getCustomerName(customerId) : '';
      const searchQuery = customerName !== 'Select a Customer' ? customerName : '';
      showAlert('Notice', 'Invoice already generated for this period. Redirecting...', 'info');
      setTimeout(() => {
        navigation.navigate('InvoiceList', { searchQuery });
      }, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  const getCustomerName = (id) => {
    const c = customers.find(c => String(c.id) === String(id));
    return c ? c.name : 'Select a Customer';
  };

  const renderModal = () => {
    if (!activeModal) return null;

    let title = '';
    let data = [];
    let onSelect = () => {};
    let renderItemText = () => {};
    let currentVal = null;
    let showSearch = false;

    if (activeModal === 'customer') {
      title = 'Select Customer';
      data = customers;
      currentVal = customerId;
      renderItemText = (item) => `${item.name} ${item.phone ? `(${item.phone})` : ''}`;
      onSelect = (item) => { setCustomerId(item.id); setActiveModal(null); setModalSearch(''); };
      showSearch = true;
    }

    const filteredData = showSearch && modalSearch.trim()
      ? data.filter(item => {
          const nameMatch = item.name?.toLowerCase().includes(modalSearch.toLowerCase());
          const phoneMatch = item.phone?.toLowerCase().includes(modalSearch.toLowerCase());
          return nameMatch || phoneMatch;
        })
      : data;

    return (
      <Modal
        visible={true}
        transparent
        animationType="slide"
        onRequestClose={() => { setActiveModal(null); setModalSearch(''); }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'transparent' }]}>
          <TouchableWithoutFeedback onPress={() => { setActiveModal(null); setModalSearch(''); }}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
          </TouchableWithoutFeedback>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => { setActiveModal(null); setModalSearch(''); }}>
                <X size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {showSearch && (
              <View style={styles.modalSearchBar}>
                <Search size={17} color={COLORS.textPlaceholder} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Search..."
                  value={modalSearch}
                  onChangeText={setModalSearch}
                  placeholderTextColor={COLORS.textPlaceholder}
                />
              </View>
            )}
            
            {activeModal === 'customer' && (
              <TouchableOpacity 
                style={{ backgroundColor: COLORS.primaryLight, padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 12, marginHorizontal: 24, marginTop: 10 }}
                onPress={() => { setActiveModal(null); setAddCustomerVisible(true); }}
              >
                <Text style={{ color: COLORS.primary, fontFamily: 'Geologica-Bold', fontSize: 14 }}>+ Add New Customer</Text>
              </TouchableOpacity>
            )}
            
            {filteredData.length === 0 ? (
              <Text style={styles.modalEmptyText}>
                No options found.
              </Text>
            ) : (
              <FlatList
                data={filteredData}
                keyboardShouldPersistTaps="handled"
                keyExtractor={item => item.id || 'all'}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const selected = currentVal === item.id;
                  return (
                    <TouchableOpacity
                      style={[styles.modalItem, selected && styles.modalItemActive]}
                      onPress={() => onSelect(item)}
                    >
                      <Text style={[styles.modalItemText, selected && styles.modalItemTextActive]}>
                        {renderItemText(item)}
                      </Text>
                      {selected && (
                        <View style={styles.modalCheckDot} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    );
  };

  if (loadingData) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: COLORS.textPlaceholder }}>Loading data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <CurvedHeader
          title="Generate Invoices"
          leftIcon={<ChevronLeft size={28} color="#FFF" />}
          onLeftPress={() => navigation.goBack()}
          height={130}
          contentStyle={{ paddingTop: Platform.OS === 'ios' ? 40 : 20, paddingBottom: 25 }}
        />
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.titleContainer}>
            <Text style={styles.pageTitle}>
              Generate Invoices
            </Text>
            <Text style={styles.pageSubtitle}>
              Create bills for a specific period
            </Text>
          </View>

          {apiError ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={20} color={COLORS.primary} style={styles.errorIcon} />
              <Text style={styles.errorBannerText}>{apiError}</Text>
            </View>
          ) : null}

          {preSummary ? (
            <View style={styles.preSummaryCard}>
              <View style={styles.preSummaryHeader}>
                <FileText size={18} color="#0EA5E9" style={{marginRight: 6}} />
                <Text style={styles.preSummaryTitle}>Pending to be Invoiced</Text>
              </View>
              <View style={styles.preSummaryRow}>
                <View style={styles.preSummaryStat}>
                  <Text style={styles.preSummaryLabel}>Deliveries</Text>
                  <Text style={styles.preSummaryValue}>{preSummary.deliveries}</Text>
                </View>
                <View style={styles.preSummaryStat}>
                  <Text style={styles.preSummaryLabel}>Estimated Total</Text>
                  <Text style={[styles.preSummaryValue, { color: '#16A34A' }]}>₹{preSummary.total}</Text>
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.form}>
            {/* Customer */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('tabs.customers')} *</Text>
              <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => setActiveModal('customer')}
              >
                <User size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <Text style={[styles.dropdownText, !customerId && { color: COLORS.textPlaceholder }]}>
                  {getCustomerName(customerId)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Start Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Period Start Date *</Text>
              <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Calendar size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <Text style={styles.dropdownText}>
                  {periodStart}
                </Text>
              </TouchableOpacity>
              {showStartDatePicker && (
                <DateTimePicker
                  value={parseDateString(periodStart)}
                  mode="date"
                  display="default"
                  onChange={onStartDateChange}
                />
              )}
            </View>
            
            {/* End Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Period End Date *</Text>
              <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Calendar size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <Text style={styles.dropdownText}>
                  {periodEnd}
                </Text>
              </TouchableOpacity>
              {showEndDatePicker && (
                <DateTimePicker
                  value={parseDateString(periodEnd)}
                  mode="date"
                  display="default"
                  onChange={onEndDateChange}
                />
              )}
            </View>

          </View>
        </ScrollView>

        {/* Floating Bottom Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={[styles.btn, styles.btnPrimary, submitting && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <FileText size={18} color="#FFFFFF" style={{marginRight: 8}} />
                <Text style={styles.btnTextPrimary}>
                  Generate Invoices
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {renderModal()}

      <AddCustomerModal 
        visible={addCustomerVisible}
        onClose={() => setAddCustomerVisible(false)}
        onSuccess={(newCustomer) => {
          setAddCustomerVisible(false);
          setCustomers(prev => [...prev, newCustomer]);
          setCustomerId(newCustomer.id);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginLeft: -8,
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: 'Geologica-Bold',
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 15,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPlaceholder,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    borderRadius: 16,
    marginBottom: 20,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.danger,
  },
  preSummaryCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  preSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  preSummaryTitle: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: '#0369A1',
  },
  preSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  preSummaryStat: {
    flex: 1,
  },
  preSummaryLabel: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: '#0284C7',
    marginBottom: 4,
  },
  preSummaryValue: {
    fontSize: 20,
    fontFamily: 'Geologica-Bold',
    color: '#0F172A',
  },
  form: {
    marginBottom: 0,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 52,
  },
  inputIcon: {
    marginRight: 8,
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 60,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  btn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnTextPrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Geologica-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    padding: 0,
  },
  modalEmptyText: {
    textAlign: 'center',
    padding: 24,
    color: COLORS.textPlaceholder,
    fontSize: 14,
    fontWeight: '500',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  modalItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
    flex: 1,
  },
  modalItemTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  modalCheckDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
});

export default GenerateInvoiceScreen;
