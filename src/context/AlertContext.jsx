import React, { createContext, useContext, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'error',
    buttons: null,
  });

  const translateY = useRef(new Animated.Value(-120)).current;

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

    setAlertConfig({ visible: true, title, message, type, buttons });

    Animated.spring(translateY, {
      toValue: Platform.OS === 'ios' ? 50 : 20,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();

    if (!buttons) {
      setTimeout(() => {
        hideAlert();
      }, 3500);
    }
  };

  const hideAlert = () => {
    Animated.timing(translateY, {
      toValue: -140,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setAlertConfig(prev => ({ ...prev, visible: false, buttons: null }));
    });
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
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

            {!alertConfig.buttons && (
              <TouchableOpacity onPress={hideAlert} style={styles.closeBtn} activeOpacity={0.7}>
                <X size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {alertConfig.buttons && alertConfig.buttons.length > 0 && (
            <View style={styles.buttonsRow}>
              {alertConfig.buttons.map((btn, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.actionBtn,
                    btn.style === 'destructive' ? styles.destructiveBtn : styles.defaultBtn,
                  ]}
                  onPress={() => {
                    hideAlert();
                    if (btn.onPress) btn.onPress();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.actionBtnText, btn.style === 'destructive' && styles.destructiveText]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>
      )}
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
    backgroundColor: COLORS.success || '#108700ff',
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
    fontFamily: 'Geologica-Bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: '#FFFFFF',
    opacity: 0.95,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 10,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  defaultBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  destructiveBtn: {
    backgroundColor: '#FFFFFF',
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: 'Geologica-Bold',
    color: '#FFFFFF',
  },
  destructiveText: {
    color: COLORS.danger || '#980000ff',
  },
});
