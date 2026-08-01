import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Modal,
  ScrollView
} from 'react-native';
import { User, Phone, MapPin, X, ChevronDown, IndianRupee, AlertCircle } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { useAlert } from '../../context/AlertContext';
import AddRouteModal from './AddRouteModal';

const AddCustomerModal = ({ visible, onClose, onSuccess }) => {
  const { userToken } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [routeId, setRouteId] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  // Sub-modal for route selection
  const [routePickerVisible, setRoutePickerVisible] = useState(false);
  // Sub-modal for route creation
  const [addRouteVisible, setAddRouteVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchRoutes();
    }
  }, [visible]);

  const fetchRoutes = async () => {
    setLoadingRoutes(true);
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

  const getRouteName = (id) => {
    const r = routes.find(r => r.id === id);
    return r ? r.name : 'Select Route';
  };

  const validateForm = () => {
    if (!name.trim()) {
      showAlert('Required', 'Name is required', 'warning');
      return false;
    }
    if (phone.trim()) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length !== 10) {
        showAlert('Invalid', 'Enter a valid 10-digit number', 'warning');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    let formattedPhone = undefined;
    if (phone.trim()) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      formattedPhone = `+91${cleanPhone}`;
    }

    const customerData = {
      name: name.trim(),
      address: address.trim() || undefined,
      routeId: routeId || undefined,
      openingBalance: openingBalance ? parseFloat(openingBalance) : 0,
    };
    if (formattedPhone) {
      customerData.phone = formattedPhone;
    }

    try {
      const res = await api.createCustomer(userToken, customerData);
      if (res.success && res.data) {
        showAlert('Success', t('customers.addSuccess'), 'success');
        // reset form
        setName('');
        setPhone('');
        setAddress('');
        setRouteId('');
        setOpeningBalance('');
        
        onSuccess(res.data);
      } else {
        throw new Error(res.message || 'Failed to add customer');
      }
    } catch (err) {
      console.error('Submit customer error:', err);
      showAlert('Error', err.message || 'Error saving customer', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quick Add Customer</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
                <X size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.form}>
                {/* Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('customers.name')} *</Text>
                  <View style={styles.inputContainer}>
                    <User size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('customers.namePlaceholder')}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      placeholderTextColor={COLORS.textPlaceholder}
                    />
                  </View>
                </View>

                {/* Phone */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('customers.phone')}</Text>
                  <View style={styles.inputContainer}>
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
                    />
                  </View>
                </View>

                {/* Address */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('customers.address')}</Text>
                  <View style={[styles.inputContainer, { height: 80, alignItems: 'flex-start', paddingVertical: 12 }]}>
                    <MapPin size={20} color={COLORS.textPlaceholder} style={[styles.inputIcon, { marginTop: Platform.OS === 'ios' ? 0 : 2 }]} />
                    <TextInput
                      style={[styles.input, { height: 56, textAlignVertical: 'top' }]}
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
                  <Text style={styles.label}>Opening Balance</Text>
                  <View style={styles.inputContainer}>
                    <IndianRupee size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 1500"
                      value={openingBalance}
                      onChangeText={(val) => setOpeningBalance(val.replace(/[^0-9.]/g, ''))}
                      keyboardType="decimal-pad"
                      placeholderTextColor={COLORS.textPlaceholder}
                    />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 4, backgroundColor: '#FFFBEB', paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#FEF3C7' }}>
                    <AlertCircle size={14} color="#D97706" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 11.5, fontFamily: 'Geologica-Medium', color: '#D97706' }}>
                      Note: Opening balance once saved cannot be changed.
                    </Text>
                  </View>
                </View>

                {/* Route */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('customers.route')}</Text>
                  <TouchableOpacity
                    style={styles.inputContainer}
                    onPress={() => setRoutePickerVisible(true)}
                    activeOpacity={0.7}
                  >
                    <MapPin size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                    <Text style={[styles.dropdownText, !routeId && { color: COLORS.textPlaceholder }]} numberOfLines={1}>
                      {routeId ? getRouteName(routeId) : t('customers.selectRoute')}
                    </Text>
                    <ChevronDown size={18} color={COLORS.textPlaceholder} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary, loading && styles.btnDisabled]}
                activeOpacity={0.85}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnTextPrimary}>Create Customer</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Internal Route Picker Modal (simple list) */}
      <Modal
        visible={routePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRoutePickerVisible(false)}
      >
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setRoutePickerVisible(false)}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Route</Text>
              <TouchableOpacity onPress={() => setRoutePickerVisible(false)}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.addInlineBtn}
              onPress={() => { setRoutePickerVisible(false); setAddRouteVisible(true); }}
            >
              <Text style={styles.addInlineBtnText}>+ Add New Route</Text>
            </TouchableOpacity>

            <ScrollView style={{ maxHeight: 300 }}>
              {loadingRoutes ? (
                <ActivityIndicator style={{ padding: 20 }} color={COLORS.primary} />
              ) : routes.length === 0 ? (
                <Text style={styles.emptyText}>No routes found.</Text>
              ) : (
                routes.map(r => (
                  <TouchableOpacity 
                    key={r.id} 
                    style={[styles.pickerItem, routeId === r.id && styles.pickerItemActive]}
                    onPress={() => { setRouteId(r.id); setRoutePickerVisible(false); }}
                  >
                    <Text style={[styles.pickerItemText, routeId === r.id && styles.pickerItemTextActive]}>{r.name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Internal Add Route Modal */}
      <AddRouteModal 
        visible={addRouteVisible}
        onClose={() => setAddRouteVisible(false)}
        onSuccess={(newRoute) => {
          setAddRouteVisible(false);
          setRoutes(prev => [...prev, newRoute]);
          setRouteId(newRoute.id);
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%'
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
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Geologica-Bold',
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
  form: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Geologica-Bold',
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
  inputIcon: {
    marginRight: 8,
  },
  countryCode: {
    fontSize: 15,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.textPrimary,
    fontFamily: 'Geologica-Medium',
    fontSize: 15,
    padding: 0,
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPrimary,
  },
  btn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnTextPrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Geologica-Bold',
  },
  // Picker Styles
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '100%',
    overflow: 'hidden',
    padding: 20
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  pickerTitle: {
    fontSize: 17,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },
  addInlineBtn: {
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12
  },
  addInlineBtnText: {
    color: COLORS.primary,
    fontFamily: 'Geologica-Bold',
    fontSize: 14,
  },
  pickerItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  pickerItemActive: {
    backgroundColor: '#F8FAFC'
  },
  pickerItemText: {
    fontSize: 15,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPrimary
  },
  pickerItemTextActive: {
    color: COLORS.primary,
    fontFamily: 'Geologica-Bold',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textPlaceholder,
    padding: 20,
    fontFamily: 'Geologica-Medium',
  },
  helperText: {
    fontSize: 11,
    fontFamily: 'Geologica-Regular',
    color: COLORS.textPlaceholder,
    marginTop: 6,
    paddingHorizontal: 2,
  }
});

export default AddCustomerModal;
