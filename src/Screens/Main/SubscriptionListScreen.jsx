import React, { useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Plus, Search, AlertCircle, RefreshCw, Package, MapPin, Calendar, Clock, ChevronLeft, ChevronRight, Repeat, User , ArrowLeft } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import CurvedHeader from '../../components/CurvedHeader';

const SubscriptionListScreen = () => {
  const navigation = useNavigation();
  const { userToken } = useContext(AuthContext);
  const { t } = useTranslation();

  const [subscriptions, setSubscriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, paused, ended

  const fetchSubscriptions = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
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
    useCallback(() => {
      fetchSubscriptions(true);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubscriptions(false);
  };

  const getStatusColors = (status) => {
    switch (status) {
      case 'active': return { border: '#10B981', badgeBg: '#D1FAE5', badgeText: '#10B981' };
      case 'paused': return { border: '#F59E0B', badgeBg: '#FEF3C7', badgeText: '#D97706' };
      case 'ended': return { border: '#94A3B8', badgeBg: '#F1F5F9', badgeText: '#64748B' };
      default: return { border: '#94A3B8', badgeBg: '#F1F5F9', badgeText: '#64748B' };
    }
  };

  const formatRecurrence = (pattern) => {
    switch (pattern) {
      case 'daily': return t('subscriptions.daily');
      case 'alternate': case 'alternate_days': return t('subscriptions.alternateDays');
      case 'weekly': return t('subscriptions.weekly');
      case 'monthly': return t('subscriptions.monthly');
      default: return pattern || '';
    }
  };

  const filteredSubscriptions = subscriptions.filter((item) => {
    // 1. Status Filter
    if (filterStatus !== 'all' && item.status !== filterStatus) {
      return false;
    }
    // 2. Search Query Filter
    const query = searchQuery.toLowerCase();
    const customerMatch = item.Customer?.name?.toLowerCase().includes(query);
    const productMatch = item.Product?.name?.toLowerCase().includes(query);
    return customerMatch || productMatch;
  });

  const renderSubscriptionCard = ({ item }) => {
    const statusColors = getStatusColors(item.status);

    return (
      <TouchableOpacity
        style={[
          styles.card, 
          { borderLeftWidth: 4, borderLeftColor: statusColors.border }
        ]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('SubscriptionDetail', { subscriptionId: item.id, subscription: item })}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardInner}
        >
          {/* Decorative Background Circles */}
          <View style={StyleSheet.absoluteFillObject}>
            <Svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
              <Circle cx="-5%" cy="-20%" r="55" fill="#F1F5F9" />
              <Circle cx="105%" cy="120%" r="65" fill="#E2E8F0" opacity="0.5" />
            </Svg>
          </View>

          {/* Icon Left */}
          <View style={styles.iconBox}>
            <Package size={24} color={COLORS.primary} />
            <View style={[
              styles.avatarBadge,
              { backgroundColor: statusColors.border }
            ]} />
          </View>

          {/* Center Details */}
          <View style={styles.titleContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={[styles.customerName, { marginBottom: 0 }]} numberOfLines={1}>
                {item.Customer?.name || 'Unknown Customer'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Repeat size={12} color="#64748B" style={{ marginRight: 4 }} />
              <Text style={styles.subText} numberOfLines={1}>
                {item.Product?.name || 'Product'} • {t('subscriptions.qty')}: {item.baseQuantity} • {formatRecurrence(item.recurrencePattern)}
              </Text>
            </View>
          </View>

          {/* Right Action & Status */}
          <View style={styles.rightActionContainer}>
            <View style={styles.statusCol}>
              <View style={[styles.statusBadge, { backgroundColor: statusColors.badgeBg }]}>
                <Text style={[styles.statusBadgeText, { color: statusColors.badgeText }]}>
                  {item.status === 'active' ? t('subscriptions.active') 
                   : item.status === 'paused' ? t('subscriptions.paused') 
                   : item.status === 'ended' ? t('subscriptions.ended') 
                   : (item.status || 'active')}
                </Text>
              </View>
            </View>

            <ChevronRight size={18} color="#94A3B8" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <CurvedHeader
        title={t('subscriptions.title', 'Subscriptions')}
        leftIcon={<ArrowLeft size={24} color="#0B409C" />}
        onLeftPress={() => navigation.goBack()}
        height={140}
        contentStyle={{ paddingTop: Platform.OS === 'ios' ? 40 : 20, paddingBottom: 35 }}
      />

      <View style={styles.contentWrapper}>

        {/* Modern Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, filterStatus === 'all' && styles.tabBtnActive]}
            onPress={() => setFilterStatus('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, filterStatus === 'all' && styles.tabTextActive]}>
              {t('common.all')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, filterStatus === 'active' && styles.tabBtnActive]}
            onPress={() => setFilterStatus('active')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, filterStatus === 'active' && styles.tabTextActive]}>
              {t('subscriptions.active')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, filterStatus === 'paused' && styles.tabBtnActive]}
            onPress={() => setFilterStatus('paused')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, filterStatus === 'paused' && styles.tabTextActive]}>
              {t('subscriptions.paused')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, filterStatus === 'ended' && styles.tabBtnActive]}
            onPress={() => setFilterStatus('ended')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, filterStatus === 'ended' && styles.tabTextActive]}>
              {t('subscriptions.ended')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Box */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color={COLORS.textPlaceholder} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('subscriptions.searchPlaceholder')}
              placeholderTextColor={COLORS.textPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <AlertCircle size={40} color={COLORS.primary} style={{ marginBottom: 12 }} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchSubscriptions(true)}>
              <RefreshCw size={16} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredSubscriptions}
            keyExtractor={(item) => item.id || Math.random().toString()}
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
                <Package size={48} color={COLORS.textPlaceholder} style={{ marginBottom: 16 }} />
                <Text style={styles.emptyTitle}>{t('customers.noActiveSubscriptions')}</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery || filterStatus !== 'all'
                    ? t('customers.noCustomersSearch')
                    : t('customers.addSubDesc')}
                </Text>
                {!searchQuery && filterStatus === 'all' && (
                  <TouchableOpacity
                    style={styles.emptyAddBtn}
                    onPress={() => navigation.navigate('AddSubscription')}
                  >
                    <Plus size={18} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.emptyAddBtnText}>{t('customers.addSubscription')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </View>

      {!loading && !error && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AddSubscription')}
        >
          <Plus size={26} color="#FFF" />
        </TouchableOpacity>
      )}
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
    paddingTop: Platform.OS === 'ios' ? 24 : 16,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontFamily: 'Rubik-SemiBold',
    fontSize: 15,
    paddingVertical: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginTop: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Rubik-SemiBold',
    color: '#64748B',
  },
  tabTextActive: {
    fontFamily: 'Rubik-Bold',
    color: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  card: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  titleContainer: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    color: '#1E293B',
    marginBottom: 6,
    flexShrink: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  subText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'Rubik-Medium',
  },
  rightActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  statusCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: 8,
    minWidth: 50,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: 'Rubik-Bold',
    textTransform: 'capitalize',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textPlaceholder,
  },
  errorText: {
    fontSize: 15,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: 'Rubik-Bold',
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textPlaceholder,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Rubik-SemiBold',
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Rubik-Bold',
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 50,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
});

export default SubscriptionListScreen;

