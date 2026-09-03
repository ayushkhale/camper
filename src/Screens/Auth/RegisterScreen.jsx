import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowRight } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { api } from '../../services/api';

const { height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation();

  const changeLanguage = async (lng) => {
    i18n.changeLanguage(lng);
    await AsyncStorage.setItem('app_language', lng);
  };
  const insets = useSafeAreaInsets();

  // Custom Toast state
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

  const triggerToast = (message, type = 'error') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type });
    }, 4000);
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length !== 10) {
      triggerToast(t('register.mobilePlaceholder'), 'error');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `+91${phone}`;
      const response = await api.signupRequestOtp(fullPhone);
      if (response.success) {
        triggerToast(t('register.success'), 'success');
        setTimeout(() => {
          navigation.navigate('OtpVerification', {
            contextId: response.contextId,
            phone: fullPhone,
            flow: 'signup',
          });
        }, 1000);
      }
    } catch (error) {
      if (error.message === 'TOO_MANY_REQUESTS') {
        triggerToast(t('register.rateLimitError'), 'error');
      } else {
        triggerToast(error.message || 'Something went wrong', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    
      <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'position' : 'position'}
      style={{ flex: 1 }}
      contentContainerStyle={{ flex: 1 }}
    >
      <ImageBackground
      source={require('../../../assets/login7.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        {/* Custom Toast Notification */}
        {toast.visible && (
          <View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        )}

        
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Spacer to push form up when keyboard opens */}
            <View style={styles.spacer} />

            {/* Form Section */}
            <View style={[styles.formContainer, { paddingBottom: Math.max(insets.bottom + 48, 64) }]}>
              <View style={styles.headerRow}>
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.headerTitle}>{t('register.title')}</Text>
                  <View style={styles.titleUnderline} />
                </View>
                <View style={styles.langSwitcher}>
                  <TouchableOpacity
                    style={[styles.langTab, i18n.language === 'en' && styles.langTabActive]}
                    onPress={() => changeLanguage('en')}
                  >
                    <Text style={[styles.langTabText, i18n.language === 'en' && styles.langTabTextActive]}>EN</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.langTab, i18n.language === 'hi' && styles.langTabActive]}
                    onPress={() => changeLanguage('hi')}
                  >
                    <Text style={[styles.langTabText, i18n.language === 'hi' && styles.langTabTextActive]}>HI</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Mobile Input */}
              <Text style={styles.inputLabel}>{t('register.mobileLabel')}</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.countryCode}>+91</Text>
                <View style={styles.verticalDivider} />
                <TextInput
                  style={styles.input}
                  placeholder={t('register.mobilePlaceholder')}
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                  editable={!loading}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? '...' : t('register.button')}
                </Text>
                {!loading && (
                  <View style={styles.iconWrapper}>
                    <ArrowRight color="#FFFFFF" size={18} strokeWidth={2.5} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Already have account Link */}
              <View style={styles.loginLinkContainer}>
                <Text style={styles.loginLinkText}>{t('register.alreadyHaveAccount')} </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>{t('register.loginLink')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        
      </SafeAreaView>
    </ImageBackground>
    </KeyboardAvoidingView>
    
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  spacer: {
    flex: 1,
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 48,
    paddingHorizontal: 28,
    // Soft premium shadow pointing up
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitleContainer: {
    alignItems: 'flex-start',
  },
  langSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
  },
  langTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  langTabActive: {
    backgroundColor: '#043994',
  },
  langTabText: {
    fontSize: 13,
    fontFamily: 'Rubik-SemiBold',
    color: '#64748B',
  },
  langTabTextActive: {
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  titleUnderline: {
    width: 48,
    height: 4,
    backgroundColor: '#0A429B',
    borderRadius: 2,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginBottom: 32,
    height: 60,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A429B',
    paddingLeft: 16,
    paddingRight: 12,
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#0F172A',
    fontSize: 15,
    paddingRight: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#0A429B',
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  iconWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 4,
    borderRadius: 12,
    marginLeft: 4,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 16,
  },
  loginLinkText: {
    color: '#64748B',
    fontSize: 15,
  },
  loginLink: {
    color: '#0A429B',
    fontSize: 15,
    fontWeight: '700',
  },
  toast: {
    position: 'absolute',
    top: 40,
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

export default RegisterScreen;
