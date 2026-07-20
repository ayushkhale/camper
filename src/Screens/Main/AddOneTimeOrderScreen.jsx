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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  User,
  Package,
  Calendar,
  AlertCircle,
  X,
  Hash,
  Trash2,
  Plus,
  Info,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

const AddOneTimeOrderScreen = () => {
  const navigation = useNavigation();
  const { userToken } = useContext(AuthContext);

  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([]); // Array of: { productId, quantity, unitPrice, Product }
  const [orderFrom, setOrderFrom] = useState(new Date().toISOString().split('T')[0]);
  const [orderTo, setOrderTo] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [apiError, setApiError] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modals / DatePickers state
  const [activeModal, setActiveModal] = useState(null); // 'customer' | 'product'
  const [activeDatePicker, setActiveDatePicker] = useState(null); // 'orderFrom' | 'orderTo' | null

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.listCustomers(userToken),
        api.listProducts(userToken),
      ]);

      if (custRes.success) setCustomers(custRes.data || []);
      if (prodRes.success) setProducts(prodRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setApiError('Failed to load customers or products');
    } finally {
      setLoadingData(false);
    }
  };

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

  const onDatePickerChange = (event, selectedDate) => {
    const pickerType = activeDatePicker;
    setActiveDatePicker(null);
    if (selectedDate) {
      const formatted = formatDateString(selectedDate);
      if (pickerType === 'orderFrom') {
        setOrderFrom(formatted);
        // If orderTo is before orderFrom, update it
        if (orderTo < formatted) {
          setOrderTo(formatted);
        }
      }
      if (pickerType === 'orderTo') {
        if (formatted < orderFrom) {
          Alert.alert('Validation Error', 'End Date cannot be before Start Date');
        } else {
          setOrderTo(formatted);
        }
      }
    }
  };

  const validate = () => {
    if (!customerId) return 'Please select a customer';
    if (items.length === 0) return 'Please add at least one product';
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.quantity || isNaN(item.quantity) || parseInt(item.quantity) < 1) {
        return `Please enter a valid quantity for ${item.Product?.name || 'product'}`;
      }
      if (item.unitPrice === '' || isNaN(item.unitPrice) || parseFloat(item.unitPrice) < 0) {
        return `Please enter a valid price for ${item.Product?.name || 'product'}`;
      }
    }
    if (!orderFrom || !/^\d{4}-\d{2}-\d{2}$/.test(orderFrom)) return 'Start Date must be in YYYY-MM-DD format';
    if (orderTo && !/^\d{4}-\d{2}-\d{2}$/.test(orderTo)) return 'End Date must be in YYYY-MM-DD format';
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

    const formattedItems = items.map((item) => ({
      productId: item.productId,
      quantity: parseInt(item.quantity),
      unitPrice: parseFloat(item.unitPrice),
    }));

    const orderData = {
      customerId,
      orderFrom,
      orderTo,
      notes: notes.trim() || undefined,
      items: formattedItems,
    };

    try {
      const response = await api.createOneTimeOrder(userToken, orderData);
      if (response && response.success) {
        Alert.alert(
          'Success',
          'One-time order created successfully. If scheduled for today, it has been instantly dispatched to the driver.'
        );
        navigation.goBack();
      } else {
        setApiError(response.message || 'Failed to create one-time order');
      }
    } catch (err) {
      setApiError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const getCustomerName = (id) => {
    const c = customers.find((c) => c.id === id);
    return c ? c.name : 'Select Customer';
  };

  const handleAddProductItem = (product) => {
    // Check if product already added
    const exists = items.some((item) => item.productId === product.id);
    if (exists) {
      Alert.alert('Duplicate Product', 'This product is already added. Modify its quantity instead.');
      return;
    }

    const newItem = {
      productId: product.id,
      quantity: '1',
      unitPrice: product.basePrice ? product.basePrice.toString() : '0',
      Product: product,
    };

    setItems([...items, newItem]);
    setActiveModal(null);
  };

  const handleUpdateItemQty = (productId, qty) => {
    const updated = items.map((item) => {
      if (item.productId === productId) {
        return { ...item, quantity: qty };
      }
      return item;
    });
    setItems(updated);
  };

  const handleUpdateItemPrice = (productId, price) => {
    const updated = items.map((item) => {
      if (item.productId === productId) {
        return { ...item, unitPrice: price };
      }
      return item;
    });
    setItems(updated);
  };

  const handleRemoveItem = (productId) => {
    const filtered = items.filter((item) => item.productId !== productId);
    setItems(filtered);
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
      onSelect = (item) => {
        setCustomerId(item.id);
        setActiveModal(null);
      };
    } else if (activeModal === 'product') {
      title = 'Select Product';
      data = products;
      renderItemText = (item) => `${item.name} (₹${item.basePrice || '0'})`;
      onSelect = (item) => {
        handleAddProductItem(item);
      };
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
                <X size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={data}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.id === currentVal;
                return (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => onSelect(item)}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}>
                      {renderItemText(item)}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: COLORS.textPlaceholder, fontFamily: 'Poppins-Regular' }}>
                    No items available
                  </Text>
                </View>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  if (loadingData) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: COLORS.textPlaceholder }}>Loading form data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Ad-hoc Order</Text>
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
              <AlertCircle size={20} color={COLORS.danger} style={styles.errorIcon} />
              <Text style={styles.errorBannerText}>{apiError}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            {/* Customer Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Customer *</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setActiveModal('customer')}
              >
                <User size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <Text style={[styles.inputText, !customerId && { color: COLORS.textPlaceholder }]}>
                  {getCustomerName(customerId)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Date Pickers */}
            <View style={styles.dateRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Order From *</Text>
                <TouchableOpacity
                  style={styles.inputContainer}
                  onPress={() => setActiveDatePicker('orderFrom')}
                >
                  <Calendar size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                  <Text style={styles.inputText}>{orderFrom}</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Order To *</Text>
                <TouchableOpacity
                  style={styles.inputContainer}
                  onPress={() => setActiveDatePicker('orderTo')}
                >
                  <Calendar size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                  <Text style={styles.inputText}>{orderTo}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Products Selector */}
            <View style={[styles.inputGroup, { marginTop: 8 }]}>
              <View style={styles.productsHeader}>
                <Text style={styles.label}>Order Items *</Text>
                <TouchableOpacity
                  style={styles.addProductBtn}
                  onPress={() => setActiveModal('product')}
                >
                  <Plus size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.addProductBtnText}>Add Product</Text>
                </TouchableOpacity>
              </View>

              {items.length === 0 ? (
                <View style={styles.emptyProductsCard}>
                  <Package size={24} color={COLORS.textPlaceholder} style={{ marginBottom: 6 }} />
                  <Text style={styles.emptyProductsText}>No items added yet</Text>
                </View>
              ) : (
                <View style={styles.itemsListContainer}>
                  {items.map((item, index) => (
                    <View key={item.productId} style={styles.productItemCard}>
                      <View style={styles.productItemHeader}>
                        <Text style={styles.productItemName} numberOfLines={1}>
                          {item.Product?.name}
                        </Text>
                        <TouchableOpacity
                          style={styles.removeItemBtn}
                          onPress={() => handleRemoveItem(item.productId)}
                        >
                          <Trash2 size={16} color={COLORS.danger} />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.productItemInputsRow}>
                        {/* Qty field */}
                        <View style={styles.itemInputCol}>
                          <Text style={styles.itemInputLabel}>Qty</Text>
                          <View style={styles.itemInputWrap}>
                            <Hash size={14} color={COLORS.textPlaceholder} style={{ marginRight: 4 }} />
                            <TextInput
                              style={styles.itemTextInput}
                              value={item.quantity}
                              onChangeText={(val) => handleUpdateItemQty(item.productId, val)}
                              keyboardType="number-pad"
                              placeholder="1"
                            />
                          </View>
                        </View>

                        {/* Price field */}
                        <View style={[styles.itemInputCol, { marginLeft: 12 }]}>
                          <Text style={styles.itemInputLabel}>Price Override</Text>
                          <View style={styles.itemInputWrap}>
                            <Text style={styles.currencySymbol}>₹</Text>
                            <TextInput
                              style={styles.itemTextInput}
                              value={item.unitPrice}
                              onChangeText={(val) => handleUpdateItemPrice(item.productId, val)}
                              keyboardType="numeric"
                              placeholder="0.00"
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Notes Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Driver Instructions / Notes</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. Leave at back gate, call customer on arrival"
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={COLORS.textPlaceholder}
                />
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, submitting && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.btnTextPrimary}>Create Ad-hoc Order</Text>
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

      {activeDatePicker && (
        <DateTimePicker
          value={
            activeDatePicker === 'orderFrom' ? parseDateString(orderFrom) : parseDateString(orderTo)
          }
          mode="date"
          display="default"
          onChange={onDatePickerChange}
        />
      )}
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
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 18,
  },
  dateRow: {
    flexDirection: 'row',
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
  textAreaContainer: {
    height: 90,
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  textArea: {
    textAlignVertical: 'top',
    height: '100%',
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  addProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addProductBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    color: COLORS.primary,
  },
  emptyProductsCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  emptyProductsText: {
    fontSize: 12.5,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textPlaceholder,
  },
  itemsListContainer: {
    marginTop: 4,
  },
  productItemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
  },
  productItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  productItemName: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 10,
  },
  removeItemBtn: {
    padding: 2,
  },
  productItemInputsRow: {
    flexDirection: 'row',
  },
  itemInputCol: {
    flex: 1,
  },
  itemInputLabel: {
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  itemInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 8,
    height: 38,
  },
  itemTextInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
    padding: 0,
  },
  currencySymbol: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textSecondary,
    marginRight: 4,
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
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textPrimary,
    flex: 1,
  },
  modalItemTextActive: {
    color: COLORS.primary,
    fontFamily: 'Poppins-Bold',
  },
});

export default AddOneTimeOrderScreen;
