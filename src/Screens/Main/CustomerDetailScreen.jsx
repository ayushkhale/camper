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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  Trash2,
  Edit,
  User,
  Phone,
  MapPin,
  IndianRupee,
  Clock,
  Package,
  Repeat,
  Play,
  Pause,
  Plus,
  ChevronRight
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';

const CustomerDetailScreen = () => {
  const navigation = useNavigation();
  const routeParams = useRoute();
  const { userToken } = useContext(AuthContext);
  const customerId = routeParams.params?.customerId;
  const { t } = useTranslation();

  const [customerData, setCustomerData] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [error, setError] = useState(null);

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

  useFocusEffect(
    React.useCallback(() => {
      if (customerId) {
        fetchCustomerDetail();
        fetchSubscriptions();
      }
    }, [customerId])
  );

  const handleDeleteCustomer = () => {
    Alert.alert(
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
                Alert.alert('Success', t('customers.deleteSuccess'));
                navigation.goBack();
              } else {
                throw new Error(res.message || 'Failed to delete customer');
              }
            } catch (err) {
              Alert.alert('Error', err.message || t('customers.deleteError'));
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
        fetchSubscriptions();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update subscription status');
    }
  };

  const handleDeleteSubscription = (sub) => {
    Alert.alert(
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
                fetchSubscriptions();
              }
            } catch (err) {
              Alert.alert('Error', 'Could not delete subscription');
            }
          },
        },
      ]
    );
  };

  const formatRecurrence = (pattern) => {
    switch(pattern) {
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
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      
      {/* Header Actions */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => navigation.navigate('AddCustomer', { customer: customerData })}
          >
            <Edit size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerActionBtn, { borderColor: '#E2E8F0', backgroundColor: '#FFF5F5' }]}
            onPress={handleDeleteCustomer}
          >
            <Trash2 size={18} color="#E53E3E" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
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
            <View style={styles.detailIconBox}>
              <Phone size={18} color={COLORS.textSecondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('customers.phone_label')}</Text>
              <Text style={styles.detailValue}>{customerData.phone || 'Not Provided'}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <MapPin size={18} color={COLORS.textSecondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('customers.address_label')}</Text>
              <Text style={styles.detailValue}>{customerData.address || 'Not Provided'}</Text>
            </View>
          </View>

          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={[styles.detailIconBox, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
              <MapPin size={18} color={COLORS.primary} />
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
            <View style={styles.detailIconBox}>
              <IndianRupee size={18} color={COLORS.textSecondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('customers.creditLimit_label')}</Text>
              <Text style={styles.detailValue}>{customerData.creditLimit ? `₹${customerData.creditLimit}` : 'None'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Clock size={18} color={COLORS.textSecondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('customers.customerSince')}</Text>
              <Text style={styles.detailValue}>
                {new Date(customerData.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>



      </ScrollView>
    </SafeAreaView>
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
  headerActionBtn: {
    marginLeft: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    borderRadius: 14,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  profileHero: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 36,
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#C7D2FE',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  customerName: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
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
    fontFamily: 'Inter-SemiBold',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
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
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  addBtnSmall: {
    width: 32,
    height: 32,
    backgroundColor: '#EEF2FF',
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
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
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
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  subTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  subMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subMetaText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
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
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  subscriptionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F4FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
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
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  subToggleTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  subToggleSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Medium',
  },
});

export default CustomerDetailScreen;
