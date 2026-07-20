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
import { ChevronLeft, User, Package, Calendar, Repeat, AlertCircle, CheckCircle, X, Hash } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

const AddSubscriptionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userToken } = useContext(AuthContext);

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
          Alert.alert('Success', 'Subscription updated successfully');
          navigation.goBack();
        } else {
          setApiError(response.message || 'Failed to update subscription');
        }
      } else {
        const response = await api.createSubscription(userToken, subData);
        if (response && response.success) {
          Alert.alert('Success', 'Subscription created successfully');
          navigation.goBack();
        } else {
          setApiError(response.message || 'Failed to create subscription');
        }
      }
    } catch (err) {
      setApiError(err.message || 'Something went wrong');
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

    if (activeModal === 'customer') {
      title = 'Select Customer';
      data = customers;
      currentVal = customerId;
      renderItemText = (item) => `${item.name} ${item.phone ? `(${item.phone})` : ''}`;
      onSelect = (item) => { setCustomerId(item.id); setActiveModal(null); };
    } else if (activeModal === 'product') {
      title = 'Select Product';
      data = products;
      currentVal = productId;
      renderItemText = (item) => item.name;
      onSelect = (item) => { setProductId(item.id); setActiveModal(null); };
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

    return (
      <Modal
        visible={true}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveModal(null)}
        >
          <View style={[styles.modalContent, { maxHeight: '70%' }]} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <X size={24} color={COLORS.textPlaceholder} />
              </TouchableOpacity>
            </View>
            
            {data.length === 0 ? (
              <Text style={{ textAlign: 'center', padding: 20, color: COLORS.textPlaceholder }}>
                No options available.
              </Text>
            ) : (
              <FlatList
                data={data}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => onSelect(item)}
                  >
                    <Text style={[styles.modalItemText, currentVal === item.id && styles.modalItemTextActive]}>
                      {renderItemText(item)}
                    </Text>
                    {currentVal === item.id && (
                      <CheckCircle size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                )}
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
        <Text style={{ marginTop: 10, color: COLORS.textPlaceholder }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Subscription' : 'New Subscription'}
        </Text>
        <View style={styles.headerRightSpacing} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {apiError ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={20} color={COLORS.primary} style={styles.errorIcon} />
              <Text style={styles.errorBannerText}>{apiError}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            {/* Customer */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Customer *</Text>
              <TouchableOpacity 
                style={[styles.inputContainer, isEditMode && styles.inputDisabled]}
                onPress={() => !isEditMode && setActiveModal('customer')}
                disabled={isEditMode}
              >
                <User size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <Text style={[styles.inputText, !customerId && { color: COLORS.textPlaceholder }]}>
                  {getCustomerName(customerId)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Product */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Product *</Text>
              <TouchableOpacity 
                style={[styles.inputContainer, isEditMode && styles.inputDisabled]}
                onPress={() => !isEditMode && setActiveModal('product')}
                disabled={isEditMode}
              >
                <Package size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <Text style={[styles.inputText, !productId && { color: COLORS.textPlaceholder }]}>
                  {getProductName(productId)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quantity */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quantity / Day *</Text>
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
              <Text style={styles.label}>Frequency *</Text>
              <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => setActiveModal('recurrence')}
              >
                <Repeat size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <Text style={styles.inputText}>
                  {formatRecurrence(recurrencePattern)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Start Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Start Date *</Text>
              <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <Text style={styles.inputText}>
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
                <Text style={styles.label}>Status</Text>
                <TouchableOpacity 
                  style={styles.inputContainer}
                  onPress={() => setActiveModal('status')}
                >
                  <CheckCircle size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                  <Text style={[
                    styles.inputText, 
                    { color: status === 'active' ? COLORS.primary : status === 'paused' ? COLORS.primary : COLORS.primary, fontFamily: 'Poppins-Bold' }
                  ]}>
                    {status.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.btn, styles.btnPrimary, submitting && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.btnTextPrimary}>
                  {isEditMode ? 'Save Changes' : 'Create Subscription'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, styles.btnSecondary]}
              onPress={() => navigation.goBack()}
              disabled={submitting}
            >
              <Text style={styles.btnTextSecondary}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: COLORS.primary,
    textAlign: 'center',
    flex: 1,
  },
  headerRightSpacing: {
    width: 40,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.danger,
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
    fontFamily: 'Poppins-Medium',
    color: COLORS.danger,
  },
  form: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
  },
  inputDisabled: {
    backgroundColor: COLORS.borderLight,
    opacity: 0.7,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textPrimary,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textPrimary,
    padding: 0,
  },
  actions: {
    marginTop: 10,
  },
  btn: {
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnTextPrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
  },
  btnTextSecondary: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalItemText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textPrimary,
    flex: 1,
  },
  modalItemTextActive: {
    color: COLORS.primary,
    fontFamily: 'Poppins-Bold',
  },
});

export default AddSubscriptionScreen;
