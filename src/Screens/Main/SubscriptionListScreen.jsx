import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Plus, Package, ChevronRight, AlertCircle, RefreshCw, Calendar, Repeat, User } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

const SubscriptionListScreen = () => {
  const navigation = useNavigation();
  const { userToken } = useContext(AuthContext);

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, paused, ended

  const fetchSubscriptions = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      // Fetch all and filter locally for a snappier experience, or fetch by status.
      // We will fetch all and filter locally.
      const res = await api.listSubscriptions(userToken);
      if (res.success) {
        setSubscriptions(res.data || []);
      } else {
        throw new Error(res.message || 'Failed to fetch subscriptions');
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchSubscriptions(true);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubscriptions(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return { bg: COLORS.successLight, text: COLORS.success };
      case 'paused': return { bg: COLORS.warningLight, text: COLORS.warning };
      case 'ended': return { bg: COLORS.dangerLight, text: COLORS.danger };
      default: return { bg: COLORS.borderLight, text: COLORS.textSecondary };
    }
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

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (filterStatus === 'all') return true;
    return sub.status === filterStatus;
  });

  const renderSubscriptionCard = ({ item }) => {
    const statusColors = getStatusColor(item.status);
    
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('SubscriptionDetail', { subscriptionId: item.id, subscription: item })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
             {item.Product?.imageUrl ? (
               <Image source={{ uri: item.Product.imageUrl }} style={styles.productImage} />
             ) : (
               <Package size={20} color={COLORS.primary} />
             )}
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.Customer?.name || 'Unknown Customer'}
            </Text>
            <Text style={styles.productName} numberOfLines={1}>
              {item.Product?.name || 'Unknown Product'}
            </Text>
          </View>
          <ChevronRight size={18} color={COLORS.textPlaceholder} />
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.detailsRow}>
            <View style={styles.detailBadge}>
              <Package size={12} color={COLORS.textPlaceholder} style={{ marginRight: 4 }} />
              <Text style={styles.detailText}>Qty: {item.baseQuantity}</Text>
            </View>
            <View style={[styles.detailBadge, { marginLeft: 8 }]}>
              <Repeat size={12} color={COLORS.textPlaceholder} style={{ marginRight: 4 }} />
              <Text style={styles.detailText}>{formatRecurrence(item.recurrencePattern)}</Text>
            </View>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Subscriptions</Text>
      </View>

      <View style={styles.filterContainer}>
        {['all', 'active', 'paused', 'ended'].map(status => (
          <TouchableOpacity
            key={status}
            style={[styles.filterTab, filterStatus === status && styles.filterTabActive]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[styles.filterTabText, filterStatus === status && styles.filterTabTextActive]}>
              {status.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading subscriptions...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={40} color={COLORS.primary} style={{ marginBottom: 12 }} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchSubscriptions(true)}>
            <RefreshCw size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredSubscriptions}
          keyExtractor={(item) => item.id}
          renderItem={renderSubscriptionCard}
          contentContainerStyle={
            filteredSubscriptions.length === 0 ? styles.emptyListContent : styles.listContent
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Repeat size={48} color={COLORS.textPlaceholder} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyTitle}>No Subscriptions Found</Text>
              <Text style={styles.emptySubtitle}>
                {filterStatus !== 'all' 
                  ? `You have no ${filterStatus} subscriptions.` 
                  : 'Start by creating a recurring subscription.'}
              </Text>
              {filterStatus === 'all' && (
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => navigation.navigate('AddSubscription')}
                >
                  <Plus size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.emptyAddBtnText}>Add Subscription</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {!loading && !error && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AddSubscription')}
        >
          <Plus size={24} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: COLORS.primary,
    fontFamily: 'Inter-Bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 90,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  titleContainer: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
  },
  productName: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detailText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 14.5,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 22,
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SubscriptionListScreen;
