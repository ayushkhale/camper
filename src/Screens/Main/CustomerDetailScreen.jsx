import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Phone,
  MapPin,
  Route,
  IndianRupee,
  Clock,
  Package,
  Repeat,
  Play,
  Pause,
  Plus,
  ChevronRight,
  FileText,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { useAlert } from '../../context/AlertContext';
import CurvedHeader from '../../components/CurvedHeader';

const CustomerDetailScreen = () => {
  const navigation = useNavigation();
  const routeParams = useRoute();
  const { userToken } = useContext(AuthContext);
  const customerId = routeParams.params?.customerId;
  const { t } = useTranslation();
  const { showAlert } = useAlert();

  const [customerData, setCustomerData] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [error, setError] = useState(null);

  // Deposit States
  const [depositData, setDepositData] = useState(null);
  const [loadingDeposit, setLoadingDeposit] = useState(true);
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectContainers, setCollectContainers] = useState('1');
  const [collectNotes, setCollectNotes] = useState('');
  const [submittingDeposit, setSubmittingDeposit] = useState(false);

  const fetchCustomerDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCustomer(userToken, customerId);
      if (res.success) {
        setCustomerData(res.data);
      } else {
        throw new Error(res.message || 'Customer not found');
      }
    } catch (err) {
      console.error('Error fetching customer details:', err);
      setError(err.message || 'Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    setLoadingSubs(true);
    try {
      const res = await api.listSubscriptions(userToken, customerId);
      if (res.success) {
        setSubscriptions(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching customer subscriptions:', err);
    } finally {
      setLoadingSubs(false);
    }
  };

  const fetchDepositData = async () => {
    setLoadingDeposit(true);
    try {
      const res = await api.getDepositLedger(userToken, customerId);
      if (res && res.success) {
        setDepositData(res.data || null);
      }
    } catch (err) {
      console.error('Error fetching customer deposit data:', err);
    } finally {
      setLoadingDeposit(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (customerId) {
        fetchCustomerDetail();
        fetchSubscriptions();
        fetchDepositData();
      }
    }, [customerId])
  );

  const handleDeleteCustomer = () => {
    showAlert(
      t('customers.deleteCustomer'),
      t('customers.deleteConfirm'),
      [
        { text: t('staff.cancel'), style: 'cancel' },
        {
          text: t('staff.deleteBtn'),
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.deleteCustomer(userToken, customerId);
              if (res.success) {
                showAlert('Success', t('customers.deleteSuccess'), 'success');
                navigation.goBack();
              } else {
                throw new Error(res.message || 'Failed to delete customer');
              }
            } catch (err) {
              showAlert('Error', err.message || t('customers.deleteError'), 'error');
            }
          },
        },
      ]
    );
  };

  const toggleSubscriptionStatus = async (sub) => {
    const newStatus = sub.status === 'active' ? 'paused' : 'active';
    try {
      const res = await api.updateSubscription(userToken, sub.id, { status: newStatus });
      if (res.success) {
        showAlert('Success', `Subscription ${newStatus === 'active' ? 'activated' : 'paused'} successfully`, 'success');
        fetchSubscriptions();
      }
    } catch (err) {
      showAlert('Error', 'Failed to update subscription status', 'error');
    }
  };

  const handleDeleteSubscription = (sub) => {
    showAlert(
      'Delete Subscription',
      'Are you sure you want to delete this subscription?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.deleteSubscription(userToken, sub.id);
              if (res.success) {
                showAlert('Success', 'Subscription deleted successfully', 'success');
                fetchSubscriptions();
              }
            } catch (err) {
              showAlert('Error', 'Could not delete subscription', 'error');
            }
          },
        },
      ]
    );
  };

  const formatRecurrence = (pattern) => {
    switch (pattern) {
      case 'daily': return 'Daily';
      case 'alternate_days': return 'Alternate Days';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return pattern;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading customer details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !customerData) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Customer not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Get Avatar Initials
  const getInitials = (name) => {
    if (!name) return 'C';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <CurvedHeader
        title={<Text style={{ color: '#FFF', fontSize: 20, fontFamily: 'Geologica-Bold' }}>Customer Detail</Text>}
        leftIcon={<ArrowLeft size={24} color="#FFF" />}
        onLeftPress={() => navigation.goBack()}
        rightIcon={
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={styles.headerActionBtnDark}
              onPress={() => navigation.navigate('AddCustomer', { customer: customerData })}
            >
              <Edit size={18} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerActionBtnDark, { backgroundColor: 'rgba(239,68,68,0.2)' }]}
              onPress={handleDeleteCustomer}
            >
              <Trash2 size={18} color="#FECACA" />
            </TouchableOpacity>
          </View>
        }
        height={120}
        contentStyle={{ paddingTop: 10, paddingBottom: 25 }}
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.scrollContent, { paddingTop: 32 }]} showsVerticalScrollIndicator={false}>

        {/* Profile Hero Section */}
        <View style={styles.profileHero}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('../../../assets/customerfallback.png')}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.customerName}>{customerData.name}</Text>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: customerData.status === 'active' ? '#16A34A' : '#94A3B8' }]} />
            <Text style={[styles.statusText, { color: customerData.status === 'active' ? '#15803D' : '#64748B' }]}>
              {customerData.status.toUpperCase()}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
            onPress={() => navigation.navigate('CustomerHistory', { customerId: customerData.id })}
            activeOpacity={0.7}
          >
            <Clock size={16} color="#3B82F6" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 13, fontFamily: 'Geologica-Medium', color: '#1D4ED8' }}>View History</Text>
          </TouchableOpacity>
        </View>

        {/* Subscriptions */}
        <Text style={styles.sectionTitle}>{t('customers.activeSubscriptions')}</Text>

        {loadingSubs ? (
          <View style={[styles.detailsCard, { padding: 30, alignItems: 'center' }]}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : subscriptions.length === 0 ? (
          <TouchableOpacity
            style={styles.subscriptionToggle}
            onPress={() => navigation.navigate('AddSubscription', { customerId: customerData.id })}
            activeOpacity={0.7}
          >
            <View style={styles.subscriptionToggleLeft}>
              <View style={styles.subToggleIcon}>
                <Plus size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.subToggleTitle}>{t('customers.addSubscription')}</Text>
                <Text style={styles.subToggleSubtitle}>{t('customers.addSubDesc')}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : (
          subscriptions.map((sub) => {
            const statusColor = sub.status === 'active'
              ? { dot: '#16A34A', text: '#15803D' }
              : sub.status === 'paused'
                ? { dot: '#D97706', text: '#B45309' }
                : { dot: '#94A3B8', text: '#64748B' };

            return (
              <TouchableOpacity
                key={sub.id}
                style={styles.subscriptionCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('SubscriptionDetail', { subscriptionId: sub.id, subscription: sub })}
              >
                <View style={styles.subLeft}>
                  <View style={styles.subIconWrap}>
                    <Package size={22} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subTitle} numberOfLines={1}>
                      {sub.Product?.name || 'Unknown Product'}
                    </Text>
                    <Text style={styles.subMetaText} numberOfLines={1}>
                      Qty: {sub.baseQuantity} • {formatRecurrence(sub.recurrencePattern)}
                    </Text>
                  </View>
                </View>

                <View style={styles.statusBadge}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor.dot }]} />
                  <Text style={[styles.statusText, { color: statusColor.text }]}>
                    {sub.status.toUpperCase()}
                  </Text>
                </View>
                <ChevronRight size={18} color={COLORS.textPlaceholder} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            );
          })
        )}

        {/* Contact Details */}
        <Text style={styles.sectionTitle}>{t('customers.contactAndLocation')}</Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={[styles.detailIconBox, { backgroundColor: COLORS.primaryLight, borderColor: COLORS.border }]}>
              <Phone size={18} color={COLORS.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('customers.phone_label')}</Text>
              <Text style={styles.detailValue}>{customerData.phone || 'Not Provided'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={[styles.detailIconBox, { backgroundColor: COLORS.primaryLight, borderColor: COLORS.border }]}>
              <MapPin size={18} color={COLORS.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('customers.address_label')}</Text>
              <Text style={styles.detailValue}>{customerData.address || 'Not Provided'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={[styles.detailIconBox, { backgroundColor: COLORS.primaryLight, borderColor: COLORS.border }]}>
              <Route size={18} color={COLORS.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('customers.assignedRoute')}</Text>
              <Text style={styles.detailValue}>{customerData.Route ? customerData.Route.name : t('customers.noRouteAssigned')}</Text>
            </View>
          </View>
        </View>

        {/* Account Details */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>{t('customers.accountOverview')}</Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={[styles.detailIconBox, { backgroundColor: COLORS.primaryLight, borderColor: COLORS.border }]}>
              <IndianRupee size={18} color={COLORS.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Opening Balance</Text>
              <Text style={styles.detailValue}>{customerData.openingBalance || customerData.creditLimit ? `₹${customerData.openingBalance || customerData.creditLimit}` : '₹0'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={[styles.detailIconBox, { backgroundColor: COLORS.primaryLight, borderColor: COLORS.border }]}>
              <Clock size={18} color={COLORS.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('customers.customerSince')}</Text>
              <Text style={styles.detailValue}>
                {new Date(customerData.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Security Deposit Section */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Security Deposit</Text>

        {loadingDeposit ? (
          <View style={[styles.detailsCard, { padding: 20, alignItems: 'center' }]}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : !depositData || (parseFloat(depositData.depositBalance || 0) === 0 && parseInt(depositData.containersHeld || 0) === 0) ? (
          <TouchableOpacity
            style={styles.subscriptionToggle}
            onPress={() => setDepositModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.subscriptionToggleLeft}>
              <View style={styles.subToggleIcon}>
                <Plus size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.subToggleTitle}>Add Security Deposit</Text>
                <Text style={styles.subToggleSubtitle}>Collect container/jar deposit for this customer</Text>
              </View>
            </View>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={[styles.detailIconBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                <ShieldCheck size={18} color="#16A34A" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Deposit Balance</Text>
                <Text style={[styles.detailValue, { color: '#16A34A', fontFamily: 'Geologica-Bold' }]}>
                  ₹{depositData.depositBalance || 0}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addMoreDepositBtn}
                onPress={() => setDepositModalVisible(true)}
                activeOpacity={0.7}
              >
                <Plus size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                <Text style={styles.addMoreDepositText}>Add More</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={[styles.detailIconBox, { backgroundColor: COLORS.primaryLight, borderColor: COLORS.border }]}>
                <Package size={18} color={COLORS.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Containers/Jars Held</Text>
                <Text style={styles.detailValue}>{depositData.containersHeld || 0} Jar(s)</Text>
              </View>
            </View>
          </View>
        )}



      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fabSecondary}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('MainDrawer', {
            screen: 'MainTabs',
            params: {
              screen: 'Payments',
              params: { preselectedCustomer: customerData }
            }
          })}
        >
          <IndianRupee size={24} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fabPrimary}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('GenerateInvoice', { customerId: customerData.id })}
        >
          <FileText size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Collect Deposit Modal */}
      <Modal
        visible={depositModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDepositModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Collect Security Deposit</Text>
              <TouchableOpacity onPress={() => setDepositModalVisible(false)}>
                <X size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Deposit Amount (₹) *</Text>
              <View style={styles.modalInputContainer}>
                <IndianRupee size={18} color={COLORS.textPlaceholder} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 300"
                  value={collectAmount}
                  onChangeText={(val) => setCollectAmount(val.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                  placeholderTextColor={COLORS.textPlaceholder}
                />
              </View>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Containers/Jars Deposited</Text>
              <View style={styles.modalInputContainer}>
                <Package size={18} color={COLORS.textPlaceholder} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 3"
                  value={collectContainers}
                  onChangeText={(val) => setCollectContainers(val.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  placeholderTextColor={COLORS.textPlaceholder}
                />
              </View>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Notes (Optional)</Text>
              <View style={styles.modalInputContainer}>
                <FileText size={18} color={COLORS.textPlaceholder} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Deposit collected at customer detail"
                  value={collectNotes}
                  onChangeText={setCollectNotes}
                  placeholderTextColor={COLORS.textPlaceholder}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalSubmitBtn, submittingDeposit && { opacity: 0.7 }]}
              onPress={async () => {
                if (!collectAmount || parseFloat(collectAmount) <= 0) {
                  showAlert('Invalid Amount', 'Please enter a valid deposit amount', 'warning');
                  return;
                }
                setSubmittingDeposit(true);
                try {
                  const res = await api.collectDeposit(userToken, {
                    customerId: customerData.id,
                    amount: parseFloat(collectAmount),
                    containerCount: parseInt(collectContainers) || 1,
                    notes: collectNotes.trim() || 'Deposit collected from customer details screen',
                  });
                  if (res && res.success) {
                    showAlert('Success', 'Security deposit collected successfully!', 'success');
                    setDepositModalVisible(false);
                    setCollectAmount('');
                    setCollectContainers('1');
                    setCollectNotes('');
                    fetchDepositData();
                  } else {
                    showAlert('Error', res.message || 'Failed to collect deposit', 'error');
                  }
                } catch (err) {
                  showAlert('Error', err.message || 'Something went wrong', 'error');
                } finally {
                  setSubmittingDeposit(false);
                }
              }}
              disabled={submittingDeposit}
              activeOpacity={0.8}
            >
              {submittingDeposit ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Collect Deposit</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionBtnDark: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 10,
    borderRadius: 14,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  profileHero: {
    alignItems: 'center',
    marginBottom: 36,
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  customerName: {
    fontSize: 20,
    fontFamily: 'Geologica-SemiBold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Geologica-SemiBold',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Geologica-SemiBold',
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  sectionHeaderFlex: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitleFlex: {
    fontSize: 14,
    fontFamily: 'Geologica-SemiBold',
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  addBtnSmall: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  detailsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Geologica-SemiBold',
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  subscriptionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  subLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  subTitle: {
    fontSize: 14,
    fontFamily: 'Geologica-SemiBold',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  subMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subMetaText: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textPlaceholder,
    marginHorizontal: 8,
  },
  subActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  subActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  subActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPlaceholder,
  },
  errorText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.danger,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: 'Geologica-SemiBold',
    fontSize: 14,
  },
  subscriptionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    marginTop: 0,
  },
  subscriptionToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subToggleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  subToggleTitle: {
    fontSize: 14,
    fontFamily: 'Geologica-SemiBold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  subToggleSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Geologica-Medium',
  },
  fabContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 50,
    right: 24,
    alignItems: 'flex-end',
    gap: 12,
  },
  fabPrimary: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  fabSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  addMoreDepositBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addMoreDepositText: {
    fontSize: 12,
    fontFamily: 'Geologica-Bold',
    color: COLORS.primary,
  },

  // Deposit Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 100 : 110,
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
  modalInputGroup: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  modalInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPrimary,
    padding: 0,
  },
  modalSubmitBtn: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  modalSubmitBtnText: {
    fontSize: 15,
    fontFamily: 'Geologica-Bold',
    color: '#FFFFFF',
  },
});

export default CustomerDetailScreen;
