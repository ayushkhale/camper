import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  TextInput, FlatList, ActivityIndicator, Alert, Modal, ScrollView, Animated
} from 'react-native';
import { 
  CreditCard, User, FileText, CheckCircle, ChevronDown, 
  X, Search, DollarSign
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useRoute, useFocusEffect } from '@react-navigation/native';

const PAYMENT_MODES = [
  { id: 'cash', label: 'Cash' },
  { id: 'upi', label: 'UPI' },
  { id: 'bank_transfer', label: 'Bank Transfer' },
  { id: 'cheque', label: 'Cheque' }
];

const PaymentsScreen = () => {
  const { t } = useTranslation();
  const { userToken } = useContext(AuthContext);
  const route = useRoute();

  const [activeTab, setActiveTab] = useState('record'); // 'record' | 'statement'
  
  // Customer Selection State
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);

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
    <View style={{ flex: 1, padding: 16, gap: 16 }}>
      <Animated.View style={[styles.skeletonSummaryCard, { opacity: pulseAnim }]}>
        <View style={[styles.skeletonBar, { width: 140, height: 16, backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: 16 }]} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={[styles.skeletonBar, { width: 90, height: 28, backgroundColor: 'rgba(255,255,255,0.3)' }]} />
          <View style={[styles.skeletonBar, { width: 90, height: 28, backgroundColor: 'rgba(255,255,255,0.3)' }]} />
        </View>
      </Animated.View>

      <View style={{ gap: 12, marginTop: 8 }}>
        {[1, 2, 3, 4].map((key) => (
          <Animated.View key={key} style={[styles.skeletonTxItem, { opacity: pulseAnim }]}>
            <View style={{ flex: 1 }}>
              <View style={[styles.skeletonBar, { width: 80, height: 12, marginBottom: 8 }]} />
              <View style={[styles.skeletonBar, { width: '70%', height: 14, marginBottom: 6 }]} />
              <View style={[styles.skeletonBar, { width: 50, height: 16, borderRadius: 6 }]} />
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={[styles.skeletonBar, { width: 70, height: 18, marginBottom: 6 }]} />
              <View style={[styles.skeletonBar, { width: 80, height: 12 }]} />
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
    }
  }, [route.params?.preselectedCustomer]);

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
      Alert.alert('Error', 'Could not fetch account statement');
    } finally {
      setLoadingStatement(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedCustomer) {
      Alert.alert('Required', 'Please select a customer first');
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      Alert.alert('Required', 'Please enter a valid amount');
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
        Alert.alert('Success', 'Payment recorded successfully!');
        setAmount('');
        setReferenceNote('');
        if (activeTab === 'statement') {
          fetchStatement(selectedCustomer.id); // Refresh if somehow on statement tab
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to record payment');
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
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Customer</Text>
            <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
              <X size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.searchInputWrapper}>
            <Search size={18} color={COLORS.textPlaceholder} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search customer by name or phone"
              value={customerSearch}
              onChangeText={handleCustomerSearch}
              placeholderTextColor={COLORS.textPlaceholder}
            />
          </View>
          {loadingCustomers ? (
            renderCustomerSkeleton()
          ) : (
            <FlatList
              data={filteredCustomers}
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
          )}
        </View>
      </View>
    </Modal>
  );

  const renderRecordPayment = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholderTextColor={COLORS.textPlaceholder}
        />

        <Text style={styles.label}>Payment Mode</Text>
        <View style={styles.chipsContainer}>
          {PAYMENT_MODES.map(mode => (
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

        <Text style={styles.label}>Reference Note (Optional)</Text>
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
            <Text style={styles.primaryBtnText}>Record Payment</Text>
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
          <Text style={styles.emptyTitle}>Select a Customer</Text>
          <Text style={styles.emptySubtitle}>Please select a customer to view their statement.</Text>
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
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Account Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Total Charged</Text>
              <Text style={[styles.summaryVal, { color: '#FFF' }]}>{formatCurrency(summary.totalCharged)}</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Total Paid</Text>
              <Text style={[styles.summaryVal, { color: '#E2E8F0' }]}>{formatCurrency(summary.totalPaid)}</Text>
            </View>
          </View>
          <View style={[styles.summaryRow, { marginTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 16 }]}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>{owesMoney ? 'Amount Due' : 'Balance'}</Text>
              <Text style={[styles.summaryValLarge, { color: owesMoney ? '#FECACA' : '#86EFAC' }]}>
                {formatCurrency(summary.outstandingBalance)}
              </Text>
            </View>
          </View>
        </View>

        <FlatList
          data={statement}
          keyExtractor={item => item.id || Math.random().toString()}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<Text style={styles.statementListTitle}>Transactions</Text>}
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
              <Text style={{ color: COLORS.textPlaceholder }}>No transactions found.</Text>
            </View>
          }
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payments & Ledger</Text>
      </View>

      {/* Customer Selector */}
      <TouchableOpacity 
        style={styles.customerSelector} 
        onPress={() => setShowCustomerModal(true)}
      >
        <View style={styles.customerSelectorLeft}>
          <User size={20} color={selectedCustomer ? COLORS.primary : COLORS.textPlaceholder} style={{ marginRight: 10 }} />
          <View>
            <Text style={styles.customerSelectorLabel}>Customer</Text>
            <Text style={[styles.customerSelectorValue, !selectedCustomer && { color: COLORS.textPlaceholder }]}>
              {selectedCustomer ? selectedCustomer.name : 'Select a customer'}
            </Text>
          </View>
        </View>
        <ChevronDown size={20} color={COLORS.textPlaceholder} />
      </TouchableOpacity>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'record' && styles.tabBtnActive]}
          onPress={() => handleTabSwitch('record')}
        >
          <DollarSign size={16} color={activeTab === 'record' ? COLORS.primary : COLORS.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.tabText, activeTab === 'record' && styles.tabTextActive]}>Record Payment</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'statement' && styles.tabBtnActive]}
          onPress={() => handleTabSwitch('statement')}
        >
          <FileText size={16} color={activeTab === 'statement' ? COLORS.primary : COLORS.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.tabText, activeTab === 'statement' && styles.tabTextActive]}>Statement</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {activeTab === 'record' ? renderRecordPayment() : renderStatement()}
      </View>

      {renderCustomerModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },
  customerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  customerSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerSelectorLabel: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  customerSelectorValue: {
    fontSize: 15,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    fontFamily: 'Geologica-Bold',
    color: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
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
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontFamily: 'Geologica-Medium',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
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
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  summaryVal: {
    fontSize: 18,
    fontFamily: 'Geologica-Bold',
  },
  summaryValLarge: {
    fontSize: 28,
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
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    height: 140,
  },
  skeletonTxItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
