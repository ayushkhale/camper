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
  Alert
} from 'react-native';
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

  // If editing, staff object is passed via navigation params
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

  // Pre-fill form if in Edit Mode
  useEffect(() => {
    if (isEditMode && editStaff) {
      setName(editStaff.name || '');
      
      // If phone starts with +91, strip it for easier editing in UI
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
    
    // Validate Name
    if (!name.trim()) {
      setNameError(t('staff.validationError').split('and')[0] || 'Name is required');
      isValid = false;
    } else {
      setNameError('');
    }

    // Validate Phone (only required when adding a new staff member)
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

    // Validate Email (optional)
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

    // Prepend country code +91 if it's 10 digits
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = `+91${cleanPhone}`;

    // On edit, do NOT send the phone field as it is not editable
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
        // Edit flow
        const response = await api.updateStaff(userToken, editStaff.id, staffData);
        if (response && response.success) {
          Alert.alert('Success', t('staff.updateSuccess'));
          navigation.goBack();
        } else {
          setApiError(response.message || 'Failed to update staff');
        }
      } else {
        // Add flow
        const response = await api.addStaff(userToken, staffData);
        if (response && response.success) {
          Alert.alert('Success', t('staff.addSuccess'));
          navigation.goBack();
        } else {
          setApiError(response.message || 'Failed to add staff');
        }
      }
    } catch (err) {
      // Check for phone number already exists message
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? t('staff.editStaff') : t('staff.addNew')}
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
          {/* Error Banner */}
          {apiError ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={20} color={COLORS.danger} style={styles.errorIcon} />
              <Text style={styles.errorBannerText}>{apiError}</Text>
            </View>
          ) : null}

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Name Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('staff.name')}</Text>
              <View style={[styles.inputContainer, nameError ? styles.inputErrorBorder : null]}>
                <User size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('staff.namePlaceholder')}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>

            {/* Phone Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('staff.phone')}</Text>
              <View style={[styles.inputContainer, phoneError ? styles.inputErrorBorder : null]}>
                <Phone size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                {/* Prefix */}
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('staff.phonePlaceholder').replace('+91', '')}
                  value={phone}
                  onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  maxLength={10}
                  placeholderTextColor={COLORS.textSecondary}
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
                <Mail size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('staff.emailPlaceholder')}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={COLORS.textSecondary}
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
                <ActivityIndicator size="small" color={COLORS.background} />
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
    borderRadius: 6,
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
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  countryCode: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textPrimary,
    marginRight: 4,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textPrimary,
    padding: 0,
  },
  inputErrorBorder: {
    borderColor: COLORS.danger,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: COLORS.danger,
    marginTop: 4,
  },
  helperText: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSecondary,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  actions: {
    marginTop: 10,
  },
  btn: {
    height: 48,
    borderRadius: 6,
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
});

export default AddStaffScreen;
