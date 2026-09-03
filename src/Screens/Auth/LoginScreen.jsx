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
import { useAlert } from '../../context/AlertContext';

const { height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  const changeLanguage = async (lng) => {
    i18n.changeLanguage(lng);
    await AsyncStorage.setItem('app_language', lng);
  };

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
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Spacer to push form to bottom */}
            <View style={styles.spacer} />

            {/* Form Section */}
            <View style={[styles.formContainer, { paddingBottom: Math.max(insets.bottom + 48, 64) }]}>
              <View style={styles.headerRow}>
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.headerTitle}>{t('login.title')}</Text>
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
              <Text style={styles.inputLabel}>{t('login.mobileLabel')}</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.countryCode}>+91</Text>
                <View style={styles.verticalDivider} />
                <TextInput
                  style={styles.input}
                  placeholder={t('login.mobilePlaceholder')}
                  placeholderTextColor="#94A3B8"
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
                {!loading && (
                  <View style={styles.iconWrapper}>
                    <ArrowRight color="#FFFFFF" size={18} strokeWidth={2.5} />
                  </View>
                )}
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
    backgroundColor: '#0A429B', // Deep brand blue
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
  loginButton: {
    width: '100%',
    backgroundColor: '#0A429B',
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
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
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 16,
  },
  registerText: {
    color: '#64748B',
    fontSize: 15,
  },
  registerLink: {
    color: '#0A429B',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default LoginScreen;
