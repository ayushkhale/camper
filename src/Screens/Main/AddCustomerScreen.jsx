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
  PermissionsAndroid
} from 'react-native';
import Contacts from 'react-native-contacts';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, User, Phone, MapPin, AlertCircle, IndianRupee, X, Contact } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

const AddCustomerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userToken } = useContext(AuthContext);

  const editCustomer = route.params?.customer || null;
  const isEditMode = !!editCustomer;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [routeId, setRouteId] = useState('');
  
  const [routes, setRoutes] = useState([]);
  const [routeModalVisible, setRouteModalVisible] = useState(false);
  
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [apiError, setApiError] = useState('');
  
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Contacts Modal States
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [contactsList, setContactsList] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  useEffect(() => {
    fetchRoutes();
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

  useEffect(() => {
    if (isEditMode && editCustomer) {
      setName(editCustomer.name || '');
      
      let rawPhone = editCustomer.phone || '';
      if (rawPhone.startsWith('+91') && rawPhone.length > 3) {
        rawPhone = rawPhone.substring(3);
      }
      setPhone(rawPhone);
      setAddress(editCustomer.address || '');
      setCreditLimit(editCustomer.creditLimit?.toString() || '');
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

    if (!isEditMode && phone.trim()) {
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
      creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
      routeId: routeId || undefined,
    };

    if (!isEditMode && formattedPhone) {
      customerData.phone = formattedPhone;
    }

    try {
      if (isEditMode) {
        const response = await api.updateCustomer(userToken, editCustomer.id, customerData);
        if (response && response.success) {
          Alert.alert('Success', 'Customer updated successfully');
          navigation.goBack();
        } else {
          setApiError(response.message || 'Failed to update customer');
        }
      } else {
        const response = await api.createCustomer(userToken, customerData);
        if (response && response.success) {
          Alert.alert('Success', 'Customer added successfully');
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

  const handleImportContacts = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Contacts Permission',
            message: 'App needs access to your contacts to import customer details.',
            buttonPositive: 'Allow',
            buttonNegative: 'Cancel',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission denied', 'Cannot access contacts');
          return;
        }
      }
      
      if (Platform.OS === 'ios') {
        const status = await Contacts.checkPermission();
        if (status === 'undefined' || status === 'denied') {
          const res = await Contacts.requestPermission();
          if (res !== 'authorized') {
            Alert.alert('Permission denied', 'Cannot access contacts');
            return;
          }
        }
      }

      setContactModalVisible(true);
      setLoadingContacts(true);
      
      const allContacts = await Contacts.getAll();
      
      const formatted = allContacts
        .filter(c => c.phoneNumbers && c.phoneNumbers.length > 0)
        .map(c => ({
          id: c.recordID,
          name: c.displayName || `${c.givenName || ''} ${c.familyName || ''}`.trim() || 'Unknown',
          phone: c.phoneNumbers[0].number
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setContactsList(formatted);
      setFilteredContacts(formatted);
    } catch (err) {
      console.log('Error picking contact:', err);
      Alert.alert('Error', 'Could not load contacts');
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
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setRouteModalVisible(false)}
      >
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Route</Text>
            <TouchableOpacity onPress={() => setRouteModalVisible(false)}>
              <X size={24} color={COLORS.textPlaceholder} />
            </TouchableOpacity>
          </View>
          
          {loadingRoutes ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : routes.length === 0 ? (
            <Text style={{ textAlign: 'center', padding: 20, color: COLORS.textPlaceholder }}>
              No routes available.
            </Text>
          ) : (
            <FlatList
              data={routes}
              keyExtractor={item => item.id}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setRouteId(item.id);
                    setRouteModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, routeId === item.id && styles.modalItemTextActive]}>
                    {item.name} {item.areaCode ? `(${item.areaCode})` : ''}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
          
          <TouchableOpacity 
            style={[styles.modalItem, { borderBottomWidth: 0, marginTop: 10 }]}
            onPress={() => {
              setRouteId('');
              setRouteModalVisible(false);
            }}
          >
            <Text style={styles.modalItemText}>Clear Selection</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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
        <View style={[styles.modalContent, { maxHeight: '80%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Contact</Text>
            <TouchableOpacity onPress={() => setContactModalVisible(false)}>
              <X size={24} color={COLORS.textPlaceholder} />
            </TouchableOpacity>
          </View>

          <View style={[styles.inputContainer, { marginBottom: 15 }]}>
            <TextInput
              style={styles.input}
              placeholder="Search contacts..."
              value={contactSearch}
              onChangeText={handleSearchContacts}
              placeholderTextColor={COLORS.textPlaceholder}
            />
          </View>
          
          {loadingContacts ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={{ marginTop: 10, color: COLORS.textPlaceholder }}>Loading contacts...</Text>
            </View>
          ) : filteredContacts.length === 0 ? (
            <Text style={{ textAlign: 'center', padding: 20, color: COLORS.textPlaceholder }}>
              No contacts found.
            </Text>
          ) : (
            <FlatList
              data={filteredContacts}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelectContact(item)}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  <Text style={{ color: COLORS.textPlaceholder, fontSize: 13, marginTop: 4 }}>
                    {item.phone}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Customer' : 'Add New Customer'}
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
            {!isEditMode && (
              <TouchableOpacity 
                style={styles.importBtn} 
                onPress={handleImportContacts}
                activeOpacity={0.7}
              >
                <Contact size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.importBtnText}>Import from Contacts</Text>
              </TouchableOpacity>
            )}

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <View style={[styles.inputContainer, nameError ? styles.inputErrorBorder : null]}>
                <User size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Ramesh Kumar"
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
              <Text style={styles.label}>Phone (Optional)</Text>
              <View style={[styles.inputContainer, phoneError ? styles.inputErrorBorder : null]}>
                <Phone size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={styles.input}
                  placeholder="9876543210"
                  value={phone}
                  onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  maxLength={10}
                  placeholderTextColor={COLORS.textPlaceholder}
                  disabled={isEditMode && !!editCustomer?.phone}
                  editable={!(isEditMode && !!editCustomer?.phone)}
                />
              </View>
              {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
              {isEditMode && editCustomer?.phone && (
                <Text style={styles.helperText}>
                  Phone number cannot be changed once assigned.
                </Text>
              )}
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address (Optional)</Text>
              <View style={[styles.inputContainer, { height: 80, alignItems: 'flex-start', paddingTop: 12 }]}>
                <MapPin size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { height: 60 }]}
                  placeholder="e.g. Flat 402, Building A"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  placeholderTextColor={COLORS.textPlaceholder}
                />
              </View>
            </View>

            {/* Credit Limit */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Credit Limit (Optional)</Text>
              <View style={styles.inputContainer}>
                <IndianRupee size={18} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 1500"
                  value={creditLimit}
                  onChangeText={(val) => setCreditLimit(val.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                  placeholderTextColor={COLORS.textPlaceholder}
                />
              </View>
            </View>

            {/* Route */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Route (Optional)</Text>
              <TouchableOpacity 
                style={[styles.inputContainer, { justifyContent: 'space-between' }]}
                onPress={() => setRouteModalVisible(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MapPin size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                  <Text style={[styles.input, { marginTop: 14, color: routeId ? COLORS.primary : COLORS.textPlaceholder }]}>
                    {getRouteName(routeId)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

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
                  {isEditMode ? 'Save Changes' : 'Add Customer'}
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
      {renderRouteModal()}
      {renderContactsModal()}
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
    borderBottomColor: COLORS.textPlaceholder,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
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
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
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
    fontFamily: 'Inter-Medium',
    color: COLORS.danger,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.textPlaceholder,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
  },
  importBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  form: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: COLORS.textPlaceholder,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  countryCode: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: COLORS.primary,
    marginRight: 4,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: COLORS.primary,
    padding: 0,
  },
  inputErrorBorder: {
    borderColor: COLORS.primary,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: COLORS.danger,
    marginTop: 4,
  },
  helperText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: COLORS.textPlaceholder,
    marginTop: 6,
    paddingHorizontal: 2,
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
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
  },
  btnTextPrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter-Bold',
  },
  btnTextSecondary: {
    color: COLORS.textPlaceholder,
    fontSize: 15,
    fontFamily: 'Inter-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.primaryLight,
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
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
  },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textPlaceholder,
  },
  modalItemText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: COLORS.textPrimary,
  },
  modalItemTextActive: {
    color: COLORS.textPrimary,
    fontFamily: 'Inter-Bold',
  },
});

export default AddCustomerScreen;
