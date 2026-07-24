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
  FlatList
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, User, Package, Calendar, Repeat, AlertCircle, CheckCircle, X, Hash, Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useAlert } from '../../context/AlertContext';

const AddSubscriptionScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { userToken } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const editSub = route.params?.subscription || null;
  const initialCustomerId = route.params?.customerId || '';
  const isEditMode = !!editSub;

  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [productId, setProductId] = useState('');
  const [baseQuantity, setBaseQuantity] = useState('1');
  const [recurrencePattern, setRecurrencePattern] = useState('daily');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('active');
  
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [apiError, setApiError] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'customer', 'product', 'recurrence', 'status'
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

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

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setStartDate(formatDateString(selectedDate));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.listCustomers(userToken),
        api.listProducts(userToken)
      ]);
      
      if (custRes.success) setCustomers(custRes.data || []);
      if (prodRes.success) setProducts(prodRes.data || []);

      if (isEditMode && editSub) {
        setCustomerId(editSub.customerId || editSub.Customer?.id || '');
        setProductId(editSub.productId || editSub.Product?.id || '');
        setBaseQuantity(editSub.baseQuantity?.toString() || '1');
        setRecurrencePattern(editSub.recurrencePattern || 'daily');
        if (editSub.startDate) {
          setStartDate(editSub.startDate.split('T')[0]);
        }
        setStatus(editSub.status || 'active');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setApiError('Failed to load customers or products');
    } finally {
      setLoadingData(false);
    }
  };

  const validate = () => {
    if (!customerId) return 'Please select a customer';
    if (!productId) return 'Please select a product';
    if (!baseQuantity || isNaN(baseQuantity) || parseInt(baseQuantity) < 1) return 'Please enter a valid quantity (min 1)';
    if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return 'Start Date must be in YYYY-MM-DD format';
    return null;
  };

  const handleSubmit = async () => {
    const errorMsg = validate();
    if (errorMsg) {
      setApiError(errorMsg);
      showAlert('Validation Error', errorMsg, 'warning');
      return;
    }
    
    setSubmitting(true);
    setApiError('');

    const subData = {
      customerId,
      productId,
      baseQuantity: parseInt(baseQuantity),
      recurrencePattern,
      startDate,
      status
    };

    try {
      if (isEditMode) {
        const response = await api.updateSubscription(userToken, editSub.id, subData);
        if (response && response.success) {
          showAlert('Success', 'Subscription updated successfully', 'success');
          navigation.goBack();
        } else {
          setApiError(response.message || 'Failed to update subscription');
          showAlert('Error', response.message || 'Failed to update subscription', 'error');
        }
      } else {
        const response = await api.createSubscription(userToken, subData);
        if (response && response.success) {
          showAlert('Success', 'Subscription created successfully', 'success');
          navigation.goBack();
        } else {
          setApiError(response.message || 'Failed to create subscription');
          showAlert('Error', response.message || 'Failed to create subscription', 'error');
        }
      }
    } catch (err) {
      setApiError(err.message || 'Something went wrong');
      showAlert('Error', err.message || 'Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatRecurrence = (pattern) => {
    switch(pattern) {
      case 'daily': return 'Daily';
      case 'alternate_days': return 'Alternate Days';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return pattern;
    }
  };

  const getCustomerName = (id) => {
    const c = customers.find(c => c.id === id);
    return c ? c.name : 'Select Customer';
  };

  const getProductName = (id) => {
    const p = products.find(p => p.id === id);
    return p ? p.name : 'Select Product';
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
    } else if (activeModal === 'product') {
      title = 'Select Product';
      data = products;
      currentVal = productId;
      renderItemText = (item) => item.name;
      onSelect = (item) => { setProductId(item.id); setActiveModal(null); setModalSearch(''); };
      showSearch = true;
    } else if (activeModal === 'recurrence') {
      title = 'Select Frequency';
      data = [
        { id: 'daily', name: 'Daily' },
        { id: 'alternate_days', name: 'Alternate Days' },
        { id: 'weekly', name: 'Weekly' },
        { id: 'monthly', name: 'Monthly' }
      ];
      currentVal = recurrencePattern;
      renderItemText = (item) => item.name;
      onSelect = (item) => { setRecurrencePattern(item.id); setActiveModal(null); };
    } else if (activeModal === 'status') {
      title = 'Select Status';
      data = [
        { id: 'active', name: 'Active' },
        { id: 'paused', name: 'Paused' },
        { id: 'ended', name: 'Ended' }
      ];
      currentVal = status;
      renderItemText = (item) => item.name;
      onSelect = (item) => { setStatus(item.id); setActiveModal(null); };
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
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => { setActiveModal(null); setModalSearch(''); }}
        >
          <View style={[styles.modalContent, { maxHeight: '80%' }]} onStartShouldSetResponder={() => true}>
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
            
            {filteredData.length === 0 ? (
              <Text style={styles.modalEmptyText}>
                No options found.
              </Text>
            ) : (
              <FlatList
                data={filteredData}
                keyExtractor={item => item.id}
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
        </TouchableOpacity>
      </Modal>
    );
  };

  if (loadingData) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: COLORS.textPlaceholder }}>{t('deliveries.updating')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <ChevronLeft size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.pageTitle}>
              {isEditMode ? t('subscriptions.edit') : t('subscriptions.title')}
            </Text>
            <Text style={styles.pageSubtitle}>
              {isEditMode ? 'Update subscription details' : 'Set up a recurring delivery schedule'}
            </Text>
          </View>

          {apiError ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={20} color={COLORS.primary} style={styles.errorIcon} />
              <Text style={styles.errorBannerText}>{apiError}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            {/* Customer */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('tabs.customers')} *</Text>
              <TouchableOpacity 
                style={[styles.inputContainer, isEditMode && styles.inputDisabled]}
                onPress={() => !isEditMode && setActiveModal('customer')}
                disabled={isEditMode}
              >
                <User size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <Text style={[styles.dropdownText, !customerId && { color: COLORS.textPlaceholder }]}>
                  {getCustomerName(customerId)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Product */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('oneTimeOrders.items')} *</Text>
              <TouchableOpacity 
                style={[styles.inputContainer, isEditMode && styles.inputDisabled]}
                onPress={() => !isEditMode && setActiveModal('product')}
                disabled={isEditMode}
              >
                <Package size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <Text style={[styles.dropdownText, !productId && { color: COLORS.textPlaceholder }]}>
                  {getProductName(productId)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quantity */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('subscriptions.quantity')} *</Text>
              <View style={styles.inputContainer}>
                <Hash size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={baseQuantity}
                  onChangeText={setBaseQuantity}
                  keyboardType="number-pad"
                  placeholderTextColor={COLORS.textPlaceholder}
                />
              </View>
            </View>

            {/* Frequency */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('subscriptions.frequency')} *</Text>
              <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => setActiveModal('recurrence')}
              >
                <Repeat size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <Text style={styles.dropdownText}>
                  {formatRecurrence(recurrencePattern)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Start Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('subscriptions.startDate')} *</Text>
              <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <Text style={styles.dropdownText}>
                  {startDate}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={parseDateString(startDate)}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}
            </View>

            {/* Status (Edit Mode Only or Default Active) */}
            {isEditMode && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('products.status')}</Text>
                <TouchableOpacity 
                  style={styles.inputContainer}
                  onPress={() => setActiveModal('status')}
                >
                  <CheckCircle size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                  <Text style={styles.dropdownText}>
                    {status.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

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
              <Text style={styles.btnTextPrimary}>
                {isEditMode ? t('deliveries.saveChanges') : t('subscriptions.title')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {renderModal()}
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
  inputDisabled: {
    backgroundColor: '#F8FAFC',
    opacity: 0.7,
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
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPrimary,
    padding: 0,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
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

export default AddSubscriptionScreen;
