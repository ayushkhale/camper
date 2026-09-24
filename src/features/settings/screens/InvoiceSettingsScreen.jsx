import React, { useState, useCallback, useContext, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
  Alert, Modal, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft, FileText, Hash, Save, RotateCcw, Info, Eye,
  CreditCard, Smartphone, QrCode, Ban, Plus, Trash2, Edit3,
  Building2, Check, X, Upload, ChevronDown, ChevronUp,
} from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../shared/constants/colors';
import { AuthContext } from '../../../app/providers/AuthContext';
import { api } from '../../../shared/services/api';
import { useAlert } from '../../../app/providers/AlertContext';
import CurvedHeader from '../../../shared/components/CurvedHeader';

const MAX_PREFIX_LENGTH = 11;
const MAX_TERMS_LENGTH = 5000;

const PAYMENT_MODES = [
  { key: 'none',         label: 'settings.none', defaultLabel: 'None',         icon: Ban,          color: '#94A3B8', bg: '#F1F5F9' },
  { key: 'bank_account', label: 'settings.bankAccount', defaultLabel: 'Bank Account',  icon: Building2,    color: '#1E3A8A', bg: '#EFF6FF' },
  { key: 'upi_id',       label: 'settings.upiId', defaultLabel: 'UPI ID',        icon: Smartphone,   color: '#7C3AED', bg: '#F5F3FF' },
  { key: 'qr_code',      label: 'settings.qrCode', defaultLabel: 'QR Code',       icon: QrCode,       color: '#0D9488', bg: '#F0FDFA' },
];

const emptyBankForm = { accountName: '', bankName: '', accountNumber: '', ifscCode: '' };

