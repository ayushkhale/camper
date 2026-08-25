import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Modal
} from 'react-native';
import { MapPin, Hash, X } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { useAlert } from '../../context/AlertContext';

const AddRouteModal = ({ visible, onClose, onSuccess }) => {
  const { userToken } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [areaCode, setAreaCode] = useState('');
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
      const res = await api.createRoute(userToken, body);
      if (res.success && res.data) {
        showAlert('Success', 'Route created successfully', 'success');
        setName('');
        setAreaCode('');
        onSuccess(res.data);
      } else {
        throw new Error(res.message || 'Failed to create route');
      }
    } catch (err) {
      console.error('Submit route error:', err);
      showAlert('Error', err.message || 'Error saving route', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('routes.createRoute')}</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('routes.routeName')}</Text>
              <View style={styles.inputContainer}>
                <MapPin size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('routes.namePlaceholder')}
                  placeholderTextColor={COLORS.textPlaceholder}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('routes.areaCode')}</Text>
              <View style={styles.inputContainer}>
                <Hash size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
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

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, loading && styles.btnDisabled]}
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.btnTextPrimary}>{t('routes.createRoute')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Rubik-Bold',
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
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.textPrimary,
    fontFamily: 'Rubik-SemiBold',
    fontSize: 15,
    padding: 0,
  },
  btn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnTextPrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
  },
});

export default AddRouteModal;
