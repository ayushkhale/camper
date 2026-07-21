import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';

const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const { logout } = useContext(AuthContext);

  const changeLanguage = async (lng) => {
    i18n.changeLanguage(lng);
    await AsyncStorage.setItem('app_language', lng);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('settings.title')}</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        
        <View style={styles.languageContainer}>
          <TouchableOpacity 
            style={[styles.langButton, i18n.language === 'en' && styles.activeLang]} 
            onPress={() => changeLanguage('en')}
          >
            <Text style={[styles.langText, i18n.language === 'en' && styles.activeLangText]}>
              {t('settings.english')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.langButton, i18n.language === 'hi' && styles.activeLang]} 
            onPress={() => changeLanguage('hi')}
          >
            <Text style={[styles.langText, i18n.language === 'hi' && styles.activeLangText]}>
              {t('settings.hindi')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>{t('settings.logout')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 20,
    color: COLORS.textPrimary,
    fontFamily: 'Inter-Bold',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
    marginBottom: 15,
  },
  languageContainer: {
    flexDirection: 'row',
  },
  langButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    backgroundColor: COLORS.primaryLight,
    marginRight: 15,
  },
  activeLang: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primary,
  },
  langText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontFamily: 'Inter-Medium',
  },
  activeLangText: {
    color: COLORS.textPrimary,
  },
  logoutButton: {
    marginTop: 40,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  logoutText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
  }
});

export default SettingsScreen;
