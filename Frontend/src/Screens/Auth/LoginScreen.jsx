import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/colors';
import { api } from '../../services/api';
import { useAlert } from '../../context/AlertContext';

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const { showAlert } = useAlert();

  const handleLoginRequest = async () => {
    if (!phone || phone.length !== 10) {
      showAlert(t('login.mobilePlaceholder'), 'error');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `+91${phone}`;
      const response = await api.loginRequestOtp(fullPhone);
      if (response.success) {
        showAlert(t('register.success'), 'success');
        setTimeout(() => {
          navigation.navigate('OtpVerification', {
            contextId: response.contextId,
            phone: fullPhone,
            flow: 'login',
          });
        }, 1000);
      }
    } catch (error) {
      if (error.message === 'TOO_MANY_REQUESTS') {
        showAlert(t('register.rateLimitError'), 'error');
      } else {
        showAlert(error.message || 'Something went wrong', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Image
              source={i18n.language === 'hi' ? require('../../../assets/hindilogo.png') : require('../../../assets/englishlogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>{t('login.tagline')}</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <Text style={styles.headerTitle}>{t('login.title')}</Text>

            {/* Mobile Input */}
            <Text style={styles.inputLabel}>{t('login.mobileLabel')}</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder={t('login.mobilePlaceholder')}
                placeholderTextColor={COLORS.textPlaceholder}
                keyboardType="numeric"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
                editable={!loading}
              />
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
              onPress={handleLoginRequest}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? '...' : t('register.button')}
              </Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>{t('login.noAccount')} </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>{t('login.register')}</Text>
              </TouchableOpacity>
            </View>
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
    marginBottom: 40,
  },
  logo: {
    width: 180,
    height: 70,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 12.5,
    color: COLORS.textPlaceholder,
    fontWeight: '500',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textPlaceholder,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    backgroundColor: COLORS.surface,
    marginBottom: 20,
    height: 48,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    paddingLeft: 14,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: COLORS.textPlaceholder,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.primary,
    fontSize: 14.5,
    paddingHorizontal: 12,
  },
  loginButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: COLORS.textPlaceholder,
    fontSize: 14,
  },
  registerLink: {
    color: COLORS.primary,
    fontSize: 14,
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
});

export default LoginScreen;
