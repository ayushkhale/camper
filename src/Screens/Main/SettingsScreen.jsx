import React, { useState, useContext, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import { Menu, LogOut, Globe, User, Edit3, X, Check, Shield, Trash2, ExternalLink, Database } from 'lucide-react-native';
import { seedDatabase } from '../../utils/seedDatabase';

const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const { logout, userToken } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
      'Seed Database',
      'This will create 10 dummy products, customers, and subscriptions. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Seed',
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Top Header Controls */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.menuIconButton}>
              <Menu size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
              style={styles.editActionBtn}
            >
              <Text style={isEditing ? styles.cancelText : styles.editActionText}>
                {isEditing ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Profile Hero Section */}
          <View style={styles.profileHero}>
            <View style={styles.avatarContainer}>
              <Image source={require('../../../assets/fallbackimage.png')} style={styles.avatarImage} />
            </View>
            <Text style={styles.profileName}>{name || 'Your Profile'}</Text>
            <Text style={styles.profileBusiness}>{businessName || 'Vendor Account'}</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Business Information</Text>

            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={[styles.inputContainer, !isEditing && styles.inputDisabled]}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.textPlaceholder}
                editable={isEditing}
              />
            </View>

            <Text style={styles.inputLabel}>Business Name</Text>
            <View style={[styles.inputContainer, !isEditing && styles.inputDisabled]}>
              <TextInput
                style={styles.input}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Enter business name"
                placeholderTextColor={COLORS.textPlaceholder}
                editable={isEditing}
              />
            </View>

            <Text style={styles.inputLabel}>Business Category</Text>
            <View style={[styles.inputContainer, styles.inputDisabled]}>
              <TextInput
                style={[styles.input, { color: COLORS.textPlaceholder }]}
                value={categoryName || 'Not Set'}
                editable={false}
              />
            </View>

            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={[styles.inputContainer, !isEditing && styles.inputDisabled]}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email"
                placeholderTextColor={COLORS.textPlaceholder}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={isEditing}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={[styles.inputLabel, { marginBottom: 0 }]}>Address Line 1</Text>
              {isEditing && (
                <TouchableOpacity onPress={handleSkipAddress}>
                  <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: 'bold' }}>Skip for now</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={[styles.inputContainer, !isEditing && styles.inputDisabled]}>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter address"
                placeholderTextColor={COLORS.textPlaceholder}
                editable={isEditing}
              />
            </View>

            <Text style={styles.inputLabel}>City</Text>
            <View style={[styles.inputContainer, !isEditing && styles.inputDisabled]}>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="Enter city"
                placeholderTextColor={COLORS.textPlaceholder}
                editable={isEditing}
              />
            </View>

            <Text style={styles.inputLabel}>Pincode</Text>
            <View style={[styles.inputContainer, !isEditing && styles.inputDisabled]}>
              <TextInput
                style={styles.input}
                value={pincode}
                onChangeText={setPincode}
                placeholder="Enter pincode"
                placeholderTextColor={COLORS.textPlaceholder}
                keyboardType="numeric"
                editable={isEditing}
              />
            </View>

            <Text style={styles.inputLabel}>Country</Text>
            <View style={[styles.inputContainer, !isEditing && styles.inputDisabled]}>
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
                    <Text style={styles.buttonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Preferences Section */}
          <Text style={[styles.sectionTitle, { marginTop: 32 }]}>App Settings</Text>

          <View style={styles.preferencesContainer}>
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
                <Text style={styles.prefLabel}>Privacy Policy</Text>
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

            <TouchableOpacity
              style={[styles.prefRow, { marginTop: 12 }]}
              onPress={() => Linking.openURL('https://docs.google.com/document/d/e/2PACX-1vR4_iNcbJV3YstWuk7ZibvNSdqbFLpYu10iVqAWjg7y8HsqvzgxfeoTcvl-nF_kIGUf77OKuoWuibzY/pub')}
            >
              <View style={styles.prefLeft}>
                <Trash2 size={20} color={COLORS.danger} style={{ marginRight: 10 }} />
                <Text style={[styles.prefLabel, { color: COLORS.danger }]}>Delete Account</Text>
              </View>
              <ExternalLink size={16} color={COLORS.danger} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.prefRow, { borderBottomWidth: 0, marginTop: 12 }]} onPress={logout}>
              <View style={styles.prefLeft}>
                <LogOut size={20} color={COLORS.danger} style={{ marginRight: 10 }} />
                <Text style={styles.logoutText}>{t('settings.logout')}</Text>
              </View>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 24 : 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  menuIconButton: {
    padding: 4,
    marginLeft: -4,
  },
  editActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  editActionText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  profileHero: {
    alignItems: 'center',
    marginBottom: 36,
    marginTop: 10,
  },
  avatarContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarText: {
    fontSize: 34,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  profileBusiness: {
    fontSize: 14.5,
    color: COLORS.textPlaceholder,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  inputContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    backgroundColor: COLORS.surface,
    marginBottom: 16,
    height: 52,
    justifyContent: 'center',
  },
  inputDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
    opacity: 0.9,
  },
  input: {
    height: '100%',
    color: COLORS.textPrimary,
    fontSize: 15,
    paddingHorizontal: 16,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
  }
});

export default SettingsScreen;
