import React, { createContext, useContext, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform, Modal } from 'react-native';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../shared/constants/colors';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const { t } = useTranslation();
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'error',
    buttons: null,
  });

  // Minimal iOS Popup State
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [{ text: t('common.okay') }],
    variant: 'default',
  });

  const translateY = useRef(new Animated.Value(-120)).current;
  const insets = useSafeAreaInsets();

  const showAlert = (titleOrMsg, messageOrType, typeOrButtons, optionalType) => {
    let title = '';
    let message = '';
    let type = 'error';
    let buttons = null;

    if (Array.isArray(typeOrButtons)) {
      title = titleOrMsg;
      message = messageOrType;
      buttons = typeOrButtons;
      type = optionalType || 'warning';

      // Automatically show iOS minimal popup dialog if buttons array is passed!
      showPopup(title, message, buttons, type);
      return;
    } else if (typeof messageOrType === 'string' && ['success', 'error', 'info', 'warning'].includes(typeOrButtons)) {
      title = titleOrMsg;
      message = messageOrType;
      type = typeOrButtons;
    } else if (typeof titleOrMsg === 'string' && typeof messageOrType === 'string') {
      title = titleOrMsg;
      message = messageOrType;
      type = (typeOrButtons && typeof typeOrButtons === 'string') ? typeOrButtons : 'info';
    } else {
      message = titleOrMsg || '';
      type = messageOrType || 'error';
    }

    if (message.toLowerCase().includes('token')) {
      type = 'info';
    }

    // Ignore plan limit errors here, as they are handled globally by a blocking modal
    if (message === 'PLAN_LIMIT_REACHED' || title === 'PLAN_LIMIT_REACHED') {
      return;
    }

    setAlertConfig({ visible: true, title, message, type, buttons: null });

    const topInset = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 50 : 20);

    Animated.spring(translateY, {
      toValue: topInset + 10,
      useNativeDriver: true,
      tension: 80,

      friction: 10,
    }).start();

    setTimeout(() => {
      hideAlert();
    }, 3500);
  };

  const hideAlert = () => {
    Animated.timing(translateY, {
      toValue: -140,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setAlertConfig(prev => ({ ...prev, visible: false }));
    });
  };

  const showPopup = (title, message, buttons = [{ text: t('common.okay') }], variant = 'default') => {
    setModalConfig({
      visible: true,
      title: title || t('common.notice'),
      message: message || '',
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: t('common.okay') }],
      variant,
    });
  };

  const hidePopup = () => {
    setModalConfig(prev => ({ ...prev, visible: false }));
  };

  const isSubscriptionPopup = modalConfig.variant === 'subscription';

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert, showPopup, hidePopup }}>
      {children}
      
      {/* Toast Alert Banner */}
      {alertConfig.visible && (
        <Animated.View
          style={[
            styles.alertContainer,
            alertConfig.type === 'success' && styles.alertSuccess,
            alertConfig.type === 'error' && styles.alertError,
            alertConfig.type === 'warning' && styles.alertWarning,
            alertConfig.type === 'info' && styles.alertInfo,
            { transform: [{ translateY }] },
          ]}
        >
          <View style={styles.alertContent}>
            {alertConfig.type === 'success' && <CheckCircle2 size={22} color="#FFFFFF" style={styles.icon} />}
            {alertConfig.type === 'error' && <AlertCircle size={22} color="#FFFFFF" style={styles.icon} />}
            {alertConfig.type === 'warning' && <AlertCircle size={22} color="#FFFFFF" style={styles.icon} />}
            {alertConfig.type === 'info' && <Info size={22} color="#FFFFFF" style={styles.icon} />}
            
            <View style={styles.textContainer}>
              {!!alertConfig.title && <Text style={styles.alertTitle}>{alertConfig.title}</Text>}
              {!!alertConfig.message && <Text style={styles.alertMessage}>{alertConfig.message}</Text>}
            </View>

            <TouchableOpacity onPress={hideAlert} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* iOS Minimal Popup Dialog */}
      <Modal
        visible={modalConfig.visible}
        transparent
        animationType="fade"
        onRequestClose={hidePopup}
      >
        <View style={[styles.iosOverlay, isSubscriptionPopup && styles.subscriptionOverlay]}>
          <View style={[styles.iosDialog, isSubscriptionPopup && styles.subscriptionDialog]}>
            {isSubscriptionPopup && <View style={styles.subscriptionAccent} />}

            <View style={[styles.iosDialogContent, isSubscriptionPopup && styles.subscriptionDialogContent]}>
              {isSubscriptionPopup && (
                <>
                  <View style={styles.subscriptionIconWrap}>
                    <AlertCircle size={34} color="#D97706" strokeWidth={2.4} />
                  </View>
                  <View style={styles.subscriptionBadge}>
                    <Text style={styles.subscriptionBadgeText}>
                      {t('subscriptionBilling.planAccessRequired')}
                    </Text>
                  </View>
                </>
              )}

              {!!modalConfig.title && (
                <Text style={[styles.iosTitle, isSubscriptionPopup && styles.subscriptionTitle]}>
                  {modalConfig.title}
                </Text>
              )}
              <Text style={[styles.iosMessage, isSubscriptionPopup && styles.subscriptionMessage]}>
                {modalConfig.message}
              </Text>

              {isSubscriptionPopup && (
                <View style={styles.subscriptionInfoBox}>
                  <Info size={18} color={COLORS.primary} style={styles.subscriptionInfoIcon} />
                  <Text style={styles.subscriptionInfoText}>
                    {t('subscriptionBilling.upgradeInfo')}
                  </Text>
                </View>
              )}
            </View>

            {!isSubscriptionPopup && <View style={styles.iosDivider} />}

            <View style={[styles.iosButtonsRow, isSubscriptionPopup && styles.subscriptionButtonsRow]}>
              {modalConfig.buttons.map((btn, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.iosBtn,
                    !isSubscriptionPopup && idx > 0 && styles.iosBtnBorderLeft,
                    isSubscriptionPopup && styles.subscriptionBtn,
                    isSubscriptionPopup && btn.style !== 'cancel' && styles.subscriptionPrimaryBtn,
                  ]}
                  onPress={() => {
                    hidePopup();
                    if (btn.onPress) btn.onPress();
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.iosBtnText,
                      btn.style === 'destructive' && styles.iosDestructiveText,
                      btn.style === 'cancel' && styles.iosCancelText,
                      isSubscriptionPopup && styles.subscriptionBtnText,
                      isSubscriptionPopup && btn.style !== 'cancel' && styles.subscriptionPrimaryBtnText,
                    ]}
                  >
                    {btn.text || t('common.okay')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  alertContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 99999,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  alertSuccess: {
    backgroundColor: COLORS.success || '#129c00ff',
  },
  alertError: {
    backgroundColor: COLORS.danger || '#980000ff',
  },
  alertWarning: {
    backgroundColor: COLORS.warning || '#D97706',
  },
  alertInfo: {
    backgroundColor: COLORS.primary || '#0e44a8',
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 13,
    fontFamily: 'Rubik-SemiBold',
    color: '#FFFFFF',
    opacity: 0.95,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },

  // Minimal iOS Dialog Popup Styling
  iosOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iosDialog: {
    width: '100%',
    maxWidth: 360,
    minHeight: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  iosDialogContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 26,
    paddingTop: 26,
    paddingBottom: 24,
    alignItems: 'center',
  },
  iosTitle: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  iosMessage: {
    fontSize: 14,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  iosDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    width: '100%',
  },
  iosButtonsRow: {
    flexDirection: 'row',
    height: 54,
    width: '100%',
  },
  iosBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  iosBtnBorderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
  },
  iosBtnText: {
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    color: COLORS.primary,
  },
  iosDestructiveText: {
    color: COLORS.danger,
  },
  iosCancelText: {
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textSecondary,
  },
  subscriptionOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 16,
  },
  subscriptionDialog: {
    maxWidth: 390,
    minHeight: 350,
    borderRadius: 28,
    backgroundColor: '#FFFCF7',
    shadowColor: '#78350F',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 16,
  },
  subscriptionAccent: {
    width: '100%',
    height: 7,
    backgroundColor: '#F59E0B',
  },
  subscriptionDialogContent: {
    flex: 0,
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 24,
  },
  subscriptionIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 12,
  },
  subscriptionBadge: {
    backgroundColor: '#FFEDD5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
  },
  subscriptionBadgeText: {
    color: '#C2410C',
    fontSize: 10,
    fontFamily: 'Rubik-Bold',
    letterSpacing: 0.8,
  },
  subscriptionTitle: {
    color: '#7C2D12',
    fontSize: 21,
    marginBottom: 8,
  },
  subscriptionMessage: {
    color: '#475569',
    fontFamily: 'Rubik-Medium',
    lineHeight: 22,
  },
  subscriptionInfoBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginTop: 17,
  },
  subscriptionInfoIcon: {
    marginTop: 1,
    marginRight: 9,
  },
  subscriptionInfoText: {
    flex: 1,
    color: '#1E3A8A',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Rubik-Medium',
  },
  subscriptionButtonsRow: {
    height: 78,
    minHeight: 78,
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 8,
  },
  subscriptionBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 5,
  },
  subscriptionPrimaryBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 7,
    elevation: 4,
  },
  subscriptionBtnText: {
    color: '#64748B',
  },
  subscriptionPrimaryBtnText: {
    color: '#FFFFFF',
  },
});
