import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { BadgePercent, ChevronRight, CirclePlus, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../shared/constants/colors';

const InvoiceAdjustmentActionsSheet = ({ visible, onClose, onSelect }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const sheetStyle = [
    styles.sheet,
    { paddingBottom: Math.max(insets.bottom, 20) + 12 },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>

        <View style={sheetStyle}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{t('invoices.adjustments')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              <X size={19} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.option, styles.discountOption]}
            onPress={() => onSelect('discount')}
            activeOpacity={0.78}
            accessibilityRole="button"
          >
            <View style={[styles.optionIcon, styles.discountIcon]}>
              <BadgePercent size={23} color="#7C3AED" />
            </View>
            <Text style={[styles.optionText, styles.discountText]}>
              {t('invoices.addDiscount')}
            </Text>
            <ChevronRight size={20} color="#8B5CF6" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, styles.extraOption]}
            onPress={() => onSelect('extra')}
            activeOpacity={0.78}
            accessibilityRole="button"
          >
            <View style={[styles.optionIcon, styles.extraIcon]}>
              <CirclePlus size={23} color="#EA580C" />
            </View>
            <Text style={[styles.optionText, styles.extraText]}>
              {t('invoices.addExtraCharge')}
            </Text>
            <ChevronRight size={20} color="#F97316" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
  },
  sheet: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 12,
  },
  handle: {
    width: 42,
    height: 4,
    alignSelf: 'center',
    marginBottom: 16,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    color: COLORS.textPrimary,
    fontFamily: 'Rubik-Bold',
    fontSize: 18,
  },
  closeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
  },
  option: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 16,
  },
  discountOption: {
    borderColor: '#DDD6FE',
    backgroundColor: '#FAF5FF',
  },
  extraOption: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
  },
  optionIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderRadius: 13,
  },
  discountIcon: {
    backgroundColor: '#EDE9FE',
  },
  extraIcon: {
    backgroundColor: '#FFEDD5',
  },
  optionText: {
    flex: 1,
    fontFamily: 'Rubik-Bold',
    fontSize: 14,
  },
  discountText: {
    color: '#6D28D9',
  },
  extraText: {
    color: '#C2410C',
  },
});

export default InvoiceAdjustmentActionsSheet;
