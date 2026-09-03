import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, MapPin, Hash , ArrowLeft} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import CurvedHeader from '../../components/CurvedHeader';
import { useTranslation } from 'react-i18next';

const AddRouteScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { userToken } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const routeToEdit = route.params?.route;
  const isEditing = !!routeToEdit;

  const [name, setName] = useState(routeToEdit?.name || '');
  const [areaCode, setAreaCode] = useState(routeToEdit?.areaCode || '');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!name.trim()) {
      showAlert('Route Name Required', 'Route name is required', 'warning');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const body = {
      name: name.trim(),
      areaCode: areaCode.trim() || null,
    };

    try {
      if (isEditing) {
        const res = await api.updateRoute(userToken, routeToEdit.id, body);
        if (res.success) {
          showAlert('Success', 'Route updated successfully', 'success');
          navigation.goBack();
        } else {
          throw new Error(res.message || 'Failed to update route');
        }
      } else {
        const res = await api.createRoute(userToken, body);
        if (res.success) {
          showAlert('Success', 'Route created successfully', 'success');
          navigation.goBack();
        } else {
          throw new Error(res.message || 'Failed to create route');
        }
      }
    } catch (err) {
      console.error('Submit route error:', err);
      showAlert('Error', err.message || 'Error saving route', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CurvedHeader
        title={isEditing ? t('routes.editRoute') : t('routes.createRoute')}
        leftIcon={<ArrowLeft size={24} color="#FFFFFF" />}
        onLeftPress={() => navigation.goBack()}
        height={120}
        contentStyle={{ paddingTop: 10, paddingBottom: 25 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form Area - Premium Inputs */}
          <View style={styles.form}>
            {/* Route Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('routes.routeName')} *</Text>
              <View style={styles.inputContainer}>
                <View style={[styles.inputIconBox, { backgroundColor: '#E0E7FF' }]}>
                  <MapPin size={18} color="#4F46E5" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder={t('routes.namePlaceholder')}
                  placeholderTextColor={COLORS.textPlaceholder}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Area Code Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('routes.areaCode')}</Text>
              <View style={styles.inputContainer}>
                <View style={[styles.inputIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Hash size={18} color="#D97706" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder={t('routes.areaCodePlaceholder')}
                  placeholderTextColor={COLORS.textPlaceholder}
                  value={areaCode}
                  onChangeText={setAreaCode}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Actions Bar (Matches AddCustomerScreen) */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, loading && styles.btnDisabled]}
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.btnTextPrimary}>
                {isEditing ? t('common.saveChanges') : t('routes.createRoute')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 120,
  },
  titleContainer: {
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: 'Rubik-Bold',
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 15,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textPlaceholder,
  },
  form: {
    marginBottom: 0,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Rubik-SemiBold',
    color: '#475569',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontFamily: 'Rubik-Medium',
    color: '#1E293B',
    padding: 0,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 60,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  btn: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnTextPrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
  },
  // Custom Toast Styles
  toast: {
    position: 'absolute',
    top: 16,
    left: 24,
    right: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastError: { backgroundColor: COLORS.danger },
  toastSuccess: { backgroundColor: COLORS.success },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Rubik-SemiBold',
    textAlign: 'center',
  },
});

export default AddRouteScreen;

