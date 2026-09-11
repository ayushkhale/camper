import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
  View,
} from 'react-native';
import { BadgePercent, CirclePlus, IndianRupee, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../shared/constants/colors';

const InvoiceAdjustmentModal = ({
  visible,
  type = 'discount',
  submitting = false,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState('');
  const isDiscount = type === 'discount';

  useEffect(() => {
    if (visible) {
      setAmount('');
      setDescription('');
      setValidationError('');
    }
  }, [type, visible]);

  const handleClose = () => {
    if (!submitting) onClose();
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const normalizedAmount = String(amount).trim().replace(',', '.');
    const hasValidAmountFormat = /^(?:\d+|\d*\.\d{1,2})$/.test(normalizedAmount);
    const parsedAmount = Number.parseFloat(normalizedAmount);
    const trimmedDescription = description.trim();

    if (!hasValidAmountFormat || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setValidationError(t('invoices.invalidAdjustmentAmount'));
      return;
    }

    if (!trimmedDescription) {
      setValidationError(t('invoices.adjustmentDescriptionRequired'));
      return;
    }

    setValidationError('');
    await onSubmit({
      type,
      amount: parsedAmount,
      description: trimmedDescription,
    });
  };

  const AccentIcon = isDiscount ? BadgePercent : CirclePlus;
  const accentColor = isDiscount ? '#7C3AED' : '#EA580C';
  const accentBackground = isDiscount ? '#F5F3FF' : '#FFF7ED';
  const modalCardStyle = [
    styles.modalCard,
    { paddingBottom: Math.max(insets.bottom, 20) + 16 },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>

        <View style={modalCardStyle}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={[styles.iconContainer, { backgroundColor: accentBackground }]}>
              <AccentIcon size={24} color={accentColor} />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>
                {t(isDiscount ? 'invoices.addDiscount' : 'invoices.addExtraCharge')}
              </Text>
              <Text style={styles.subtitle}>{t('invoices.adjustmentFormSubtitle')}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>{t('invoices.adjustmentAmount')}</Text>
          <View style={styles.amountInputContainer}>
            <IndianRupee size={18} color={COLORS.textSecondary} />
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={value => {
                setAmount(value);
                if (validationError) setValidationError('');
              }}
              placeholder="0.00"
              placeholderTextColor={COLORS.textPlaceholder}
              keyboardType="decimal-pad"
              editable={!submitting}
              maxLength={12}
            />
          </View>

          <Text style={styles.inputLabel}>{t('invoices.adjustmentDescription')}</Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={value => {
              setDescription(value);
              if (validationError) setValidationError('');
            }}
            placeholder={t('invoices.adjustmentDescriptionPlaceholder')}
            placeholderTextColor={COLORS.textPlaceholder}
            multiline
            textAlignVertical="top"
            editable={!submitting}
            maxLength={255}
          />
          <Text style={styles.characterCount}>{description.length}/255</Text>

          {!!validationError && (
            <Text style={styles.validationError}>{validationError}</Text>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={submitting}
              accessibilityRole="button"
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: accentColor }]}
              onPress={handleSubmit}
              disabled={submitting}
              accessibilityRole="button"
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {t(isDiscount ? 'invoices.addDiscount' : 'invoices.addExtraCharge')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
  },
  modalCard: {
    width: '100%',
    maxHeight: '88%',
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  modalHandle: {
    width: 42,
    height: 4,
    alignSelf: 'center',
    marginBottom: 16,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: COLORS.textPrimary,
    fontFamily: 'Rubik-Bold',
    fontSize: 18,
  },
  subtitle: {
    marginTop: 3,
    color: COLORS.textSecondary,
    fontFamily: 'Rubik-Medium',
    fontSize: 12,
    lineHeight: 17,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  inputLabel: {
    marginBottom: 7,
    color: COLORS.textPrimary,
    fontFamily: 'Rubik-SemiBold',
    fontSize: 13,
  },
  amountInputContainer: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 17,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
  },
  amountInput: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    marginLeft: 8,
    color: COLORS.textPrimary,
    fontFamily: 'Rubik-SemiBold',
    fontSize: 16,
  },
  descriptionInput: {
    minHeight: 102,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    color: COLORS.textPrimary,
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    lineHeight: 20,
  },
  characterCount: {
    marginTop: 5,
    textAlign: 'right',
    color: COLORS.textPlaceholder,
    fontFamily: 'Rubik-Medium',
    fontSize: 11,
  },
  validationError: {
    marginTop: 6,
    color: COLORS.danger,
    fontFamily: 'Rubik-Medium',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
  cancelButton: {
    minHeight: 48,
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontFamily: 'Rubik-SemiBold',
    fontSize: 14,
  },
  submitButton: {
    minHeight: 48,
    flex: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Rubik-Bold',
    fontSize: 13,
    textAlign: 'center',
  },
});

export default InvoiceAdjustmentModal;
