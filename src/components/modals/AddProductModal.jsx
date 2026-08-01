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
  Modal,
  ScrollView
} from 'react-native';
import { Package, IndianRupee, Info, Check, X } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { useAlert } from '../../context/AlertContext';

const AddProductModal = ({ visible, onClose, onSuccess }) => {
  const { userToken } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('can');
  const [isReturnableContainer, setIsReturnableContainer] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!name.trim()) {
      showAlert('Required', t('products.nameRequired'), 'warning');
      return false;
    }
    if (!price.trim()) {
      showAlert('Required', t('products.priceRequired'), 'warning');
      return false;
    }
    if (isNaN(price) || parseFloat(price) < 0) {
      showAlert('Invalid Price', t('products.invalidPrice'), 'warning');
      return false;
    }
    if (
      isReturnableContainer &&
      depositAmount.trim() &&
      (isNaN(depositAmount) || parseFloat(depositAmount) < 0)
    ) {
      showAlert('Invalid Deposit', t('products.invalidDeposit'), 'warning');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    // Quick Add modal creates product using standard JSON (no image)
    const jsonBody = {
      name: name.trim(),
      price: parseFloat(price.trim()),
      unit: unit.trim() || 'can',
      isReturnableContainer,
      depositAmount: isReturnableContainer && depositAmount.trim() ? parseFloat(depositAmount.trim()) : 0,
    };

    // To use JSON we pass isMultipart=false to updateProduct/createProduct API
    // Actually, createProduct in api.js might expect FormData. 
    // Let's create a FormData instead just in case to be compatible.
    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('price', price.trim());
    if (unit.trim()) formData.append('unit', unit.trim());
    formData.append('isReturnableContainer', String(isReturnableContainer));
    if (isReturnableContainer && depositAmount.trim()) {
      formData.append('depositAmount', depositAmount.trim());
    } else {
      formData.append('depositAmount', '0');
    }

    try {
      const res = await api.createProduct(userToken, formData);
      if (res.success && res.data) {
        showAlert('Success', t('products.addSuccess'), 'success');
        // reset form
        setName('');
        setPrice('');
        setUnit('can');
        setIsReturnableContainer(false);
        setDepositAmount('');
        
        onSuccess(res.data);
      } else {
        throw new Error(res.message || 'Failed to create product');
      }
    } catch (err) {
      console.error('Submit product error:', err);
      showAlert('Error', err.message || 'Error saving product', 'error');
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
            <Text style={styles.modalTitle}>Quick Add Product</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Product name *</Text>
                <View style={styles.inputContainer}>
                  <Package size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 20L Water Jar"
                    placeholderTextColor={COLORS.textPlaceholder}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.col, { marginRight: 8 }]}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Price (₹) *</Text>
                    <View style={styles.inputContainer}>
                      <IndianRupee size={18} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="150"
                        placeholderTextColor={COLORS.textPlaceholder}
                        keyboardType="numeric"
                        value={price}
                        onChangeText={setPrice}
                      />
                    </View>
                  </View>
                </View>

                <View style={[styles.col, { marginLeft: 8 }]}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Unit</Text>
                    <View style={styles.inputContainer}>
                      <Info size={18} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. jar"
                        placeholderTextColor={COLORS.textPlaceholder}
                        value={unit}
                        onChangeText={setUnit}
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Returnable Container</Text>
                <View style={styles.checkboxRow}>
                  <TouchableOpacity
                    style={[styles.checkboxOption, isReturnableContainer && styles.checkboxOptionActive]}
                    activeOpacity={0.7}
                    onPress={() => setIsReturnableContainer(true)}
                  >
                    <Text style={[styles.checkboxLabel, isReturnableContainer && styles.checkboxLabelActive]}>Yes</Text>
                    <View style={[styles.checkboxSquare, isReturnableContainer && styles.checkboxSquareChecked]}>
                      {isReturnableContainer && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.checkboxOption, !isReturnableContainer && styles.checkboxOptionActive]}
                    activeOpacity={0.7}
                    onPress={() => setIsReturnableContainer(false)}
                  >
                    <Text style={[styles.checkboxLabel, !isReturnableContainer && styles.checkboxLabelActive]}>No</Text>
                    <View style={[styles.checkboxSquare, !isReturnableContainer && styles.checkboxSquareChecked]}>
                      {!isReturnableContainer && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {isReturnableContainer && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Deposit amount (₹)</Text>
                  <View style={styles.inputContainer}>
                    <IndianRupee size={18} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 200"
                      placeholderTextColor={COLORS.textPlaceholder}
                      keyboardType="numeric"
                      value={depositAmount}
                      onChangeText={setDepositAmount}
                    />
                  </View>
                </View>
              )}
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
                <Text style={styles.btnTextPrimary}>Create Product</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
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
    maxHeight: '85%'
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
    fontFamily: 'Geologica-Bold',
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
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Geologica-Bold',
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
    fontFamily: 'Geologica-Medium',
    fontSize: 15,
    padding: 0,
  },
  row: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  checkboxOptionActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.border,
  },
  checkboxLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Geologica-Medium',
  },
  checkboxLabelActive: {
    color: COLORS.primary,
    fontFamily: 'Geologica-Bold',
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSquareChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  btn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8
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
    fontFamily: 'Geologica-Bold',
  },
});

export default AddProductModal;