const InvoiceSettingsScreen = () => {
  const navigation = useNavigation();
  const { userToken } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const { t } = useTranslation();

  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [settings, setSettings]     = useState(null);

  // Prefix & T&C
  const [prefix, setPrefix] = useState('INV');
  const [terms, setTerms]   = useState('');

  // Payment mode state
  const [paymentMode, setPaymentMode]                     = useState('none');
  const [upiId, setUpiId]                                 = useState('');
  const [qrCodeImageUrl, setQrCodeImageUrl]               = useState(null);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState(null);
  const [uploadingQr, setUploadingQr]                     = useState(false);

  // Bank accounts
  const [bankAccounts, setBankAccounts]         = useState([]);
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [editingBank, setEditingBank]           = useState(null);
  const [bankForm, setBankForm]                 = useState(emptyBankForm);
  const [savingBank, setSavingBank]             = useState(false);
  const [deletingBankId, setDeletingBankId]     = useState(null);
  const [activatingBankId, setActivatingBankId] = useState(null); // tracks which card is being activated

  const loadData = useCallback(async (isActive) => {
    try {
      setLoading(true);
      const [settingsRes, bankRes] = await Promise.all([
        api.getInvoiceSettings(userToken),
        api.getBankAccounts(userToken),
      ]);

      if (isActive && settingsRes?.success && settingsRes?.data) {
        const d = settingsRes.data;
        setSettings(d);
        setPrefix(d.invoicePrefix || 'INV');
        setTerms(d.termsAndConditions || '');
        setPaymentMode(d.paymentMode || 'none');
        setUpiId(d.upiId || '');
        setQrCodeImageUrl(d.qrCodeImageUrl || null);
        setSelectedBankAccountId(d.selectedBankAccountId || null);
      }
      if (isActive && bankRes?.success) {
        setBankAccounts(bankRes.data || []);
      }
    } catch (e) {
      showAlert('Error', e.message || 'Failed to load settings', 'error');
    } finally {
      if (isActive) setLoading(false);
    }
  }, [userToken]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      loadData(isActive);
      return () => { isActive = false; };
    }, [loadData])
  );

  const nextPreview = settings
    ? `${prefix.toUpperCase()}-${String(settings.invoiceCounter + 1).padStart(4, '0')}`
    : '—';

  // ── Save invoice settings ──
  const handleSave = async () => {
    const cleanPrefix = prefix.toUpperCase().trim();
    if (!cleanPrefix) { showAlert('Validation Error', 'Invoice prefix cannot be empty.', 'error'); return; }
    if (!/^[A-Z0-9-]+$/.test(cleanPrefix)) { showAlert('Validation Error', 'Prefix may only contain uppercase letters, digits, and hyphens.', 'error'); return; }

    const body = {};
    if (cleanPrefix !== settings?.invoicePrefix) body.invoicePrefix = cleanPrefix;
    const savedTerms = settings?.termsAndConditions || '';
    if (terms !== savedTerms) body.termsAndConditions = terms || null;

    // Payment mode fields
    body.paymentMode = paymentMode;
    if (paymentMode === 'upi_id') body.upiId = upiId || null;
    if (paymentMode === 'bank_account') body.selectedBankAccountId = selectedBankAccountId || null;

    try {
      setSaving(true);
      const res = await api.updateInvoiceSettings(userToken, body);
      if (res?.success && res?.data) {
        setSettings(res.data);
        showAlert('Success', 'Invoice settings saved!', 'success');
      }
    } catch (e) {
      showAlert('Error', e?.message || 'Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── QR Code upload ──
  const handleUploadQr = async () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, async (response) => {
      if (response.didCancel || response.errorCode) return;
      const asset = response.assets?.[0];
      if (!asset) return;

      try {
        setUploadingQr(true);
        const res = await api.uploadQrCode(userToken, asset);
        if (res?.success) {
          const newUrl = res.data?.qrCodeImageUrl || res.qrCodeImageUrl;
          setQrCodeImageUrl(newUrl);
          setPaymentMode('qr_code');
          // Auto-save the mode
          await api.updateInvoiceSettings(userToken, { paymentMode: 'qr_code' });
          showAlert('Success', 'QR Code uploaded and set as active payment method!', 'success');
        }
      } catch (e) {
        showAlert('Error', e?.message || 'Failed to upload QR code.', 'error');
      } finally {
        setUploadingQr(false);
      }
    });
  };

  // ── Bank account CRUD ──
  const openAddBank = () => {
    setEditingBank(null);
    setBankForm(emptyBankForm);
    setBankModalVisible(true);
  };
  const openEditBank = (account) => {
    setEditingBank(account);
    setBankForm({
      accountName: account.accountName || '',
      bankName: account.bankName || '',
      accountNumber: account.accountNumber || '',
      ifscCode: account.ifscCode || '',
    });
    setBankModalVisible(true);
  };

  const handleSaveBank = async () => {
    const { accountName, bankName, accountNumber, ifscCode } = bankForm;
    if (!accountName.trim() || !bankName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
      showAlert('Validation Error', 'All bank account fields are required.', 'error');
      return;
    }
    try {
      setSavingBank(true);
      const isFirstAccount = !editingBank && bankAccounts.length === 0;
      let res;
      if (editingBank) {
        res = await api.updateBankAccount(userToken, editingBank.id, bankForm);
      } else {
        res = await api.addBankAccount(userToken, bankForm);
      }
      if (res?.success) {
        setBankModalVisible(false);
        const refreshed = await api.getBankAccounts(userToken);
        const newList = refreshed?.data || [];
        if (refreshed?.success) setBankAccounts(newList);

        // Auto-activate if this is the very first bank account added
        if (isFirstAccount && newList.length > 0) {
          const newAccount = newList[0];
          try {
            const activateRes = await api.setActiveBankAccount(userToken, newAccount.id);
            if (activateRes?.success) {
              setSelectedBankAccountId(newAccount.id);
              setPaymentMode('bank_account');
            }
          } catch (_) { /* silent — account is saved even if activation fails */ }
        }

        showAlert('Success', editingBank ? 'Bank account updated!' : 'Bank account added and activated!', 'success');
      }
    } catch (e) {
      showAlert('Error', e?.message || 'Failed to save bank account.', 'error');
    } finally {
      setSavingBank(false);
    }
  };

  const handleDeleteBank = (account) => {
    Alert.alert(
      'Delete Bank Account',
      `Remove "${account.bankName} ···${account.accountNumber?.slice(-4)}"? If this account is active on invoices, payment mode will reset to "None".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              setDeletingBankId(account.id);
              const res = await api.deleteBankAccount(userToken, account.id);
              if (res?.success) {
                const refreshed = await api.getBankAccounts(userToken);
                if (refreshed?.success) setBankAccounts(refreshed.data || []);
                // If deleted account was selected, reset mode
                if (selectedBankAccountId === account.id) {
                  setSelectedBankAccountId(null);
                  setPaymentMode('none');
                }
                showAlert('Deleted', 'Bank account removed.', 'success');
              }
            } catch (e) {
              showAlert('Error', e?.message || 'Failed to delete.', 'error');
            } finally {
              setDeletingBankId(null);
            }
          }
        },
      ]
    );
  };

  const handleClearTerms = () => {
    Alert.alert('Clear Terms & Conditions', 'Remove all T&C text?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setTerms('') },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <CurvedHeader title="Invoice Settings" leftIcon={<ArrowLeft size={24} color="#FFFFFF" />} onLeftPress={() => navigation.goBack()} height={120} contentStyle={{ paddingTop: 10, paddingBottom: 25 }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading settings…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedMode = PAYMENT_MODES.find(m => m.key === paymentMode) || PAYMENT_MODES[0];

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <CurvedHeader title="Invoice Settings" leftIcon={<ArrowLeft size={24} color="#FFFFFF" />} onLeftPress={() => navigation.goBack()} height={120} contentStyle={{ paddingTop: 10, paddingBottom: 25 }} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Counter Banner */}
          {settings?.invoiceCounter !== undefined && (
            <View style={styles.counterBanner}>
              <View style={styles.counterIconWrap}><FileText size={18} color="#1E3A8A" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.counterTitle}>Total Invoices Generated</Text>
                <Text style={styles.counterValue}>{settings.invoiceCounter} invoices so far</Text>
              </View>
              <View style={styles.counterBadge}><Text style={styles.counterBadgeText}>#{settings.invoiceCounter}</Text></View>
            </View>
          )}

          {/* ── Invoice Prefix Card ── */}
          <View style={styles.card}>
            <View style={[styles.cardAccent, { backgroundColor: '#1E3A8A' }]} />
            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBg, { backgroundColor: '#EFF6FF' }]}><Hash size={17} color="#1E3A8A" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Invoice Prefix</Text>
                  <Text style={styles.cardSubtitle}>Prepended to every invoice number</Text>
                </View>
              </View>
              <View style={styles.prefixRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>{t('settings.prefixCode', 'Prefix Code')}</Text>
                  <TextInput
                    style={styles.prefixInput}
                    value={prefix}
                    onChangeText={val => setPrefix(val.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, MAX_PREFIX_LENGTH))}
                    placeholder="INV"
                    placeholderTextColor={COLORS.textPlaceholder}
                    autoCapitalize="characters"
                    maxLength={MAX_PREFIX_LENGTH}
                    returnKeyType="done"
                  />
                  <Text style={styles.inputHint}>{prefix.length}/{MAX_PREFIX_LENGTH} · A–Z, 0–9, hyphens only</Text>
                </View>
                <View style={styles.previewBox}>
                  <View style={[styles.iconBg, { backgroundColor: '#DBEAFE', alignSelf: 'center', marginBottom: 6 }]}><Eye size={14} color="#2563EB" /></View>
                  <Text style={styles.previewLabel}>{t('settings.nextInvoice', 'Next Invoice')}</Text>
                  <Text style={styles.previewValue}>{nextPreview}</Text>
                  <Text style={styles.previewNote}>{t('settings.livePreview', 'Live Preview')}</Text>
                </View>
              </View>
              <View style={styles.infoBox}>
                <Info size={13} color="#3B82F6" style={{ marginTop: 1 }} />
                <Text style={styles.infoText}>{t('settings.prefixInfo', 'Changing prefix will not renumber existing invoices.')}</Text>
              </View>
            </View>
          </View>

          {/* ── Terms & Conditions Card ── */}
          <View style={[styles.card, { marginTop: 14 }]}>
            <View style={[styles.cardAccent, { backgroundColor: '#0D9488' }]} />
            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBg, { backgroundColor: '#F0FDFA' }]}><FileText size={17} color="#0D9488" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{t('settings.termsAndConditions', 'Terms & Conditions')}</Text>
                  <Text style={styles.cardSubtitle}>{t('settings.termsSubtitle', 'Printed at the bottom of every PDF invoice')}</Text>
                </View>
              </View>
              <Text style={styles.fieldLabel}>{t('settings.tcText', 'T&C Text')}</Text>
              <TextInput
                style={styles.termsInput}
                value={terms}
                onChangeText={val => setTerms(val.slice(0, MAX_TERMS_LENGTH))}
                placeholder="e.g. Payment due within 7 days. No refunds after delivery."
                placeholderTextColor={COLORS.textPlaceholder}
                multiline
                textAlignVertical="top"
                scrollEnabled={false}
                maxLength={MAX_TERMS_LENGTH}
              />
              <View style={styles.termsFooter}>
                <Text style={styles.inputHint}>{terms.length} / {MAX_TERMS_LENGTH}</Text>
                {terms.length > 0 && (
                  <TouchableOpacity onPress={handleClearTerms} style={styles.clearBtn} activeOpacity={0.7}>
                    <RotateCcw size={12} color="#DC2626" />
                    <Text style={styles.clearBtnText}>{t('common.clear', 'Clear')}</Text>
                  </TouchableOpacity>
                )}
              </View>
              {terms.length > 0 && (
                <View style={styles.termsPreview}>
                  <View style={styles.termsPreviewAccent} />
                  <View style={{ flex: 1, padding: 10, backgroundColor: '#EFF6FF' }}>
                    <Text style={styles.termsPreviewLabel}>{t('settings.termsCaps', 'TERMS & CONDITIONS')}</Text>
                    <Text style={styles.termsPreviewText}>{terms}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* ── Payment Details Card ── */}
          <View style={[styles.card, { marginTop: 14 }]}>
            <View style={[styles.cardAccent, { backgroundColor: '#7C3AED' }]} />
            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBg, { backgroundColor: '#F5F3FF' }]}><CreditCard size={17} color="#7C3AED" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{t('settings.paymentDetails', 'Payment Details on Invoice')}</Text>
                  <Text style={styles.cardSubtitle}>{t('settings.paymentSubtitle', 'How customers can pay you')}</Text>
                </View>
              </View>

              {/* Mode Selector */}
              <Text style={styles.fieldLabel}>{t('settings.paymentMethod', 'Payment Method')}</Text>
              <View style={styles.modeGrid}>
                {PAYMENT_MODES.map(mode => {
                  const Icon = mode.icon;
                  const isActive = paymentMode === mode.key;
                  return (
                    <TouchableOpacity
                      key={mode.key}
                      style={[styles.modeChip, isActive && { borderColor: mode.color, backgroundColor: mode.bg }]}
                      onPress={() => setPaymentMode(mode.key)}
                      activeOpacity={0.75}
                    >
                      <Icon size={16} color={isActive ? mode.color : '#94A3B8'} />
                      <Text style={[styles.modeChipText, isActive && { color: mode.color, fontFamily: 'Rubik-Bold' }]}>
                        {t(mode.label, mode.defaultLabel)}
                      </Text>
                      {isActive && <Check size={12} color={mode.color} style={{ marginLeft: 'auto' }} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* UPI ID Panel */}
              {paymentMode === 'upi_id' && (
                <View style={styles.paymentPanel}>
                  <Text style={styles.fieldLabel}>{t('settings.upiId', 'UPI ID')}</Text>
                  <View style={styles.upiInputRow}>
                    <Smartphone size={18} color="#7C3AED" style={{ marginRight: 10 }} />
                    <TextInput
                      style={[styles.prefixInput, { flex: 1, fontSize: 15, letterSpacing: 0 }]}
                      value={upiId}
                      onChangeText={setUpiId}
                      placeholder="yourname@okhdfc"
                      placeholderTextColor={COLORS.textPlaceholder}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      returnKeyType="done"
                    />
                  </View>
                  <Text style={styles.inputHint}>{t('settings.upiInfo', 'This UPI ID will be printed on every PDF invoice.')}</Text>
                </View>
              )}

              {/* QR Code Panel */}
              {paymentMode === 'qr_code' && (
                <View style={styles.paymentPanel}>
                  <Text style={styles.fieldLabel}>{t('settings.paymentQrCode', 'Payment QR Code')}</Text>
                  {qrCodeImageUrl ? (
                    <View style={styles.qrPreviewWrap}>
                      <Image source={{ uri: qrCodeImageUrl }} style={styles.qrPreviewImage} resizeMode="contain" />
                      <TouchableOpacity style={styles.qrChangeBtn} onPress={handleUploadQr} disabled={uploadingQr} activeOpacity={0.8}>
                        {uploadingQr ? <ActivityIndicator size="small" color="#0D9488" /> : <><Upload size={14} color="#0D9488" /><Text style={styles.qrChangeBtnText}>{t('settings.changeQr', 'Change QR')}</Text></>}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.qrUploadBtn} onPress={handleUploadQr} disabled={uploadingQr} activeOpacity={0.8}>
                      {uploadingQr
                        ? <ActivityIndicator size="small" color="#0D9488" />
                        : <><Upload size={20} color="#0D9488" /><Text style={styles.qrUploadText}>{t('settings.tapToUploadQr', 'Tap to Upload QR Code')}</Text><Text style={styles.qrUploadHint}>{t('settings.qrHint', 'JPEG, PNG, or WebP image')}</Text></>
                      }
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Bank Account Panel */}
              {paymentMode === 'bank_account' && (
                <View style={styles.paymentPanel}>
                  <View style={styles.bankPanelHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>{t('settings.selectBankAccount', 'Select Bank Account')}</Text>
                      <Text style={{ fontSize: 11, fontFamily: 'Rubik-Regular', color: '#94A3B8', marginTop: 2 }}>
                        Tap any card to activate it on your invoices
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.addBankBtn} onPress={openAddBank} activeOpacity={0.8}>
                      <Plus size={13} color="#1E3A8A" />
                      <Text style={styles.addBankBtnText}>Add New</Text>
                    </TouchableOpacity>
                  </View>

                  {bankAccounts.length === 0 ? (
                    <View style={styles.emptyBankBox}>
                      <Building2 size={28} color="#CBD5E1" />
                      <Text style={styles.emptyBankText}>No bank accounts yet.</Text>
                      <Text style={styles.emptyBankHint}>Tap "Add New" to add your first account.</Text>
                    </View>
                  ) : (
                    bankAccounts.map(account => {
                      const isSelected = selectedBankAccountId === account.id;
                      const isDeleting = deletingBankId === account.id;
                      return (
                        <TouchableOpacity
                          key={account.id}
                          style={[styles.bankCard, isSelected && styles.bankCardSelected]}
                          onPress={async () => {
                            if (isSelected || activatingBankId) return; // already active or busy
                            try {
                              setActivatingBankId(account.id);
                              const res = await api.setActiveBankAccount(userToken, account.id);
                              if (res?.success) {
                                setSelectedBankAccountId(account.id);
                                setPaymentMode('bank_account');
                                if (res?.data) setSettings(res.data);
                              }
                            } catch (e) {
                              showAlert('Error', e?.message || 'Failed to activate account.', 'error');
                            } finally {
                              setActivatingBankId(null);
                            }
                          }}
                          activeOpacity={0.8}
                          disabled={!!activatingBankId}
                        >
                          <View style={[styles.bankCardAccent, { backgroundColor: isSelected ? '#1E3A8A' : '#E2E8F0' }]} />
                          <View style={{ flex: 1, padding: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Text style={[styles.bankName, isSelected && { color: '#1E3A8A' }]}>{account.bankName}</Text>
                              {isSelected && <View style={styles.selectedBadge}><Check size={11} color="#FFFFFF" /><Text style={styles.selectedBadgeText}>Active</Text></View>}
                            </View>
                            <Text style={styles.bankDetail}>{account.accountName}</Text>
                            <Text style={styles.bankDetail}>···· ···· {account.accountNumber?.slice(-4)}</Text>
                            <Text style={[styles.bankDetail, { color: '#94A3B8' }]}>IFSC: {account.ifscCode}</Text>
                          </View>
                          <View style={styles.bankActions}>
                            {activatingBankId === account.id ? (
                              <ActivityIndicator size="small" color="#1E3A8A" style={{ padding: 6 }} />
                            ) : (
                              <>
                                <TouchableOpacity style={styles.bankActionBtn} onPress={() => openEditBank(account)} activeOpacity={0.7}>
                                  <Edit3 size={15} color="#64748B" />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.bankActionBtn, { marginTop: 8 }]} onPress={() => handleDeleteBank(account)} disabled={isDeleting} activeOpacity={0.7}>
                                  {isDeleting ? <ActivityIndicator size="small" color="#DC2626" /> : <Trash2 size={15} color="#DC2626" />}
                                </TouchableOpacity>
                              </>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <><Save size={18} color="#FFFFFF" style={{ marginRight: 8 }} /><Text style={styles.saveBtnText}>{t('settings.saveSettings', 'Save Settings')}</Text></>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bank Account Modal */}
      <Modal visible={bankModalVisible} transparent animationType="slide" onRequestClose={() => setBankModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingBank ? 'Edit Bank Account' : 'Add Bank Account'}</Text>
              <TouchableOpacity onPress={() => setBankModalVisible(false)} style={styles.modalCloseBtn} activeOpacity={0.7}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {[
              { label: 'Account Holder Name', key: 'accountName', placeholder: 'John Doe' },
              { label: 'Bank Name', key: 'bankName', placeholder: 'HDFC Bank' },
              { label: 'Account Number', key: 'accountNumber', placeholder: '501002345678', keyboardType: 'numeric' },
              { label: 'IFSC Code', key: 'ifscCode', placeholder: 'HDFC0001234', autoCapitalize: 'characters' },
            ].map(field => (
              <View key={field.key} style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>{field.label}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={bankForm[field.key]}
                  onChangeText={val => setBankForm(prev => ({ ...prev, [field.key]: field.autoCapitalize === 'characters' ? val.toUpperCase() : val }))}
                  placeholder={field.placeholder}
                  placeholderTextColor={COLORS.textPlaceholder}
                  keyboardType={field.keyboardType || 'default'}
                  autoCapitalize={field.autoCapitalize || 'words'}
                />
              </View>
            ))}

            <TouchableOpacity style={[styles.saveBtn, { marginTop: 8 }, savingBank && styles.saveBtnDisabled]} onPress={handleSaveBank} disabled={savingBank} activeOpacity={0.85}>
              {savingBank ? <ActivityIndicator size="small" color="#FFFFFF" /> : <><Check size={18} color="#FFFFFF" style={{ marginRight: 8 }} /><Text style={styles.saveBtnText}>{editingBank ? 'Update Account' : 'Save Account'}</Text></>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontFamily: 'Rubik-SemiBold', color: COLORS.textSecondary, marginTop: 8 },
  scrollContent: { padding: 16, paddingBottom: 50 },
  counterBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 14, gap: 12, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2, shadowColor: '#1E3A8A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  counterIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  counterTitle: { fontSize: 11, fontFamily: 'Rubik-SemiBold', color: '#64748B' },
  counterValue: { fontSize: 13, fontFamily: 'Rubik-Bold', color: '#0F172A', marginTop: 2 },
  counterBadge: { backgroundColor: '#1E3A8A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  counterBadgeText: { color: '#FFFFFF', fontFamily: 'Rubik-Bold', fontSize: 13 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', elevation: 3, shadowColor: '#1E3A8A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  iconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontFamily: 'Rubik-Bold', color: '#0F172A' },
  cardSubtitle: { fontSize: 11, fontFamily: 'Rubik-SemiBold', color: '#94A3B8', marginTop: 1 },
  fieldLabel: { fontSize: 11.5, fontFamily: 'Rubik-Bold', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  prefixRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  prefixInput: { borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 20, fontFamily: 'Rubik-Bold', color: '#1E3A8A', letterSpacing: 3, backgroundColor: '#F8FAFC' },
  inputHint: { fontSize: 10.5, fontFamily: 'Rubik-Regular', color: '#94A3B8', marginTop: 5 },
  previewBox: { width: 120, backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1.5, borderColor: '#BFDBFE', padding: 10, alignItems: 'center' },
  previewLabel: { fontSize: 9.5, fontFamily: 'Rubik-Bold', color: '#3B82F6', textTransform: 'uppercase', letterSpacing: 0.6 },
  previewValue: { fontSize: 13, fontFamily: 'Rubik-Bold', color: '#1E40AF', letterSpacing: 0.8, marginTop: 4, textAlign: 'center' },
  previewNote: { fontSize: 9, fontFamily: 'Rubik-SemiBold', color: '#94A3B8', marginTop: 4 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 14, backgroundColor: '#EFF6FF', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#BFDBFE' },
  infoText: { fontSize: 11, fontFamily: 'Rubik-SemiBold', color: '#1E40AF', flex: 1, lineHeight: 16 },
  termsInput: { borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 10, padding: 12, fontSize: 13, fontFamily: 'Rubik-SemiBold', color: '#0F172A', minHeight: 110, backgroundColor: '#F8FAFC', lineHeight: 20 },
  termsFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 4 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5' },
  clearBtnText: { fontSize: 12, fontFamily: 'Rubik-Bold', color: '#DC2626' },
  termsPreview: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#BFDBFE', marginTop: 12 },
  termsPreviewAccent: { width: 4, backgroundColor: '#1E3A8A' },
  termsPreviewLabel: { fontSize: 8.5, fontFamily: 'Rubik-Bold', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 },
  termsPreviewText: { fontSize: 10.5, color: '#334155', fontFamily: 'Rubik-SemiBold', lineHeight: 15 },
  // Payment mode
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  modeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#F8FAFC', minWidth: '45%', flex: 1 },
  modeChipText: { fontSize: 12.5, fontFamily: 'Rubik-SemiBold', color: '#94A3B8' },
  paymentPanel: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  // UPI
  upiInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#F8FAFC' },
  // QR
  qrUploadBtn: { borderWidth: 2, borderColor: '#99F6E4', borderStyle: 'dashed', borderRadius: 12, padding: 24, alignItems: 'center', gap: 8, backgroundColor: '#F0FDFA' },
  qrUploadText: { fontSize: 14, fontFamily: 'Rubik-Bold', color: '#0D9488' },
  qrUploadHint: { fontSize: 11, fontFamily: 'Rubik-Regular', color: '#94A3B8' },
  qrPreviewWrap: { alignItems: 'center', gap: 12 },
  qrPreviewImage: { width: 180, height: 180, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  qrChangeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: '#99F6E4', backgroundColor: '#F0FDFA' },
  qrChangeBtnText: { fontSize: 13, fontFamily: 'Rubik-Bold', color: '#0D9488' },
  // Bank accounts
  bankPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addBankBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  addBankBtnText: { fontSize: 12, fontFamily: 'Rubik-Bold', color: '#1E3A8A' },
  emptyBankBox: { alignItems: 'center', padding: 24, gap: 6, backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' },
  emptyBankText: { fontSize: 13, fontFamily: 'Rubik-Bold', color: '#94A3B8' },
  emptyBankHint: { fontSize: 11, fontFamily: 'Rubik-Regular', color: '#CBD5E1' },
  bankCard: { flexDirection: 'row', borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0', marginBottom: 10, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  bankCardSelected: { borderColor: '#1E3A8A', backgroundColor: '#F8FAFC' },
  bankCardAccent: { width: 4 },
  bankName: { fontSize: 13, fontFamily: 'Rubik-Bold', color: '#0F172A' },
  bankDetail: { fontSize: 11.5, fontFamily: 'Rubik-SemiBold', color: '#64748B', marginTop: 2 },
  bankActions: { padding: 12, justifyContent: 'center' },
  bankActionBtn: { padding: 6 },
  selectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#1E3A8A', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  selectedBadgeText: { fontSize: 9.5, fontFamily: 'Rubik-Bold', color: '#FFFFFF' },
  // Save
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E3A8A', borderRadius: 14, paddingVertical: 15, marginTop: 22, elevation: 5, shadowColor: '#1E3A8A', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.35, shadowRadius: 10 },
  saveBtnDisabled: { opacity: 0.65 },
  saveBtnText: { fontSize: 15, fontFamily: 'Rubik-Bold', color: '#FFFFFF' },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 17, fontFamily: 'Rubik-Bold', color: '#0F172A' },
  modalCloseBtn: { padding: 6 },
  modalField: { marginBottom: 14 },
  modalFieldLabel: { fontSize: 11.5, fontFamily: 'Rubik-Bold', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  modalInput: { borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, fontFamily: 'Rubik-SemiBold', color: '#0F172A', backgroundColor: '#F8FAFC' },
});

export default InvoiceSettingsScreen;
