import React, { useState, useContext } from 'react';
import {
  View,
  Text,
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
  Plus
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

const CustomerDetailScreen = () => {
  const navigation = useNavigation();
  const routeParams = useRoute();
  const { userToken } = useContext(AuthContext);
  const customerId = routeParams.params?.customerId;

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
      'Delete Customer',
      'Are you sure you want to delete this customer? Historical records will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.deleteCustomer(userToken, customerId);
              if (res.success) {
                Alert.alert('Success', 'Customer deleted successfully');
                navigation.goBack();
              } else {
                throw new Error(res.message || 'Failed to delete customer');
              }
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not delete customer');
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Details</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => navigation.navigate('AddCustomer', { customer: customerData })}
          >
            <Edit size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerActionBtn, { marginLeft: 12 }]}
            onPress={handleDeleteCustomer}
          >
            <Trash2 size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.avatarCircle}>
            <User size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.customerNameText}>{customerData.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: customerData.status === 'active' ? COLORS.primaryLight : COLORS.primaryLight }]}>
            <Text style={[styles.statusText, { color: customerData.status === 'active' ? COLORS.primary : COLORS.primary }]}>
              {customerData.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Contact Details */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Contact & Location</Text>
        </View>
        
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Phone size={16} color={COLORS.textPlaceholder} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>{customerData.phone || 'Not Provided'}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <MapPin size={16} color={COLORS.textPlaceholder} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailValue}>{customerData.address || 'Not Provided'}</Text>
            </View>
          </View>

          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <MapPin size={16} color={COLORS.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Assigned Route</Text>
              <Text style={styles.detailValue}>{customerData.Route ? customerData.Route.name : 'No Route Assigned'}</Text>
            </View>
          </View>
        </View>

        {/* Account Details */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Account Overview</Text>
        </View>
        
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <IndianRupee size={16} color={COLORS.textPlaceholder} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Credit Limit</Text>
              <Text style={styles.detailValue}>{customerData.creditLimit ? `₹${customerData.creditLimit}` : 'None'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Clock size={16} color={COLORS.textPlaceholder} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Created At</Text>
              <Text style={styles.detailValue}>
                {new Date(customerData.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Subscriptions */}
        <View style={[styles.sectionHeader, { marginTop: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <Text style={styles.sectionTitle}>Active Subscriptions</Text>
          <TouchableOpacity 
            style={styles.addBtnSmall}
            onPress={() => navigation.navigate('AddSubscription', { customerId: customerData.id })}
          >
            <Plus size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
            <Text style={styles.addBtnSmallText}>Add</Text>
          </TouchableOpacity>
        </View>

        {loadingSubs ? (
          <View style={[styles.detailsCard, { padding: 30, alignItems: 'center' }]}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : subscriptions.length === 0 ? (
          <View style={[styles.detailsCard, { padding: 30, alignItems: 'center' }]}>
            <Repeat size={32} color={COLORS.textPlaceholder} style={{ marginBottom: 8 }} />
            <Text style={{ color: COLORS.textPlaceholder, fontFamily: 'Inter-Regular', fontSize: 13 }}>No active subscriptions</Text>
          </View>
        ) : (
          subscriptions.map((sub, index) => (
            <View key={sub.id} style={[styles.detailsCard, { marginBottom: 12, padding: 0, overflow: 'hidden' }]}>
              <TouchableOpacity
                style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('SubscriptionDetail', { subscriptionId: sub.id, subscription: sub })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: COLORS.primary }}>
                    {sub.Product?.name || 'Unknown Product'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: COLORS.textPlaceholder, marginRight: 12 }}>
                      Qty: {sub.baseQuantity}
                    </Text>
                    <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: COLORS.textPlaceholder }}>
                      {formatRecurrence(sub.recurrencePattern)}
                    </Text>
                  </View>
                </View>
                
                <View style={[styles.statusBadge, { backgroundColor: sub.status === 'active' ? COLORS.primaryLight : sub.status === 'paused' ? COLORS.primaryLight : COLORS.primaryLight }]}>
                  <Text style={[styles.statusText, { color: sub.status === 'active' ? COLORS.primary : sub.status === 'paused' ? COLORS.primary : COLORS.primary }]}>
                    {sub.status.toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.textPlaceholder }}>
                <TouchableOpacity 
                  style={{ flex: 1, padding: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderRightWidth: 1, borderRightColor: COLORS.textPlaceholder }}
                  onPress={() => toggleSubscriptionStatus(sub)}
                >
                  {sub.status === 'active' ? (
                    <>
                      <Pause size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                      <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: COLORS.primary }}>Pause</Text>
                    </>
                  ) : (
                    <>
                      <Play size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                      <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: COLORS.primary }}>Resume</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ flex: 1, padding: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                  onPress={() => handleDeleteSubscription(sub)}
                >
                  <Trash2 size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: COLORS.primary }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textPlaceholder,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: COLORS.primaryLight,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    marginBottom: 24,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.textPlaceholder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerNameText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
  },
  sectionHeader: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
  },
  addBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.textPlaceholder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addBtnSmallText: {
    color: COLORS.textPrimary,
    fontFamily: 'Inter-Bold',
    fontSize: 12,
  },
  detailsCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: COLORS.textPlaceholder,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.textPlaceholder,
    marginVertical: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: COLORS.surface,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: COLORS.textPlaceholder,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
});

export default CustomerDetailScreen;
