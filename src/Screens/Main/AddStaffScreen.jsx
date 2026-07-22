import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, User, Phone, Mail, AlertCircle } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

const AddStaffScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { userToken } = useContext(AuthContext);

  const editStaff = route.params?.staff || null;
  const isEditMode = !!editStaff;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [apiError, setApiError] = useState('');
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode && editStaff) {
      setName(editStaff.name || '');
      
      let rawPhone = editStaff.phone || '';
      if (rawPhone.startsWith('+91') && rawPhone.length > 3) {
        rawPhone = rawPhone.substring(3);
      }
      setPhone(rawPhone);
      setEmail(editStaff.email || '');
    }
  }, [isEditMode, editStaff]);

  const validate = () => {
    let isValid = true;
    
    if (!name.trim()) {
      setNameError(t('staff.validationError').split('and')[0] || 'Name is required');
      isValid = false;
    } else {
      setNameError('');
    }

    if (!isEditMode) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      if (!cleanPhone || cleanPhone.length !== 10) {
        setPhoneError(t('staff.phonePlaceholder') || 'Enter 10-digit number');
        isValid = false;
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('');
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setEmailError('Enter a valid email address');
        isValid = false;
      } else {
        setEmailError('');
      }
    } else {
      setEmailError('');
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setSubmitting(true);
    setApiError('');

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = `+91${cleanPhone}`;

    const staffData = isEditMode
      ? {
          name: name.trim(),
          email: email.trim() || undefined,
        }
      : {
          name: name.trim(),
          phone: formattedPhone,
          email: email.trim() || undefined,
        };

    try {
      if (isEditMode) {
        const response = await api.updateStaff(userToken, editStaff.id, staffData);
        if (response && response.success) {
          Alert.alert('Success', t('staff.updateSuccess'));
          navigation.goBack();
        } else {
          setApiError(response.message || 'Failed to update staff');
        }
      } else {
        const response = await api.addStaff(userToken, staffData);
        if (response && response.success) {
          Alert.alert('Success', t('staff.addSuccess'));
          navigation.goBack();
        } else {
          setApiError(response.message || 'Failed to add staff');
        }
      }
    } catch (err) {
      const errorMsg = err.message || '';
      if (errorMsg.includes('already exists') || errorMsg.includes('already registered')) {
        setApiError(t('staff.phoneExists'));
      } else {
        setApiError(errorMsg || 'Something went wrong');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Header Row - Matches AddCustomer Header Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerRightSpacing} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {apiError ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={20} color={COLORS.danger} style={styles.errorIcon} />
              <Text style={styles.errorBannerText}>{apiError}</Text>
            </View>
          ) : null}

          {/* Title Container */}
          <View style={styles.titleContainer}>
            <Text style={styles.pageTitle}>
              {isEditMode ? t('staff.editStaff') : t('staff.addNew')}
            </Text>
            <Text style={styles.pageSubtitle}>
              {isEditMode ? 'Update staff member profile' : 'Fill details to add a new team member'}
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Name Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('staff.name')}</Text>
              <View style={[styles.inputContainer, nameError ? styles.inputErrorBorder : null]}>
                <User size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('staff.namePlaceholder')}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  placeholderTextColor={COLORS.textPlaceholder}
                />
              </View>
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>

            {/* Phone Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('staff.phone')}</Text>
              <View style={[styles.inputContainer, phoneError ? styles.inputErrorBorder : null, isEditMode && styles.inputDisabled]}>
                <Phone size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('staff.phonePlaceholder').replace('+91', '')}
                  value={phone}
                  onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  maxLength={10}
                  placeholderTextColor={COLORS.textPlaceholder}
                  disabled={isEditMode}
                  editable={!isEditMode}
                />
              </View>
              {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
              {isEditMode && (
                <Text style={styles.helperText}>
                  Phone number cannot be changed once staff is registered.
                </Text>
              )}
            </View>

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('staff.email')}</Text>
              <View style={[styles.inputContainer, emailError ? styles.inputErrorBorder : null]}>
                <Mail size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('staff.emailPlaceholder')}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={COLORS.textPlaceholder}
                />
              </View>
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.btn, styles.btnPrimary, submitting && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.btnTextPrimary}>
                  {isEditMode ? t('staff.save') : t('staff.addNew')}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, styles.btnSecondary]}
              onPress={() => navigation.goBack()}
              disabled={submitting}
            >
              <Text style={styles.btnTextSecondary}>{t('staff.cancel')}</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 14,
    paddingBottom: 4,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerRightSpacing: {
    width: 32,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  titleContainer: {
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: COLORS.textPlaceholder,
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
  form: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
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
    paddingHorizontal: 16,
    height: 52,
  },
  inputDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
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
    color: COLORS.textPrimary,
    padding: 0,
  },
  inputErrorBorder: {
    borderColor: COLORS.danger,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: COLORS.danger,
    marginTop: 4,
  },
  helperText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnTextPrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter-Bold',
  },
  btnTextSecondary: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontFamily: 'Inter-Bold',
  },
});

export default AddStaffScreen;
