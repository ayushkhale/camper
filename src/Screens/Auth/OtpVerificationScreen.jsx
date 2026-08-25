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
  ImageBackground,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { api } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const { height } = Dimensions.get('window');

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
  const insets = useSafeAreaInsets();

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
          await login(response.token, response.refreshToken || null, response.user);
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
    <ImageBackground
      source={require('../../../assets/login5.png')}
      style={styles.backgroundImage}
      resizeMode="stretch"
    >
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
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
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Spacer to push form up when keyboard opens */}
            <View style={styles.spacer} />

            <View style={[styles.formContainer, { paddingBottom: Math.max(insets.bottom + 48, 64) }]}>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>{t('otp.title')}</Text>
                <View style={styles.titleUnderline} />
              </View>

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
                {!loading && (
                  <View style={styles.iconWrapper}>
                    <ArrowRight color="#FFFFFF" size={18} strokeWidth={2.5} />
                  </View>
                )}
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
    </ImageBackground>
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
  headerTitleContainer: {
    marginBottom: 16,
    alignItems: 'flex-start',
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
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'left',
    marginBottom: 24,
    lineHeight: 22,
    alignSelf: 'flex-start',
  },
  phoneText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  inputWrapper: {
    width: '100%',
    position: 'relative',
    height: 60,
    marginBottom: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFilled: {
    borderColor: '#0A429B',
    backgroundColor: '#F8FAFC',
  },
  otpBoxFocused: {
    borderColor: '#0A429B',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  otpBoxText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
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
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  resendText: {
    color: '#64748B',
    fontSize: 14,
  },
  timerText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  resendLink: {
    color: '#0A429B',
    fontSize: 14,
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

export default OtpVerificationScreen;
