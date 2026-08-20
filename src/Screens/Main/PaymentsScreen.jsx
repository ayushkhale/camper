import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, FlatList, SectionList, ActivityIndicator, Alert, Modal, ScrollView, Animated, Platform, Image, TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, ChevronDown, DollarSign, FileText, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, X, Search, Menu, Info, Banknote } from 'lucide-react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import { COLORS } from '../../constants/colors';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useNavigation, useFocusEffect, DrawerActions, useRoute } from '@react-navigation/native';
import { useAlert } from '../../context/AlertContext';
import CurvedHeader from '../../components/CurvedHeader';
import AddCustomerModal from '../../components/modals/AddCustomerModal';

const getPaymentModes = (t) => [
  { id: 'cash', label: t('payments.cash') },
  { id: 'upi', label: t('payments.upi') },
  { id: 'bank_transfer', label: t('payments.bankTransfer') },
  { id: 'cheque', label: t('payments.cheque') }
];

const PaymentsScreen = () => {
  const { t } = useTranslation();
  const { userToken, user } = useContext(AuthContext);
  const route = useRoute();
  const navigation = useNavigation();
  const { showAlert } = useAlert();

  const vendorLogo = user?.logoUrl || user?.imageUrl;

  const [activeTab, setActiveTab] = useState(user?.role === 'staff' ? 'statement' : 'record'); // 'record' | 'statement'

  // Customer Selection State
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [addCustomerVisible, setAddCustomerVisible] = useState(false);

  // Record Payment State
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [referenceNote, setReferenceNote] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Statement State
  const [statementData, setStatementData] = useState(null);
  const [loadingStatement, setLoadingStatement] = useState(false);

  const pulseAnim = React.useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (loadingStatement || loadingCustomers) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.75,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.35,
            duration: 750,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [loadingStatement, loadingCustomers]);

  const renderStatementSkeleton = () => (
    <View style={{ flex: 1, padding: 16 }}>
      <Animated.View style={[styles.skeletonSummaryCard, { opacity: pulseAnim, padding: 16, borderRadius: 16, marginBottom: 16 }]}>
        <View style={[styles.skeletonBar, { width: 100, height: 12, backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: 8 }]} />
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={[styles.skeletonBar, { width: 140, height: 28, backgroundColor: 'rgba(255,255,255,0.4)' }]} />
          <View style={[styles.skeletonBar, { width: 60, height: 20, backgroundColor: 'rgba(255,255,255,0.2)', marginLeft: 12, borderRadius: 6 }]} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.08)', padding: 12, borderRadius: 10 }}>
          <View style={{ flex: 1 }}>
            <View style={[styles.skeletonBar, { width: 70, height: 10, backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: 6 }]} />
            <View style={[styles.skeletonBar, { width: 90, height: 16, backgroundColor: 'rgba(255,255,255,0.4)' }]} />
          </View>
          <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 12 }} />
          <View style={{ flex: 1 }}>
            <View style={[styles.skeletonBar, { width: 70, height: 10, backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: 6 }]} />
            <View style={[styles.skeletonBar, { width: 90, height: 16, backgroundColor: 'rgba(255,255,255,0.4)' }]} />
          </View>
        </View>
      </Animated.View>

      <View style={{ marginTop: 8, gap: 16 }}>
        <View style={[styles.skeletonBar, { width: 120, height: 20, marginBottom: 8 }]} />
        {[1, 2, 3, 4].map((key) => (
          <Animated.View key={key} style={[styles.skeletonTxItem, { opacity: pulseAnim }]}>
            <View style={{ flex: 1 }}>
              <View style={[styles.skeletonBar, { width: '80%', height: 16, marginBottom: 8 }]} />
              <View style={[styles.skeletonBar, { width: '40%', height: 12 }]} />
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={[styles.skeletonBar, { width: 60, height: 18, marginBottom: 8 }]} />
              <View style={[styles.skeletonBar, { width: 70, height: 12 }]} />
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );

  const renderCustomerSkeleton = () => (
    <View style={{ paddingVertical: 12, gap: 12 }}>
      {[1, 2, 3, 4, 5].map((key) => (
        <Animated.View key={key} style={[styles.skeletonCustomerRow, { opacity: pulseAnim }]}>
          <View style={styles.skeletonAvatarCircle} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={[styles.skeletonBar, { width: '60%', height: 16, marginBottom: 6 }]} />
            <View style={[styles.skeletonBar, { width: '40%', height: 12 }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );

  useEffect(() => {
    fetchCustomers();
  }, [userToken]);

  useFocusEffect(
    React.useCallback(() => {
      // Fetch fresh customers on focus
      fetchCustomers();
      // If we are on the statement tab and have a customer, fetch latest statement
      if (activeTab === 'statement' && selectedCustomer) {
        fetchStatement(selectedCustomer.id);
      }
    }, [userToken, activeTab, selectedCustomer])
  );

  useEffect(() => {
    if (route.params?.preselectedCustomer) {
      selectCustomer(route.params.preselectedCustomer);
      navigation.setParams({ preselectedCustomer: undefined });
    }
  }, [route.params?.preselectedCustomer]);

  // Handle route params from InvoiceDetailScreen
  useEffect(() => {
    if (customers.length > 0 && route.params?.customerId) {
      const foundCustomer = customers.find(c => c.id === route.params.customerId || c.id === Number(route.params.customerId) || String(c.id) === String(route.params.customerId));
      if (foundCustomer && (!selectedCustomer || selectedCustomer.id !== foundCustomer.id)) {
        selectCustomer(foundCustomer);
        navigation.setParams({ customerId: undefined });
      }
    }
  }, [route.params?.customerId, customers]);

  useEffect(() => {
    if (route.params?.prefillAmount) {
      setAmount(String(route.params.prefillAmount));
    }
  }, [route.params?.prefillAmount]);

  const fetchCustomers = async () => {
    if (!userToken) return;
    setLoadingCustomers(true);
    try {
      const res = await api.listCustomers(userToken);
      if (res.success) {
        setCustomers(res.data || []);
        setFilteredCustomers(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching customers', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleCustomerSearch = (text) => {
    setCustomerSearch(text);
    if (!text.trim()) {
      setFilteredCustomers(customers);
      return;
    }
    const lower = text.toLowerCase();
    const filtered = customers.filter(c =>
      (c.name && c.name.toLowerCase().includes(lower)) ||
      (c.phone && c.phone.includes(lower))
    );
    setFilteredCustomers(filtered);
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
    if (activeTab === 'statement') {
      fetchStatement(customer.id);
    }
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    if (tab === 'statement' && selectedCustomer) {
      fetchStatement(selectedCustomer.id);
    }
  };

  const fetchStatement = async (customerId) => {
    setLoadingStatement(true);
    try {
      const res = await api.getAccountStatement(userToken, customerId);
      // The API usually returns { success: true, data: { ... } }
      if (res.success && res.data) {
        setStatementData(res.data);
      } else if (res.customer && res.summary) {
        // Just in case it directly returns the object
        setStatementData(res);
      } else {
        throw new Error('Invalid statement data format');
      }
    } catch (error) {
      console.error('Error fetching statement', error);
      showAlert('Error', 'Could not fetch account statement', 'error');
    } finally {
      setLoadingStatement(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedCustomer) {
      showAlert('Required', 'Please select a customer first', 'warning');
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      showAlert('Required', 'Please enter a valid amount', 'warning');
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await api.recordPayment(userToken, {
        customerId: selectedCustomer.id,
        amount: Number(amount),
        paymentMode,
        referenceNote
      });
      if (res.success) {
        showAlert('Success', 'Payment recorded successfully!', 'success');
        setAmount('');
        setReferenceNote('');
        setActiveTab('statement');
        fetchStatement(selectedCustomer.id);
      }
    } catch (error) {
      showAlert('Error', error.message || 'Failed to record payment', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const formatCurrency = (val) => {
    if (!val) return '₹0.00';
    return `₹${Number(val).toFixed(2)}`;
  };

  const renderCustomerModal = () => (
    <Modal visible={showCustomerModal} animationType="slide" transparent={true}>
      <View style={[styles.modalOverlay, { backgroundColor: 'transparent' }]}>
        <TouchableWithoutFeedback onPress={() => setShowCustomerModal(false)}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
        </TouchableWithoutFeedback>
        <View style={[styles.modalContent, { maxHeight: '80%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('payments.selectCustomerTitle')}</Text>
            <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
              <X size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.searchInputWrapper}>
            <Search size={18} color={COLORS.textPlaceholder} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('payments.searchCustomer')}
              value={customerSearch}
              onChangeText={handleCustomerSearch}
              placeholderTextColor={COLORS.textPlaceholder}
            />
          </View>
          {loadingCustomers ? (
            renderCustomerSkeleton()
          ) : (
            <>
              <TouchableOpacity 
                style={{ backgroundColor: COLORS.primaryLight, padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 12 }}
                onPress={() => { setShowCustomerModal(false); setAddCustomerVisible(true); }}
              >
                <Text style={{ color: COLORS.primary, fontFamily: 'Geologica-Bold', fontSize: 14 }}>{t('common.addNewCustomer')}</Text>
              </TouchableOpacity>
              <FlatList
                data={filteredCustomers}
                keyboardShouldPersistTaps="handled"
                keyExtractor={item => item.id || Math.random().toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.customerListItem}
                    onPress={() => selectCustomer(item)}
                  >
                    <View style={styles.customerListIcon}>
                      <User size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.customerListInfo}>
                      <Text style={styles.customerListName}>{item.name}</Text>
                      <Text style={styles.customerListPhone}>{item.phone || 'No phone'}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderRecordPayment = () => (
    <ScrollView contentContainerStyle={styles.tabContent} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.label}>{t('payments.amount')}</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholderTextColor={COLORS.textPlaceholder}
        />

        <Text style={styles.label}>{t('payments.paymentMode')}</Text>
        <View style={styles.chipsContainer}>
          {getPaymentModes(t).map(mode => (
            <TouchableOpacity
              key={mode.id}
              style={[styles.chip, paymentMode === mode.id && styles.chipActive]}
              onPress={() => setPaymentMode(mode.id)}
            >
              <Text style={[styles.chipText, paymentMode === mode.id && styles.chipTextActive]}>
                {mode.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('payments.referenceNote')}</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. July bill payment via GPay"
          value={referenceNote}
          onChangeText={setReferenceNote}
          placeholderTextColor={COLORS.textPlaceholder}
        />

        <TouchableOpacity
          style={[styles.primaryBtn, (!selectedCustomer || !amount) && styles.primaryBtnDisabled]}
          onPress={handleRecordPayment}
          disabled={submittingPayment || !selectedCustomer || !amount}
        >
          {submittingPayment ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryBtnText}>{t('payments.recordPayment')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderStatement = () => {
    if (!selectedCustomer) {
      return (
        <View style={styles.emptyTabContent}>
          <User size={48} color={COLORS.textPlaceholder} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>{t('payments.selectCustomerTitle')}</Text>
          <Text style={styles.emptySubtitle}>{t('payments.selectCustomerSubtitle')}</Text>
        </View>
      );
    }
    if (loadingStatement) {
      return renderStatementSkeleton();
    }
    if (!statementData) {
      return null;
    }

    const { summary, statement } = statementData;
    const owesMoney = summary.outstandingBalance > 0;

    return (
      <View style={{ flex: 1 }}>
        <FlatList
          data={statement}
          keyExtractor={item => item.id || Math.random().toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              <View style={[styles.summaryCard, { marginHorizontal: 0, paddingVertical: 16, paddingHorizontal: 16, marginBottom: 16, borderRadius: 16 }]}>
                <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: 16 }]}>
                  <Svg height="100%" width="100%" preserveAspectRatio="none">
                    <Defs>
                      <LinearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor="#1E3A8A" />
                        <Stop offset="1" stopColor="#0F172A" />
                      </LinearGradient>
                      <LinearGradient id="circleGrad" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.15" />
                        <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.0" />
                      </LinearGradient>
                    </Defs>
                    <Rect width="100%" height="100%" fill="url(#cardGrad)" />
                    <Circle cx="85%" cy="-15%" r="120" fill="url(#circleGrad)" />
                    <Circle cx="10%" cy="120%" r="80" fill="url(#circleGrad)" />
                  </Svg>
                </View>

                <View style={{ zIndex: 1 }}>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'Geologica-Medium', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                    {owesMoney ? t('payments.totalAmountDue') : t('payments.availableBalance')}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 28, color: '#FFF', fontFamily: 'Geologica-Bold', includeFontPadding: false }}>
                      {formatCurrency(Math.abs(summary.outstandingBalance))}
                    </Text>
                    {owesMoney ? (
                      <View style={{ backgroundColor: 'rgba(239,68,68,0.2)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, marginLeft: 10 }}>
                        <Text style={{ color: '#FCA5A5', fontSize: 10, fontFamily: 'Geologica-Bold' }}>{t('payments.toCollect')}</Text>
                      </View>
                    ) : (
                       <View style={{ backgroundColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, marginLeft: 10 }}>
                        <Text style={{ color: '#6EE7B7', fontSize: 10, fontFamily: 'Geologica-Bold' }}>{t('payments.settled')}</Text>
                      </View>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.08)', padding: 12, borderRadius: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontFamily: 'Geologica-Regular', marginBottom: 2 }}>{t('payments.totalBilled')}</Text>
                      <Text style={{ fontSize: 15, color: '#FFF', fontFamily: 'Geologica-Bold' }}>{formatCurrency(summary.totalCharged)}</Text>
                    </View>
                    <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontFamily: 'Geologica-Regular', marginBottom: 2 }}>{t('payments.totalReceived')}</Text>
                      <Text style={{ fontSize: 15, color: '#4ADE80', fontFamily: 'Geologica-Bold' }}>{formatCurrency(summary.totalPaid)}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <Text style={[styles.statementListTitle, { marginTop: 4, marginBottom: 16 }]}>{t('payments.recentTransactions')}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isCredit = item.credit !== null;
            const amountStr = isCredit ? `+${formatCurrency(item.credit)}` : `-${formatCurrency(item.debit)}`;
            const amountColor = isCredit ? COLORS.success : COLORS.danger;

            return (
              <View style={styles.statementItem}>
                <View style={styles.statementLeft}>
                  <Text style={styles.statementDate}>
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                  <Text style={styles.statementDesc} numberOfLines={2}>{item.description}</Text>
                  {item.paymentMode && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.paymentMode.toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.statementRight}>
                  <Text style={[styles.statementAmount, { color: amountColor }]}>{amountStr}</Text>
                  <Text style={styles.statementBalance}>Bal: {formatCurrency(item.balanceAfter)}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: 30 }}>
              <Text style={{ color: COLORS.textPlaceholder }}>{t('payments.noTransactions')}</Text>
            </View>
          }
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <CurvedHeader
        title={
          <View>
            <Text style={{ color: '#FFF', fontSize: 20, fontFamily: 'Geologica-Bold' }}>{t('payments.title')}</Text>
          </View>
        }
        leftIcon={<Menu size={24} color="#FFF" />}
        onLeftPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
        height={120}
        contentStyle={{ paddingTop: 10, paddingBottom: 25 }}
      />

      <View style={styles.contentWrapper}>
        {/* Customer Selector */}
        <TouchableOpacity
          style={styles.customerSelector}
          onPress={() => setShowCustomerModal(true)}
        >
          <View style={styles.customerSelectorLeft}>
            <User size={20} color={selectedCustomer ? COLORS.primary : COLORS.textPlaceholder} style={{ marginRight: 10 }} />
            <View>
              <Text style={styles.customerSelectorLabel}>{t('customers.title')}</Text>
              <Text style={[styles.customerSelectorValue, !selectedCustomer && { color: COLORS.textPlaceholder }]}>
                {selectedCustomer ? selectedCustomer.name : t('common.selectCustomer')}
              </Text>
            </View>
          </View>
          <ChevronDown size={20} color={COLORS.textPlaceholder} />
        </TouchableOpacity>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {user?.role !== 'staff' && (
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'record' && styles.tabBtnActive]}
              onPress={() => handleTabSwitch('record')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'record' && styles.tabTextActive]}>
                ₹  {t('payments.recordPayment')}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'statement' && styles.tabBtnActive]}
            onPress={() => handleTabSwitch('statement')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'statement' && styles.tabTextActive]}>
              ₹  {t('payments.statement')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {activeTab === 'record' ? renderRecordPayment() : renderStatement()}
        </View>

      </View>

      {renderCustomerModal()}

      <AddCustomerModal 
        visible={addCustomerVisible}
        onClose={() => setAddCustomerVisible(false)}
        onSuccess={(newCustomer) => {
          setAddCustomerVisible(false);
          setCustomers(prev => [...prev, newCustomer]);
          setFilteredCustomers(prev => [...prev, newCustomer]);
          setSelectedCustomer(newCustomer);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 8,
  },
  customerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  customerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatarText: {
    fontSize: 16,
    fontFamily: 'Geologica-Bold',
    color: '#1D4ED8',
  },
  customerSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerSelectorLabel: {
    fontSize: 12,
    fontFamily: 'Geologica-Regular',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  customerSelectorValue: {
    fontSize: 15,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#0B409C',
  },
  tabText: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: '#64748B',
  },
  tabTextActive: {
    fontFamily: 'Geologica-Bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
    paddingBottom: 120,
  },
  emptyTabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Geologica-Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  label: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 15,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    fontFamily: 'Geologica-Bold',
    color: COLORS.primary,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Geologica-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPrimary,
  },
  customerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  customerListIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerListInfo: {
    flex: 1,
  },
  customerListName: {
    fontSize: 15,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  customerListPhone: {
    fontSize: 13,
    fontFamily: 'Geologica-Regular',
    color: COLORS.textSecondary,
  },
  summaryCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  summaryTitle: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: 'Geologica-Medium',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 2,
  },
  summaryVal: {
    fontSize: 16,
    fontFamily: 'Geologica-Bold',
  },
  summaryValLarge: {
    fontSize: 24,
    fontFamily: 'Geologica-Bold',
  },
  statementListTitle: {
    fontSize: 16,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  statementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statementLeft: {
    flex: 1,
    paddingRight: 12,
  },
  statementDate: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statementDesc: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textSecondary,
  },
  statementRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  statementAmount: {
    fontSize: 16,
    fontFamily: 'Geologica-Bold',
    marginBottom: 4,
  },
  statementBalance: {
    fontSize: 11,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
  },
  skeletonSummaryCard: {
    backgroundColor: '#1E3A8A', // Custom dark blue for skeleton to match summaryCard
    borderRadius: 16,
    padding: 20,
    height: 120,
    justifyContent: 'center',
  },
  skeletonTxItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  skeletonCustomerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  skeletonAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  skeletonBar: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
});

export default PaymentsScreen;
