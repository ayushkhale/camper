import React, { createContext, useContext, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform, Modal } from 'react-native';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/colors';

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
      showPopup(title, message, buttons);
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

  const showPopup = (title, message, buttons = [{ text: t('common.okay') }]) => {
    setModalConfig({
      visible: true,
      title: title || t('common.notice'),
      message: message || '',
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: t('common.okay') }],
    });
  };

  const hidePopup = () => {
    setModalConfig(prev => ({ ...prev, visible: false }));
  };

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
        <View style={styles.iosOverlay}>
          <View style={styles.iosDialog}>
            <View style={styles.iosDialogContent}>
              {!!modalConfig.title && (
                <Text style={styles.iosTitle}>{modalConfig.title}</Text>
              )}
              <Text style={styles.iosMessage}>{modalConfig.message}</Text>
            </View>

            <View style={styles.iosDivider} />

            <View style={styles.iosButtonsRow}>
              {modalConfig.buttons.map((btn, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.iosBtn,
                    idx > 0 && styles.iosBtnBorderLeft,
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
    paddingHorizontal: 32,
  },
  iosDialog: {
    width: '100%',
    maxWidth: 290,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  iosDialogContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    alignItems: 'center',
  },
  iosTitle: {
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  iosMessage: {
    fontSize: 13,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  iosDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    width: '100%',
  },
  iosButtonsRow: {
    flexDirection: 'row',
    height: 46,
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
});
