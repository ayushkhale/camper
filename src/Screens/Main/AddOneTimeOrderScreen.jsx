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
  TouchableWithoutFeedback,
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
  ArrowLeft} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import AddCustomerModal from '../../components/modals/AddCustomerModal';
import AddProductModal from '../../components/modals/AddProductModal';
import CurvedHeader from '../../components/CurvedHeader';

const AddOneTimeOrderScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { userToken, user } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([]); // Array of: { productId, quantity, unitPrice, Product }
  const [orderFrom, setOrderFrom] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [apiError, setApiError] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modals / DatePickers state
  const [activeModal, setActiveModal] = useState(null); // 'customer' | 'product'
  const [activeDatePicker, setActiveDatePicker] = useState(null); // 'orderFrom' | 'orderTo' | null

  const [addCustomerVisible, setAddCustomerVisible] = useState(false);
  const [addProductVisible, setAddProductVisible] = useState(false);

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
      }
    }
  };

  const formatDisplayDate = (str) => {
    if (!str) return 'â€”';
    const [y, m, d] = str.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d} ${months[parseInt(m) - 1]} ${y}`;
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

    const formattedItems = items.map((item) => ({
      productId: item.productId,
      quantity: parseInt(item.quantity),
      unitPrice: parseFloat(item.unitPrice),
    }));

    const orderData = {
      customerId,
      orderFrom,
      notes: notes.trim() || undefined,
      items: formattedItems,
    };

    try {
      const response = await api.createOneTimeOrder(userToken, orderData);
      if (response && response.success) {
        showAlert(
          t('completeReg.success'),
          t('oneTimeOrders.orderSuccess'),
          'success'
        );
        navigation.goBack();
      } else {
        setApiError(response.message || 'Failed to create one-time order');
        showAlert('Error', response.message || 'Failed to create one-time order', 'error');
      }
    } catch (err) {
      setApiError(err.message || 'Something went wrong');
      showAlert('Error', err.message || 'Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getCustomerName = (id) => {
    const c = customers.find((c) => c.id === id);
    return c ? c.name : t('common.selectCustomer');
  };

  const handleAddProductItem = (product) => {
    const exists = items.some((item) => item.productId === product.id);
    if (exists) {
      showAlert('Duplicate Product', 'This product is already added. Modify its quantity instead.', 'warning');
      return;
    }

    const newItem = {
      productId: product.id,
      quantity: '1',
      unitPrice: product.price ? product.price.toString() : '0',
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
    let onSelect = () => { };
    let renderItemText = () => { };
    let currentVal = null;

    if (activeModal === 'customer') {
      title = t('common.selectCustomer');
      data = customers;
      currentVal = customerId;
      renderItemText = (item) => `${item.name} ${item.phone ? `(${item.phone})` : ''}`;
      onSelect = (item) => {
        setCustomerId(item.id);
        setActiveModal(null);
      };
    } else if (activeModal === 'product') {
      title = t('customers.selectProduct');
      data = products;
      renderItemText = (item) => `${item.name} (₹${item.price || '0'})`;
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
        <View style={[styles.modalOverlay, { backgroundColor: 'transparent' }]}>
          <TouchableWithoutFeedback onPress={() => setActiveModal(null)}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
          </TouchableWithoutFeedback>
          <View style={[styles.modalContent, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <X size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {activeModal === 'customer' && (
              <TouchableOpacity
                style={{ backgroundColor: COLORS.primaryLight, padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 12 }}
                onPress={() => { setActiveModal(null); setAddCustomerVisible(true); }}
              >
                <Text style={{ color: COLORS.primary, fontFamily: 'Rubik-Bold', fontSize: 14 }}>{t('common.addNewCustomer')}</Text>
              </TouchableOpacity>
            )}

            {activeModal === 'product' && user?.role !== 'staff' && (
              <TouchableOpacity
                style={{ backgroundColor: COLORS.primaryLight, padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 12 }}
                onPress={() => { setActiveModal(null); setAddProductVisible(true); }}
              >
                <Text style={{ color: COLORS.primary, fontFamily: 'Rubik-Bold', fontSize: 14 }}>{t('common.addNewProduct')}</Text>
              </TouchableOpacity>
            )}

            <FlatList
              data={data}
              keyboardShouldPersistTaps="handled"
              keyExtractor={item => String(item.id)}
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
                  <Text style={{ color: COLORS.textPlaceholder, fontFamily: 'Rubik-SemiBold' }}>
                    {t('common.noItemsAvailable')}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    );
  };

  if (loadingData) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: COLORS.textPlaceholder, fontFamily: 'Rubik-SemiBold' }}>
          {t('common.loading')}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CurvedHeader
        title={
          <View>
            <Text style={{ color: '#0B409C', fontSize: 20, fontFamily: 'Rubik-Bold' }}>
              {t('oneTimeOrders.newOrder', 'New Order')}
            </Text>
            {/* <Text style={{ color: '#E2E8F0', fontSize: 13, fontFamily: 'Rubik-Medium', marginTop: 2 }}>
              Create a one-time product delivery
            </Text> */}
          </View>
        }
        leftIcon={<ArrowLeft size={24} color="#0B409C" />}
        onLeftPress={() => navigation.goBack()}
        height={140}
        contentStyle={{ paddingTop: Platform.OS === 'ios' ? 40 : 20, paddingBottom: 25 }}
      />

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
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('common.selectCustomer')} *</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setActiveModal('customer')}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                  <User size={18} color="#4F46E5" />
                </View>
                <Text style={[styles.inputText, !customerId && { color: COLORS.textPlaceholder }]}>
                  {customerId ? getCustomerName(customerId) : t('common.selectCustomer')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('oneTimeOrders.orderDate') || 'Order Date'} *</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setActiveDatePicker('orderFrom')}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: COLORS.primaryLight }]}>
                  <Calendar size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.inputText}>{formatDisplayDate(orderFrom)}</Text>
              </TouchableOpacity>
            </View>

            {/* Products Selector */}
            <View style={[styles.inputGroup, { marginTop: 8 }]}>
              <View style={styles.productsHeader}>
                <Text style={styles.label}>{t('oneTimeOrders.items')} *</Text>
                <TouchableOpacity
                  style={styles.addProductBtn}
                  onPress={() => setActiveModal('product')}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.addProductBtnText}>{t('oneTimeOrders.addProduct')}</Text>
                </TouchableOpacity>
              </View>

              {items.length === 0 ? (
                <View style={styles.emptyProductsCard}>
                  <Package size={24} color={COLORS.textPlaceholder} style={{ marginBottom: 6 }} />
                  <Text style={styles.emptyProductsText}>{t('oneTimeOrders.noOrdersSub')}</Text>
                </View>
              ) : (
                <View style={styles.itemsListContainer}>
                  {items.map((item) => (
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
                          <Text style={styles.itemInputLabel}>{t('oneTimeOrders.qty')}</Text>
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
                          <Text style={styles.itemInputLabel}>{t('oneTimeOrders.priceOverride')}</Text>
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
              <Text style={styles.label}>{t('common.notes')}</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={t('oneTimeOrders.notesPlaceholder')}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={COLORS.textPlaceholder}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Actions Bar (Matches AddCustomerScreen) */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, submitting && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.btnTextPrimary}>{t('oneTimeOrders.createOrder')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {renderModal()}

      {activeDatePicker && (
        <DateTimePicker
          value={parseDateString(orderFrom)}
          mode="date"
          display="default"
          onChange={onDatePickerChange}
          minimumDate={user?.role === 'staff' ? new Date() : undefined}
        />
      )}

      <AddCustomerModal
        visible={addCustomerVisible}
        onClose={() => setAddCustomerVisible(false)}
        onSuccess={(newCust) => {
          setAddCustomerVisible(false);
          setCustomers(prev => [...prev, newCust]);
          setCustomerId(newCust.id);
        }}
      />

      <AddProductModal
        visible={addProductVisible}
        onClose={() => setAddProductVisible(false)}
        onSuccess={(newProd) => {
          setAddProductVisible(false);
          setProducts(prev => [...prev, newProd]);
          handleAddProductItem(newProd);
        }}
      />
    </View>
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
    paddingTop: 10,
    paddingBottom: 40,
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
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.danger,
  },
  form: {
    marginBottom: 0,
  },
  inputGroup: {
    marginBottom: 20,
  },
  dateRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 12,
    fontFamily: 'Rubik-Bold',
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
    paddingHorizontal: 14,
    height: 52,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textPrimary,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textPrimary,
    padding: 0,
  },
  textAreaContainer: {
    height: 100,
    paddingVertical: 12,
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
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addProductBtnText: {
    fontSize: 12,
    fontFamily: 'Rubik-Bold',
    color: COLORS.primary,
  },
  emptyProductsCard: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  emptyProductsText: {
    fontSize: 13,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textPlaceholder,
  },
  itemsListContainer: {
    marginTop: 4,
  },
  productItemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    fontFamily: 'Rubik-Bold',
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
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  itemInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 8,
    height: 38,
  },
  itemTextInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
    padding: 0,
  },
  currencySymbol: {
    fontSize: 13,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textSecondary,
    marginRight: 4,
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
    fontFamily: 'Rubik-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalItemText: {
    fontSize: 15,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textPrimary,
    flex: 1,
  },
  modalItemTextActive: {
    color: COLORS.primary,
    fontFamily: 'Rubik-Bold',
  },
});

export default AddOneTimeOrderScreen;

