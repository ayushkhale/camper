import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { ChevronDown, LogOut } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/colors';
import { api } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const CompleteRegistrationScreen = () => {
  const { userToken, login, logout } = useContext(AuthContext);
  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [country, setCountry] = useState('India');
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation();

  // We no longer need Modals for City and State, but we can track if we are fetching.
  const [fetchingPincode, setFetchingPincode] = useState(false);

  // Custom Toast state
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

  const triggerToast = (message, type = 'error') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type });
    }, 4000);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.getCategories();
        const list = Array.isArray(response) 
          ? response 
          : (response.data || response.categories || []);

        if (list.length > 0) {
          setCategories(list);
          
          // Auto-select category matching "water" or "camper"
          const match = list.find((cat) => 
            cat.name?.toLowerCase().includes('water') || 
            cat.name?.toLowerCase().includes('camper')
          );
          if (match) {
            setSelectedCategoryId(match.id);
          } else {
            setSelectedCategoryId(list[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch pincode details
  useEffect(() => {
    if (pincode.length === 6 && pincode !== '000000') {
      setFetchingPincode(true);
      fetch(`https://api.postalpincode.in/pincode/${pincode}`)
        .then(res => res.json())
        .then(data => {
          if (data && data[0] && data[0].Status === 'Success') {
            const postOffices = data[0].PostOffice;
            const uniqueCities = [...new Set(postOffices.map(po => po.District))];
            const uniqueStates = [...new Set(postOffices.map(po => po.State))];
            
            // Auto-fill the first result, but user can still edit it manually
            if (uniqueCities.length > 0) setCity(uniqueCities[0]);
            if (uniqueStates.length > 0) setStateName(uniqueStates[0]);
          } else {
            triggerToast('Invalid Pincode', 'error');
          }
        })
        .catch(err => {
          console.error(err);
          triggerToast('Failed to fetch pincode details', 'error');
        })
        .finally(() => setFetchingPincode(false));
    }
  }, [pincode]);

  const handleSubmit = async () => {
    await executeSubmit(address, pincode, city, stateName, country);
  };

  const executeSubmit = async (submitAddress, submitPincode, submitCity, submitState, submitCountry) => {
    if (!ownerName || !businessName || !submitAddress || !submitPincode || !submitCity || !submitState || !submitCountry) {
      triggerToast('Please fill all required fields.', 'error');
      return;
    }

    if (!selectedCategoryId) {
      triggerToast('Categories are still loading. Please wait.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.completeRegistration(
        userToken,
        ownerName,
        businessName,
        selectedCategoryId,
        email || null,
        submitAddress,
        submitPincode,
        submitCity,
        submitState,
        submitCountry
      );

      if (response.success) {
        triggerToast(t('completeReg.success'), 'success');
        setTimeout(async () => {
          await login(response.token, response.refreshToken, response.user);
        }, 1000);
      }
    } catch (error) {
      triggerToast(error.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Custom Toast Banner */}
      {toast.visible && (
        <View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {/* Header with Logout */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <LogOut size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {/* Logo Branding */}
          <View style={styles.logoContainer}>
            <FastImage
              source={i18n.language === 'hi' ? require('../../../assets/hindilogo.png') : require('../../../assets/englishlogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>{t('login.tagline')}</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.headerTitle}>{t('completeReg.title')}</Text>
            <Text style={styles.subtitle}>{t('completeReg.subtitle')}</Text>

            {/* Owner Name Input */}
            <Text style={styles.inputLabel}>{t('completeReg.ownerName')} *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={t('completeReg.ownerPlaceholder')}
                placeholderTextColor={COLORS.textPlaceholder}
                value={ownerName}
                onChangeText={setOwnerName}
                editable={!loading}
              />
            </View>

            {/* Business Name Input */}
            <Text style={styles.inputLabel}>{t('completeReg.businessName')} *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={t('completeReg.businessPlaceholder')}
                placeholderTextColor={COLORS.textPlaceholder}
                value={businessName}
                onChangeText={setBusinessName}
                editable={!loading}
              />
            </View>

            {/* Email Input */}
            <Text style={styles.inputLabel}>{t('completeReg.email')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={t('completeReg.emailPlaceholder')}
                placeholderTextColor={COLORS.textPlaceholder}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>

            {/* Address Input Header */}
            <Text style={styles.inputLabel}>Address Line 1 *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="123 Main Street"
                placeholderTextColor={COLORS.textPlaceholder}
                value={address}
                onChangeText={setAddress}
                editable={!loading}
              />
            </View>

            {/* Pincode Input */}
            <Text style={styles.inputLabel}>Pincode *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="110001"
                placeholderTextColor={COLORS.textPlaceholder}
                keyboardType="numeric"
                maxLength={6}
                value={pincode}
                onChangeText={setPincode}
                editable={!loading}
              />
              {fetchingPincode && (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ position: 'absolute', right: 16 }} />
              )}
            </View>

            {/* City Input */}
            <Text style={styles.inputLabel}>City *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter city"
                placeholderTextColor={COLORS.textPlaceholder}
                value={city}
                onChangeText={setCity}
                editable={!loading}
              />
            </View>

            {/* State Input */}
            <Text style={styles.inputLabel}>State *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter state"
                placeholderTextColor={COLORS.textPlaceholder}
                value={stateName}
                onChangeText={setStateName}
                editable={!loading}
              />
            </View>
            
            {/* Complete Registration Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? '...' : t('completeReg.button')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>


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
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logo: {
    width: 160,
    height: 60,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 13,
    color: COLORS.textPlaceholder,
    fontWeight: '500',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textPlaceholder,
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textPlaceholder,
    marginBottom: 6,
  },
  inputContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    backgroundColor: COLORS.surface,
    marginBottom: 20,
    height: 48,
    justifyContent: 'center',
  },
  input: {
    height: '100%',
    color: COLORS.primary,
    fontSize: 14.5,
    paddingHorizontal: 16,
  },
  button: {
    width: '100%',
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  toast: {
    position: 'absolute',
    top: 16,
    left: 24,
    right: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastError: { backgroundColor: COLORS.danger },
  toastSuccess: { backgroundColor: COLORS.success },
  toastText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  dropdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  dropdownText: {
    color: COLORS.primary,
    fontSize: 14.5,
  },
  dropdownPlaceholderText: {
    color: COLORS.textPlaceholder,
    fontSize: 14.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalItemText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  modalItemTextSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default CompleteRegistrationScreen;
