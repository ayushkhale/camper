import React, { useState, useContext, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image, Linking, Modal
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import { Menu, LogOut, Globe, User, Edit3, X, Check, Shield, Trash2, ExternalLink, Briefcase, Mail, MapPin, Map, Hash, Grid, Edit2, ArrowLeft } from 'lucide-react-native';
import { seedDatabase } from '../../utils/seedDatabase';
import CurvedHeader from '../../components/CurvedHeader';

const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const { logout, userToken, user } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('');
  const [categoryName, setCategoryName] = useState('');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchProfile = async () => {
        try {
          const res = await api.getVendorProfile(userToken);
          if (isActive && res.success && res.profile) {
            const vendorAccount = res.profile.VendorAccounts?.[0];
            setName(res.profile.name || '');
            setBusinessName(vendorAccount?.businessName || '');
            setCity(vendorAccount?.city || '');
            setAddress(vendorAccount?.address || '');
            setEmail(res.profile.email || '');
            setPincode(vendorAccount?.pincode || '');
            setCountry(vendorAccount?.country || '');
            setCategoryName(vendorAccount?.VendorServiceLines?.[0]?.BusinessCategory?.name || '');
          }
        } catch (e) {
          console.error(e);
        } finally {
          if (isActive) setLoading(false);
        }
      };
      fetchProfile();
      return () => { isActive = false; };
    }, [userToken])
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedData = { name, businessName, city, address, email, pincode, country };
      const res = await api.updateVendorProfile(userToken, updatedData);
      if (res.success) {
        showAlert('Success', 'Profile updated successfully', 'success');
        setIsEditing(false);
      }
    } catch (e) {
      showAlert('Error', 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    showAlert(
      t('settings.logout'),
      t('settings.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.logout'), style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await api.deleteAccount(userToken);
      if (response.success) {
        setIsDeleteModalVisible(false);
        // Alert user
        showAlert("Account Deleted", response.message || "Your account has been successfully scheduled for deletion.", [{ text: "OK" }]);
        // Logout internally clears tokens and redirects to Login
        logout();
      }
    } catch (error) {
      if (error?.response?.status === 403 || error?.status === 403 || error?.message?.includes('403')) {
        showAlert("Error", "Only the vendor owner can delete this account.", [{ text: "OK" }]);
      } else {
        showAlert("Error", "An error occurred while deleting your account.", [{ text: "OK" }]);
      }
    } finally {
      setIsDeleting(false);
    }
  };


  const handleSkipAddress = () => {
    if (!isEditing) return;
    setAddress('N/A');
    setPincode('000000');
    setCity('N/A');
    setCountry('India');
  };

  const changeLanguage = async (lng) => {
    i18n.changeLanguage(lng);
    await AsyncStorage.setItem('app_language', lng);
  };

  const handleSeed = async () => {
    showAlert(
      t('settings.seedDatabase'),
      t('settings.seedConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.seed'),
          onPress: async () => {
            setLoading(true);
            const res = await seedDatabase(userToken);
            setLoading(false);
            if (res.success) {
              showAlert('Success', res.message, 'success');
            } else {
              showAlert('Error', res.message, 'error');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Get Avatar Initials
  const getInitials = () => {
    if (name) return name.substring(0, 1).toUpperCase();
    if (businessName) return businessName.substring(0, 1).toUpperCase();
    return 'V';
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <CurvedHeader
        title={t('settings.title') || 'Settings'}
        leftIcon={<ArrowLeft size={24} color="#0B409C" />}
        onLeftPress={() => navigation.goBack()}
        rightIcon={(
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editActionBtn}>
            <Text style={isEditing ? styles.cancelText : styles.editActionText}>
              {isEditing ? t('common.cancel') : t('common.edit')}
            </Text>
          </TouchableOpacity>
        )}
        height={120}
        contentStyle={{ paddingTop: 10, paddingBottom: 25 }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Hero Section */}
          <View style={styles.profileHero}>
            <View style={styles.avatarContainer}>
              <FastImage source={require('../../../assets/heroSetting.jpeg')} style={styles.avatarImage} />
            </View>
            <Text style={styles.profileName}>{name || t('settings.yourProfile')}</Text>
            <Text style={styles.profileBusiness}>{businessName || t('settings.vendorAccount')}</Text>
          </View>

          {/* Form Fields Card */}
          <View style={styles.cardContainer}>
            <Text style={styles.sectionTitle}>{t('settings.businessInfo')}</Text>

            <Text style={styles.inputLabel}>{t('settings.fullName')}</Text>
            <View style={[styles.inputContainer, !isEditing && styles.inputDisabled]}>
              <User size={20} color={isEditing ? COLORS.primary : COLORS.textPlaceholder} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('completeReg.ownerPlaceholder')}
                placeholderTextColor={COLORS.textPlaceholder}
                editable={isEditing}
              />
            </View>

            <Text style={styles.inputLabel}>{t('settings.businessName')}</Text>
            <View style={[styles.inputContainer, !isEditing && styles.inputDisabled]}>
              <Briefcase size={20} color={isEditing ? COLORS.primary : COLORS.textPlaceholder} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder={t('completeReg.businessPlaceholder')}
                placeholderTextColor={COLORS.textPlaceholder}
                editable={isEditing}
              />
            </View>

            <Text style={styles.inputLabel}>{t('settings.businessCategory')}</Text>
            <View style={[styles.inputContainer, styles.inputDisabled]}>
              <Grid size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: COLORS.textPlaceholder }]}
                value={categoryName || t('settings.notSet')}
                editable={false}
              />
            </View>

            <Text style={styles.inputLabel}>{t('settings.emailAddress')}</Text>
            <View style={[styles.inputContainer, !isEditing && styles.inputDisabled]}>
              <Mail size={20} color={isEditing ? COLORS.primary : COLORS.textPlaceholder} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('staff.emailPlaceholder')}
                placeholderTextColor={COLORS.textPlaceholder}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={isEditing}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={[styles.inputLabel, { marginBottom: 0 }]}>{t('settings.addressLine1')}</Text>
              {isEditing && (
                <TouchableOpacity onPress={handleSkipAddress}>
                  <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: 'bold' }}>{t('settings.skipForNow')}</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={[styles.inputContainer, !isEditing && styles.inputDisabled]}>
              <MapPin size={20} color={isEditing ? COLORS.primary : COLORS.textPlaceholder} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder={t('customers.addressPlaceholder')}
                placeholderTextColor={COLORS.textPlaceholder}
                editable={isEditing}
              />
            </View>

            <Text style={styles.inputLabel}>{t('settings.city')}</Text>
            <View style={[styles.inputContainer, !isEditing && styles.inputDisabled]}>
              <Map size={20} color={isEditing ? COLORS.primary : COLORS.textPlaceholder} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder={t('settings.city')}
                placeholderTextColor={COLORS.textPlaceholder}
                editable={isEditing}
              />
            </View>

            <Text style={styles.inputLabel}>{t('settings.pincode')}</Text>
            <View style={[styles.inputContainer, !isEditing && styles.inputDisabled]}>
              <Hash size={20} color={isEditing ? COLORS.primary : COLORS.textPlaceholder} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={pincode}
                onChangeText={setPincode}
                placeholder={t('settings.pincode')}
                placeholderTextColor={COLORS.textPlaceholder}
                keyboardType="numeric"
                editable={isEditing}
              />
            </View>

            <Text style={styles.inputLabel}>{t('settings.country')}</Text>
            <View style={[styles.inputContainer, !isEditing && styles.inputDisabled]}>
              <Globe size={20} color={isEditing ? COLORS.primary : COLORS.textPlaceholder} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={country}
                onChangeText={setCountry}
                placeholder="Enter country"
                placeholderTextColor={COLORS.textPlaceholder}
                editable={isEditing}
              />
            </View>

            {isEditing && (
              <TouchableOpacity style={[styles.button, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Check size={18} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.buttonText}>{t('common.saveChanges')}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Preferences Section */}
          <View style={[styles.cardContainer, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>{t('settings.appSettings')}</Text>
            <View style={styles.prefRow}>
              <View style={styles.prefLeft}>
                <Globe size={20} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
                <Text style={styles.prefLabel}>{t('settings.language')}</Text>
              </View>
              <View style={styles.languageRow}>
                <TouchableOpacity
                  style={[styles.langChip, i18n.language === 'en' && styles.activeLangChip]}
                  onPress={() => changeLanguage('en')}
                >
                  <Text style={[styles.langChipText, i18n.language === 'en' && styles.activeLangChipText]}>EN</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.langChip, i18n.language === 'hi' && styles.activeLangChip]}
                  onPress={() => changeLanguage('hi')}
                >
                  <Text style={[styles.langChipText, i18n.language === 'hi' && styles.activeLangChipText]}>HI</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.prefRow, { marginTop: 12 }]}
              onPress={() => Linking.openURL('https://docs.google.com/document/d/e/2PACX-1vRYAhcFS9ilQgfefLBlDoGwhAQGbPdlLBGc8mIyGSiS-Ho_L1kQv1Gp0PWKU7JeTlTP22aUfuPqI10i/pub')}
            >
              <View style={styles.prefLeft}>
                <Shield size={20} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
                <Text style={styles.prefLabel}>{t('settings.privacyPolicy')}</Text>
              </View>
              <ExternalLink size={16} color={COLORS.textPlaceholder} />
            </TouchableOpacity>

            {/* <TouchableOpacity 
              style={[styles.prefRow, { marginTop: 12 }]} 
              onPress={handleSeed}
            >
              <View style={styles.prefLeft}>
                <Database size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
                <Text style={[styles.prefLabel, { color: COLORS.primary }]}>Seed Test Data (10x)</Text>
              </View>
            </TouchableOpacity> */}

            {user?.role === 'owner' && (
              <TouchableOpacity
                style={[styles.prefRow, { marginTop: 12 }]}
                onPress={() => setIsDeleteModalVisible(true)}
              >
                <View style={styles.prefLeft}>
                  <Trash2 size={20} color={COLORS.danger} style={{ marginRight: 10 }} />
                  <Text style={[styles.prefLabel, { color: COLORS.danger }]}>{t('settings.deleteAccount')}</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.prefRow, { borderBottomWidth: 0, marginTop: 12 }]} onPress={handleLogout}>
              <View style={styles.prefLeft}>
                <LogOut size={20} color={COLORS.danger} style={{ marginRight: 10 }} />
                <Text style={styles.logoutText}>{t('settings.logout')}</Text>
              </View>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={isDeleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Trash2 size={32} color={COLORS.danger} />
            </View>
            <Text style={styles.modalTitle}>Delete Account?</Text>
            <Text style={styles.modalBody}>
              Are you sure you want to delete your account? This action will permanently wipe all your routes, customers, deliveries, and invoices. Your data will be permanently destroyed after a 30-day grace period.
            </Text>
            
            <View style={styles.modalButtonGroup}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsDeleteModalVisible(false)}
                disabled={isDeleting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalDeleteBtn}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalDeleteText}>Delete My Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  editActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  editActionText: {
    fontSize: 13,
    fontFamily: 'Rubik-Bold',
    color: '#3730A3',
  },
  cancelText: {
    fontSize: 13,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textSecondary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  profileHero: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#FFF',
    paddingVertical: 24,
    borderRadius: 20,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatarContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#EFF6FF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileName: {
    fontSize: 22,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  profileBusiness: {
    fontSize: 14.5,
    color: COLORS.textSecondary,
    fontFamily: 'Rubik-SemiBold',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
    color: '#64748B',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardContainer: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'Rubik-SemiBold',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 20,
    height: 52,
    paddingHorizontal: 16,
  },
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    opacity: 0.7,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: 'Rubik-Regular',
  },
  button: {
    width: '100%',
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  preferencesContainer: {
    width: '100%',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  prefLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  languageRow: {
    flexDirection: 'row',
  },
  langChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    marginLeft: 10,
  },
  activeLangChip: {
    backgroundColor: COLORS.primary,
  },
  langChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPlaceholder,
  },
  activeLangChipText: {
    color: '#FFFFFF',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.danger,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtonGroup: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  modalDeleteBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: COLORS.danger,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalDeleteText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  }
});

export default SettingsScreen;
