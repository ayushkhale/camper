import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Check, ChevronDown, Globe2, Languages, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/colors';

export const SUPPORTED_LANGUAGES = Object.freeze([
  { code: 'en', shortLabel: 'EN', name: 'English', nativeName: 'English' },
  { code: 'hi', shortLabel: 'HI', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mr', shortLabel: 'MR', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', shortLabel: 'BN', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ta', shortLabel: 'TA', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', shortLabel: 'TE', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'gu', shortLabel: 'GU', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa', shortLabel: 'PA', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
]);

const normalizeLanguageCode = language => String(language || 'en').split('-')[0];

const LanguageSelector = ({ compact = false, style }) => {
  const { t, i18n } = useTranslation();
  const [visible, setVisible] = useState(false);
  const selectedCode = normalizeLanguageCode(i18n.resolvedLanguage || i18n.language);
  const selectedLanguage = useMemo(
    () => SUPPORTED_LANGUAGES.find(language => language.code === selectedCode) || SUPPORTED_LANGUAGES[0],
    [selectedCode],
  );

  const selectLanguage = async (languageCode) => {
    setVisible(false);
    await i18n.changeLanguage(languageCode);
    try {
      await AsyncStorage.setItem('app_language', languageCode);
    } catch (error) {
      console.error('Failed to save language', error);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.selectorButton, compact && styles.selectorButtonCompact, style]}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Globe2 size={17} color={COLORS.primary} />
        <Text style={styles.selectorButtonText} numberOfLines={1}>
          {compact ? selectedLanguage.shortLabel : selectedLanguage.nativeName}
        </Text>
        <ChevronDown size={16} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setVisible(false)}
          />

          <View style={styles.sheet}>
            <View style={styles.sheetAccent} />
            <View style={styles.sheetHeader}>
              <View style={styles.headerIcon}>
                <Languages size={23} color={COLORS.primary} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>{t('settings.language')}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setVisible(false)}
                activeOpacity={0.75}
              >
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.languageGrid}
              showsVerticalScrollIndicator={false}
            >
              {SUPPORTED_LANGUAGES.map(language => {
                const selected = language.code === selectedCode;
                return (
                  <TouchableOpacity
                    key={language.code}
                    style={[styles.languageOption, selected && styles.languageOptionSelected]}
                    onPress={() => selectLanguage(language.code)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.languageCode, selected && styles.languageCodeSelected]}>
                      <Text style={[styles.languageCodeText, selected && styles.languageCodeTextSelected]}>
                        {language.shortLabel}
                      </Text>
                    </View>
                    <View style={styles.languageNames}>
                      <Text style={[styles.nativeName, selected && styles.nativeNameSelected]}>
                        {language.nativeName}
                      </Text>
                      <Text style={styles.englishName}>{language.name}</Text>
                    </View>
                    {selected && (
                      <View style={styles.selectedCheck}>
                        <Check size={15} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selectorButton: {
    minWidth: 118,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 13,
    paddingHorizontal: 11,
  },
  selectorButtonCompact: {
    minWidth: 76,
    height: 38,
    paddingHorizontal: 9,
  },
  selectorButtonText: {
    flexShrink: 1,
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: 'Rubik-Bold',
    marginHorizontal: 7,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 18,
  },
  sheet: {
    width: '100%',
    maxWidth: 410,
    maxHeight: '78%',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.26,
    shadowRadius: 22,
    elevation: 18,
  },
  sheetAccent: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.primary,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    marginRight: 11,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 19,
    fontFamily: 'Rubik-Bold',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    marginLeft: 10,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    paddingBottom: 18,
  },
  languageOption: {
    width: '47%',
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 11,
    margin: '1.5%',
  },
  languageOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: COLORS.primary,
  },
  languageCode: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    marginRight: 8,
  },
  languageCodeSelected: {
    backgroundColor: COLORS.primary,
  },
  languageCodeText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontFamily: 'Rubik-Bold',
  },
  languageCodeTextSelected: {
    color: '#FFFFFF',
  },
  languageNames: {
    flex: 1,
  },
  nativeName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: 'Rubik-SemiBold',
  },
  nativeNameSelected: {
    color: COLORS.primary,
    fontFamily: 'Rubik-Bold',
  },
  englishName: {
    color: COLORS.textPlaceholder,
    fontSize: 10,
    fontFamily: 'Rubik-Regular',
    marginTop: 2,
  },
  selectedCheck: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 21,
    height: 21,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
});

export default LanguageSelector;
