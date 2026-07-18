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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/colors';
import { api } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const CompleteRegistrationScreen = () => {
  const { userToken, login } = useContext(AuthContext);
  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

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

  const handleSubmit = async () => {
    if (!ownerName || !businessName) {
      triggerToast(t('completeReg.validationError'), 'error');
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
        email || null
      );

      if (response.success) {
        triggerToast(t('completeReg.success'), 'success');
        setTimeout(async () => {
          await login(response.token, response.user);
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
            <Text style={styles.headerTitle}>{t('completeReg.title')}</Text>
            <Text style={styles.subtitle}>{t('completeReg.subtitle')}</Text>

            {/* Owner Name Input */}
            <Text style={styles.inputLabel}>{t('completeReg.ownerName')} *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={t('completeReg.ownerPlaceholder')}
                placeholderTextColor={COLORS.textSecondary}
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
                placeholderTextColor={COLORS.textSecondary}
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
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>

            {/* Submit Button */}
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
    color: COLORS.textSecondary,
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
    color: COLORS.textSecondary,
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  inputContainer: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    marginBottom: 20,
    height: 48,
    justifyContent: 'center',
  },
  input: {
    height: '100%',
    color: COLORS.textPrimary,
    fontSize: 14.5,
    paddingHorizontal: 16,
  },
  button: {
    width: '100%',
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 6,
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
    borderRadius: 6,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastError: {
    backgroundColor: COLORS.danger,
  },
  toastSuccess: {
    backgroundColor: COLORS.success,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CompleteRegistrationScreen;
