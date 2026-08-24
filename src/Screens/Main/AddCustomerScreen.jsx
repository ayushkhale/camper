import React, { useState, useEffect, useContext, useRef } from 'react';
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
  PermissionsAndroid,
  Animated,
  TouchableWithoutFeedback
} from 'react-native';
import Contacts from 'react-native-contacts';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, User, Phone, MapPin, AlertCircle, IndianRupee, X, Contact, Package, Repeat, Calendar, Plus, ChevronDown, ChevronUp, Hash, Search, ChevronRight, FileText , ArrowLeft} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import CurvedHeader from '../../components/CurvedHeader';
import AddRouteModal from '../../components/modals/AddRouteModal';
import AddProductModal from '../../components/modals/AddProductModal';

const AddCustomerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userToken, user } = useContext(AuthContext);
  const { t } = useTranslation();
  const { showAlert } = useAlert();

  const editCustomer = route.params?.customer || null;
  const isEditMode = !!editCustomer;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [routeId, setRouteId] = useState('');

  // Deposit state (Module 3a)
  const [addDeposit, setAddDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [containerCount, setContainerCount] = useState('1');
  const [depositNotes, setDepositNotes] = useState('');

  const [routes, setRoutes] = useState([]);
  const [routeModalVisible, setRouteModalVisible] = useState(false);

  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [apiError, setApiError] = useState('');

  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Subscription section
  const [addSubscription, setAddSubscription] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productId, setProductId] = useState('');
  const [baseQuantity, setBaseQuantity] = useState('1');
  const [recurrencePattern, setRecurrencePattern] = useState('daily');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [recurrenceModalVisible, setRecurrenceModalVisible] = useState(false);
  const [addRouteVisible, setAddRouteVisible] = useState(false);
  const [addProductInlineVisible, setAddProductInlineVisible] = useState(false);

  // Contacts Modal States
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsList, setContactsList] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState('');

  const contactsPulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (loadingContacts) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(contactsPulseAnim, {
            toValue: 0.75,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(contactsPulseAnim, {
            toValue: 0.35,
            duration: 750,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [loadingContacts]);

  const renderContactsSkeleton = () => (
    <View style={{ paddingVertical: 12, gap: 12 }}>
      {[1, 2, 3, 4, 5].map((key) => (
        <Animated.View key={key} style={[styles.contactRow, { opacity: contactsPulseAnim }]}>
          <View style={[styles.contactAvatar, { backgroundColor: '#E2E8F0' }]} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={[styles.skeletonBar, { width: '55%', height: 16, marginBottom: 6 }]} />
            <View style={[styles.skeletonBar, { width: '35%', height: 12 }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );

  useEffect(() => {
    fetchRoutes();
    fetchProducts();
  }, []);

  const fetchRoutes = async () => {
    try {
      const res = await api.listRoutes(userToken);
      if (res.success) {
        setRoutes(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
    } finally {
      setLoadingRoutes(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.listProducts(userToken);
      if (res.success) setProducts(res.data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (isEditMode && editCustomer) {
      setName(editCustomer.name || '');

      let rawPhone = editCustomer.phone || '';
      if (rawPhone.startsWith('+91') && rawPhone.length > 3) {
        rawPhone = rawPhone.substring(3);
      }
      setPhone(rawPhone);
      setAddress(editCustomer.address || '');
      setOpeningBalance(editCustomer.openingBalance?.toString() || editCustomer.creditLimit?.toString() || '');
      setRouteId(editCustomer.routeId || '');
    }
  }, [isEditMode, editCustomer]);

  const validate = () => {
    let isValid = true;

    if (!name.trim()) {
      setNameError('Name is required');
      isValid = false;
    } else {
      setNameError('');
    }

    if (phone.trim()) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length !== 10) {
        setPhoneError('Enter a valid 10-digit number');
        isValid = false;
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('');
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    setApiError('');

    let formattedPhone = undefined;
    if (phone.trim()) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      formattedPhone = `+91${cleanPhone}`;
    }

    const customerData = {
      name: name.trim(),
      address: address.trim() || undefined,
      routeId: routeId || undefined,
    };

    if (!isEditMode) {
      customerData.openingBalance = openingBalance ? parseFloat(openingBalance) : 0;
    }

    if (formattedPhone) {
      customerData.phone = formattedPhone;
    }

    try {
      if (isEditMode) {
        const response = await api.updateCustomer(userToken, editCustomer.id, customerData);
        if (response && response.success) {
          showAlert('Success', t('customers.updateSuccess'), 'success');
          navigation.goBack();
        } else {
          setApiError(response.message || 'Failed to update customer');
        }
      } else {
        const response = await api.createCustomer(userToken, customerData);
        if (response && response.success) {
          const newCustomerId = response.data?.id;

          // Collect Deposit if amount specified and toggle active (Module 3a)
          if (addDeposit && newCustomerId && depositAmount && parseFloat(depositAmount) > 0) {
            try {
              await api.collectDeposit(userToken, {
                customerId: newCustomerId,
                amount: parseFloat(depositAmount),
                containerCount: parseInt(containerCount) || 1,
                notes: depositNotes.trim() || 'Deposit collected at onboarding',
              });
            } catch (depErr) {
              console.error('Error collecting deposit during customer creation:', depErr);
            }
          }

          // If subscription fields are filled, create subscription too
          if (addSubscription && productId && newCustomerId) {
            try {
              await api.createSubscription(userToken, {
                customerId: newCustomerId,
                productId,
                baseQuantity: parseInt(baseQuantity) || 1,
                recurrencePattern,
                startDate,
                status: 'active',
              });
              showAlert('Success', t('customers.addWithSubSuccess'), 'success');
            } catch (subErr) {
              showAlert(t('customers.partialSuccess'), subErr.message || '', 'warning');
            }
          } else {
            showAlert('Success', t('customers.addSuccess'), 'success');
          }
          navigation.goBack();
        } else {
          setApiError(response.message || 'Failed to add customer');
        }
      }
    } catch (err) {
      setApiError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
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
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return new Date();
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setStartDate(formatDateString(selectedDate));
  };

  const formatRecurrence = (pattern) => {
    switch (pattern) {
      case 'daily': return 'Daily';
      case 'alternate_days': return 'Alternate Days';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return pattern;
    }
  };

  const getProductName = (id) => {
    const p = products.find(p => p.id === id);
    return p ? p.name : 'Select Product';
  };

  const handleImportContacts = async () => {
    setContactModalVisible(true);
    setLoadingContacts(true);
    setContactSearch('');

    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Contacts Permission',
            message: 'This app needs access to your contacts to import customer details.',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          showAlert('Permission Denied', 'Cannot access contacts without permission', 'warning');
          setLoadingContacts(false);
          setContactModalVisible(false);
          return;
        }
      } else if (Platform.OS === 'ios') {
        const status = await Contacts.checkPermission();
        if (status === 'undefined' || status === 'denied' || status === 'notAuthorized') {
          const res = await Contacts.requestPermission();
          if (res !== 'authorized') {
            showAlert('Permission Denied', 'Cannot access contacts without permission', 'warning');
            setLoadingContacts(false);
            setContactModalVisible(false);
            return;
          }
        }
      }

      const allContacts = await Contacts.getAll();

      const formatted = (allContacts || [])
        .filter(c => c.phoneNumbers && c.phoneNumbers.length > 0)
        .map(c => {
          const rawPhone = c.phoneNumbers[0].number || '';
          const cleanPhone = rawPhone.replace(/\s+/g, '').replace(/-/g, '');
          return {
            id: c.recordID || String(Math.random()),
            name: c.displayName || `${c.givenName || ''} ${c.familyName || ''}`.trim() || 'Unknown',
            phone: cleanPhone,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      setContactsList(formatted);
      setFilteredContacts(formatted);
    } catch (err) {
      console.log('Error picking contact:', err);
      showAlert('Error', 'Could not load contacts', 'error');
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleSearchContacts = (text) => {
    setContactSearch(text);
    if (!text.trim()) {
      setFilteredContacts(contactsList);
      return;
    }
    const lower = text.toLowerCase();
    const filtered = contactsList.filter(c =>
      c.name.toLowerCase().includes(lower) ||
      c.phone.replace(/[^0-9]/g, '').includes(lower)
    );
    setFilteredContacts(filtered);
  };

  const handleSelectContact = (contact) => {
    setName(contact.name);
    let cleanPhone = contact.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length > 10) {
      cleanPhone = cleanPhone.substring(cleanPhone.length - 10);
    }
    setPhone(cleanPhone);
    setContactModalVisible(false);
    setContactSearch('');
  };

  const getRouteName = (id) => {
    const r = routes.find(r => r.id === id);
    return r ? r.name : 'Select Route';
  };

  const renderRouteModal = () => (
    <Modal
      visible={routeModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setRouteModalVisible(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'transparent' }]}>
        <TouchableWithoutFeedback onPress={() => setRouteModalVisible(false)}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          {/* Handle bar */}
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('customers.selectRoute')}</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setRouteModalVisible(false)}>
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {user?.role !== 'staff' && (
            <TouchableOpacity 
              style={{ backgroundColor: COLORS.primaryLight, padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 12, marginHorizontal: 24, marginTop: 10 }}
              onPress={() => { setRouteModalVisible(false); setAddRouteVisible(true); }}
            >
              <Text style={{ color: COLORS.primary, fontFamily: 'Rubik-Bold', fontSize: 14 }}>{t('common.addNewRoute')}</Text>
            </TouchableOpacity>
          )}

          {loadingRoutes ? (
            <View style={{ padding: 30, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : routes.length === 0 ? (
            <Text style={styles.modalEmptyText}>{t('customers.noRouteAssigned')}</Text>
          ) : (
            <FlatList
              data={routes}
              keyboardShouldPersistTaps="handled"
              keyExtractor={item => item.id}
              style={{ maxHeight: 320 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const selected = routeId === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.modalRouteItem, selected && styles.modalRouteItemActive]}
                    onPress={() => { setRouteId(item.id); setRouteModalVisible(false); }}
                  >
                    <View style={[styles.modalRouteIcon, selected && { backgroundColor: COLORS.primary }]}>
                      <MapPin size={16} color={selected ? '#FFF' : COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalRouteText, selected && { color: COLORS.primary, fontWeight: '700' }]}>
                        {item.name}
                      </Text>
                      {item.areaCode ? <Text style={styles.modalRouteSubText}>{item.areaCode}</Text> : null}
                    </View>
                    {selected && (
                      <View style={styles.modalCheckDot} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          <TouchableOpacity
            style={styles.modalClearBtn}
            onPress={() => { setRouteId(''); setRouteModalVisible(false); }}
          >
            <Text style={styles.modalClearBtnText}>{t('customers.clearRoute')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderContactsModal = () => (
    <Modal
      visible={contactModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setContactModalVisible(false)}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalContent, { maxHeight: '85%' }]}>
          {/* Handle bar */}
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('customers.importContacts')}</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setContactModalVisible(false)}>
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.modalSearchBar}>
            <Search size={17} color={COLORS.textPlaceholder} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search by name or number..."
              value={contactSearch}
              onChangeText={handleSearchContacts}
              placeholderTextColor={COLORS.textPlaceholder}
            />
          </View>

          {loadingContacts ? (
            renderContactsSkeleton()
          ) : filteredContacts.length === 0 ? (
            <Text style={styles.modalEmptyText}>No contacts found.</Text>
          ) : (
            <FlatList
              data={filteredContacts}
              keyboardShouldPersistTaps="handled"
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 12 }}
              renderItem={({ item }) => {
                const initials = item.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
                return (
                  <TouchableOpacity
                    style={styles.contactRow}
                    onPress={() => handleSelectContact(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.contactAvatar}>
                      <Text style={styles.contactAvatarText}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactName}>{item.name}</Text>
                      <Text style={styles.contactPhone}>{item.phone}</Text>
                    </View>
                    <ChevronRight size={16} color={COLORS.textPlaceholder} />
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <CurvedHeader
        title={isEditMode ? t('customers.editCustomer') : t('customers.addNew')}
        leftIcon={<ArrowLeft size={24} color="#0B409C" />}
        onLeftPress={() => navigation.goBack()}
        height={110}
        contentStyle={{ paddingTop: 10, paddingBottom: 25 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 }]}
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
            {!isEditMode && (
              <TouchableOpacity
                style={styles.importBtn}
                onPress={handleImportContacts}
                activeOpacity={0.7}
              >
                <Contact size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.importBtnText}>{t('customers.importContacts')}</Text>
              </TouchableOpacity>
            )}

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('customers.name')} *</Text>
              <View style={[styles.inputContainer, nameError ? styles.inputErrorBorder : null]}>
                <View style={[styles.inputIconBox, { backgroundColor: '#E0E7FF' }]}>
                  <User size={18} color="#4F46E5" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder={t('customers.namePlaceholder')}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  placeholderTextColor={COLORS.textPlaceholder}
                />
              </View>
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('customers.phone')}</Text>
              <View style={[styles.inputContainer, phoneError ? styles.inputErrorBorder : null]}>
                <View style={[styles.inputIconBox, { backgroundColor: '#DCFCE7' }]}>
                  <Phone size={18} color="#16A34A" />
                </View>
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={styles.input}
                  placeholder="9876543210"
                  value={phone}
                  onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  maxLength={10}
                  placeholderTextColor={COLORS.textPlaceholder}
                />
              </View>
              {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('customers.address')}</Text>
              <View style={[styles.inputContainer, { height: 'auto', minHeight: 110, alignItems: 'flex-start', paddingTop: 16, paddingBottom: 16 }]}>
                <View style={[styles.inputIconBox, { backgroundColor: '#E0E7FF' }]}>
                  <MapPin size={18} color="#4F46E5" />
                </View>
                <TextInput
                  style={[styles.input, { minHeight: 78, textAlignVertical: 'top', paddingTop: Platform.OS === 'ios' ? 7 : 4 }]}
                  placeholder={t('customers.addressPlaceholder')}
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  placeholderTextColor={COLORS.textPlaceholder}
                />
              </View>
            </View>

            {/* Opening Balance */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('customers.accountOverview')}</Text>
              <View style={[styles.inputContainer, isEditMode && { backgroundColor: '#F3F4F6' }]}>
                <View style={[styles.inputIconBox, { backgroundColor: '#FFE4E6' }]}>
                  <IndianRupee size={18} color="#E11D48" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 1500"
                  value={openingBalance}
                  onChangeText={(val) => setOpeningBalance(val.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                  placeholderTextColor={COLORS.textPlaceholder}
                  editable={!isEditMode}
                />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 6, backgroundColor: '#FFFBEB', paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#FEF3C7' }}>
                <AlertCircle size={14} color="#D97706" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 11.5, fontFamily: 'Rubik-SemiBold', color: '#D97706' }}>
                  {t('customers.openingBalanceCantChange')}
                </Text>
              </View>
            </View>

            {/* Route */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('customers.route')}</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setRouteModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.inputIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <MapPin size={18} color="#D97706" />
                </View>
                <Text style={[styles.dropdownText, !routeId && { color: COLORS.textPlaceholder }]} numberOfLines={1}>
                  {routeId ? getRouteName(routeId) : t('customers.selectRoute')}
                </Text>
                <ChevronDown size={18} color={COLORS.textPlaceholder} />
              </TouchableOpacity>
            </View>

          </View>

          {/* Security Deposit Section - Collapsible Dropdown (Optional & Hidden) */}
          {!isEditMode && (
            <>
              <TouchableOpacity
                style={styles.subscriptionToggle}
                onPress={() => setAddDeposit(!addDeposit)}
                activeOpacity={0.7}
              >
                <View style={styles.subscriptionToggleLeft}>
                  <View style={styles.subToggleIcon}>
                    <IndianRupee size={18} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.subToggleTitle} numberOfLines={1}>{t('products.depositAmount')}</Text>
                    <Text style={styles.subToggleSubtitle} numberOfLines={2}>{t('customers.addSubDesc')}</Text>
                  </View>
                </View>
                {addDeposit
                  ? <ChevronUp size={20} color={COLORS.textSecondary} />
                  : <ChevronDown size={20} color={COLORS.textSecondary} />}
              </TouchableOpacity>

              {addDeposit && (
                <View style={styles.subscriptionSection}>
                  {/* Deposit Amount */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('products.depositAmountLabel')}</Text>
                    <View style={styles.inputContainer}>
                      <View style={[styles.inputIconBox, { backgroundColor: '#FFE4E6' }]}>
                        <IndianRupee size={18} color="#E11D48" />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 300"
                        value={depositAmount}
                        onChangeText={(val) => setDepositAmount(val.replace(/[^0-9.]/g, ''))}
                        keyboardType="decimal-pad"
                        placeholderTextColor={COLORS.textPlaceholder}
                      />
                    </View>
                  </View>

                  {/* Container Count */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('customers.quantity')}</Text>
                    <View style={styles.inputContainer}>
                      <View style={[styles.inputIconBox, { backgroundColor: '#CFFAFE' }]}>
                        <Package size={18} color="#0891B2" />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 3"
                        value={containerCount}
                        onChangeText={(val) => setContainerCount(val.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        placeholderTextColor={COLORS.textPlaceholder}
                      />
                    </View>
                  </View>

                  {/* Deposit Notes */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('oneTimeOrders.driverNotes')}</Text>
                    <View style={styles.inputContainer}>
                      <View style={[styles.inputIconBox, { backgroundColor: '#F1F5F9' }]}>
                        <FileText size={18} color="#64748B" />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder={t('oneTimeOrders.notesPlaceholder')}
                        value={depositNotes}
                        onChangeText={setDepositNotes}
                        placeholderTextColor={COLORS.textPlaceholder}
                      />
                    </View>
                  </View>
                </View>
              )}
            </>
          )}

          {/* Subscription Section - only in add mode */}
          {!isEditMode && (
            <>
              <TouchableOpacity
                style={styles.subscriptionToggle}
                onPress={() => setAddSubscription(!addSubscription)}
                activeOpacity={0.7}
              >
                <View style={styles.subscriptionToggleLeft}>
                  <View style={styles.subToggleIcon}>
                    <Plus size={18} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.subToggleTitle} numberOfLines={1}>{t('customers.addSubscription')}</Text>
                    <Text style={styles.subToggleSubtitle} numberOfLines={2}>{t('customers.addSubDesc')}</Text>
                  </View>
                </View>
                {addSubscription
                  ? <ChevronUp size={20} color={COLORS.textSecondary} />
                  : <ChevronDown size={20} color={COLORS.textSecondary} />}
              </TouchableOpacity>

              {addSubscription && (
                <View style={styles.subscriptionSection}>
                  {/* Product */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('customers.product')} *</Text>
                    <TouchableOpacity
                      style={styles.inputContainer}
                      onPress={() => setProductModalVisible(true)}
                    >
                      <View style={[styles.inputIconBox, { backgroundColor: '#F3E8FF' }]}>
                        <Package size={18} color="#9333EA" />
                      </View>
                      <Text style={[styles.dropdownText, !productId && { color: COLORS.textPlaceholder }]} numberOfLines={1}>
                        {productId ? getProductName(productId) : t('customers.selectProduct')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Quantity */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('customers.quantity')} *</Text>
                    <View style={styles.inputContainer}>
                      <View style={[styles.inputIconBox, { backgroundColor: '#FEF3C7' }]}>
                        <Hash size={18} color="#D97706" />
                      </View>
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
                    <Text style={styles.label}>{t('customers.frequency')} *</Text>
                    <TouchableOpacity
                      style={styles.inputContainer}
                      onPress={() => setRecurrenceModalVisible(true)}
                    >
                      <View style={[styles.inputIconBox, { backgroundColor: '#FFE4E6' }]}>
                        <Repeat size={18} color="#E11D48" />
                      </View>
                      <Text style={styles.dropdownText} numberOfLines={1}>
                        {formatRecurrence(recurrencePattern)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Start Date */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('customers.startDate')} *</Text>
                    <TouchableOpacity
                      style={styles.inputContainer}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <View style={[styles.inputIconBox, { backgroundColor: '#E0F2FE' }]}>
                        <Calendar size={18} color="#0284C7" />
                      </View>
                      <Text style={styles.dropdownText} numberOfLines={1}>
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
                </View>
              )}
            </>
          )}

          {/* Product Modal */}
          <Modal
            visible={productModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setProductModalVisible(false)}
          >
            <View style={[styles.modalOverlay, { backgroundColor: 'transparent' }]}>
              <TouchableWithoutFeedback onPress={() => setProductModalVisible(false)}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
              </TouchableWithoutFeedback>
              <View style={[styles.modalContent, { maxHeight: '70%' }]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('customers.selectProduct')}</Text>
                  <TouchableOpacity onPress={() => setProductModalVisible(false)}>
                    <X size={24} color={COLORS.textPlaceholder} />
                  </TouchableOpacity>
                </View>

                {user?.role !== 'staff' && (
                  <TouchableOpacity 
                    style={{ backgroundColor: COLORS.primaryLight, padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 12, marginHorizontal: 24, marginTop: 10 }}
                    onPress={() => { setProductModalVisible(false); setAddProductInlineVisible(true); }}
                  >
                    <Text style={{ color: COLORS.primary, fontFamily: 'Rubik-Bold', fontSize: 14 }}>{t('common.addNewProduct')}</Text>
                  </TouchableOpacity>
                )}

                {loadingProducts ? (
                  <ActivityIndicator size="small" color={COLORS.primary} style={{ padding: 20 }} />
                ) : products.length === 0 ? (
                  <Text style={{ textAlign: 'center', padding: 20, color: COLORS.textPlaceholder }}>{t('products.noProductsTitle')}</Text>
                ) : (
                  <FlatList
                    data={products}
                    keyboardShouldPersistTaps="handled"
                    keyExtractor={item => item.id}
                    style={{ maxHeight: 300 }}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.modalItem}
                        onPress={() => { setProductId(item.id); setProductModalVisible(false); }}
                      >
                        <Text style={[styles.modalItemText, productId === item.id && styles.modalItemTextActive]}>
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                )}
              </View>
            </View>
          </Modal>

          {/* Recurrence Modal */}
          <Modal
            visible={recurrenceModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setRecurrenceModalVisible(false)}
          >
            <View style={[styles.modalOverlay, { backgroundColor: 'transparent' }]}>
              <TouchableWithoutFeedback onPress={() => setRecurrenceModalVisible(false)}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
              </TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('customers.selectFrequency')}</Text>
                  <TouchableOpacity onPress={() => setRecurrenceModalVisible(false)}>
                    <X size={24} color={COLORS.textPlaceholder} />
                  </TouchableOpacity>
                </View>
                {['daily', 'alternate_days', 'weekly', 'monthly'].map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={styles.modalItem}
                    onPress={() => { setRecurrencePattern(opt); setRecurrenceModalVisible(false); }}
                  >
                    <Text style={[styles.modalItemText, recurrencePattern === opt && styles.modalItemTextActive]}>
                      {formatRecurrence(opt)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Modal>

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
                {isEditMode ? t('customers.saveChanges') : t('customers.addNew')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {renderRouteModal()}
      {renderContactsModal()}

      <AddRouteModal 
        visible={addRouteVisible}
        onClose={() => setAddRouteVisible(false)}
        onSuccess={(newRoute) => {
          setAddRouteVisible(false);
          setRoutes(prev => [...prev, newRoute]);
          setRouteId(newRoute.id);
        }}
      />
      
      <AddProductModal 
        visible={addProductInlineVisible}
        onClose={() => setAddProductInlineVisible(false)}
        onSuccess={(newProduct) => {
          setAddProductInlineVisible(false);
          setProducts(prev => [...prev, newProduct]);
          setProductId(newProduct.id);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Sleek background color for the form screen
  },
  keyboardAvoid: {
    flex: 1,
  },
  depositSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  pageSubtitle: {
    fontSize: 15,
    fontFamily: 'Rubik-SemiBold',
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
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.danger,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  importBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
  },
  form: {
    marginBottom: 0,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Rubik-SemiBold',
    color: '#475569',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  countryCode: {
    fontSize: 15,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.primary,
    marginRight: 4,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontFamily: 'Rubik-Medium',
    color: '#1E293B',
    padding: 0,
  },
  inputErrorBorder: {
    borderColor: COLORS.primary,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Rubik-Medium',
    color: COLORS.danger,
    marginTop: 4,
  },
  helperText: {
    fontSize: 11,
    fontFamily: 'Rubik-Medium',
    color: COLORS.textPlaceholder,
    marginTop: 6,
    paddingHorizontal: 2,
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
  modalEmptyText: {
    textAlign: 'center',
    padding: 24,
    color: COLORS.textPlaceholder,
    fontSize: 14,
    fontWeight: '500',
  },
  // Route modal items
  modalRouteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  modalRouteItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  modalRouteIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalRouteText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalRouteSubText: {
    fontSize: 12,
    color: COLORS.textPlaceholder,
    marginTop: 2,
  },
  modalCheckDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  modalClearBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalClearBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  // Search bar in contacts modal
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
  // Contact rows
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  contactAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  contactPhone: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  // Generic modal item (still used by product/frequency pickers)
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  modalItemTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  subscriptionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    marginTop: 0,
  },
  subscriptionToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subToggleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  subToggleTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  subToggleSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  subscriptionSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 20,
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textPrimary,
  },
  skeletonBar: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
});

export default AddCustomerScreen;

