import React, { useState, useEffect, useContext, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/colors';
import { api } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const OtpVerificationScreen = ({ route, navigation }) => {
  const { contextId, phone, flow } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [resendCount, setResendCount] = useState(0);
  const [activeContextId, setActiveContextId] = useState(contextId);
  
  // Custom Toast state
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

  const { t } = useTranslation();
  const { login } = useContext(AuthContext);
  const inputRef = useRef(null);

  const triggerToast = (message, type = 'error') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type });
    }, 4000);
  };

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      triggerToast(t('otp.subtitle'), 'error');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (flow === 'signup') {
        response = await api.signupVerifyOtp(activeContextId, otp);
      } else {
        response = await api.loginVerifyOtp(activeContextId, otp);
      }

      if (response.success) {
        triggerToast(t('login.loginSuccess'), 'success');
        setTimeout(async () => {
          await login(response.token, response.user);
        }, 1000);
      }
    } catch (error) {
      triggerToast(error.message || t('otp.invalidOtp'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    if (resendCount >= 3) {
      triggerToast(t('otp.resendLimitReached'), 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.resendOtp(activeContextId);
      if (response.success) {
        triggerToast(t('otp.resendSuccess'), 'success');
        setTimer(60);
        setResendCount((prev) => prev + 1);
      }
    } catch (error) {
      triggerToast(error.message || 'Failed to resend OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const otpArray = Array(6).fill('');

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Dynamic Custom Toast Notification */}
      {toast.visible && (
        <View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {/* Logo Branding */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/hindilogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>{t('login.tagline')}</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.headerTitle}>{t('otp.title')}</Text>
            <Text style={styles.subtitle}>
              {t('otp.subtitle')} <Text style={styles.phoneText}>{phone}</Text>
            </Text>

            {/* Premium Minimal OTP Grid */}
            <TouchableOpacity 
              activeOpacity={1} 
              onPress={() => inputRef.current?.focus()} 
              style={styles.inputWrapper}
            >
              <View style={styles.otpGrid} pointerEvents="none">
                {otpArray.map((_, index) => {
                  const char = otp[index] || '';
                  const isFocused = otp.length === index;
                  return (
                    <View
                      key={index}
                      style={[
                        styles.otpBox,
                        char ? styles.otpBoxFilled : null,
                        isFocused ? styles.otpBoxFocused : null,
                      ]}
                    >
                      <Text style={styles.otpBoxText}>{char}</Text>
                    </View>
                  );
                })}
              </View>
              <TextInput
                ref={inputRef}
                style={styles.hiddenTextInput}
                keyboardType="numeric"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                caretHidden
                editable={!loading}
              />
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? '...' : t('otp.verifyButton')}
              </Text>
            </TouchableOpacity>

            {/* Resend Cooldown Section */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>{t('otp.resendText')} </Text>
              {timer > 0 ? (
                <Text style={styles.timerText}>
                  {t('otp.resendTimer', { seconds: timer })}
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResend} disabled={loading}>
                  <Text style={styles.resendLink}>{t('otp.resendBtn')}</Text>
                </TouchableOpacity>
              )}
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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    color: COLORS.textPlaceholder,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  phoneText: {
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  inputWrapper: {
    width: '100%',
    position: 'relative',
    height: 60,
    marginVertical: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  otpBox: {
    width: 44,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  otpBoxFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.surface,
  },
  otpBoxText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  hiddenTextInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  button: {
    width: '100%',
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  resendText: {
    color: COLORS.textPlaceholder,
    fontSize: 13,
  },
  timerText: {
    color: COLORS.textPlaceholder,
    fontSize: 13,
    fontWeight: '600',
  },
  resendLink: {
    color: COLORS.primary,
    fontSize: 13,
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
  toastError: {
    backgroundColor: COLORS.surface,
  },
  toastSuccess: {
    backgroundColor: COLORS.surface,
  },
  toastText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default OtpVerificationScreen;
