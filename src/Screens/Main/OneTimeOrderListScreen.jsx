import React, { useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  ChevronLeft,
  Plus,
  AlertCircle,
  ShoppingBag,
  Trash2,
  Calendar,
  Search,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useAlert } from '../../context/AlertContext';

const OneTimeOrderListScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { userToken } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const res = await api.listOneTimeOrders(userToken);
      if (res.success) {
        // Sort by date descending (newest first)
        const sorted = (res.data || []).sort((a, b) => b.orderFrom.localeCompare(a.orderFrom));
        setOrders(sorted);
      } else {
        throw new Error(res.message || 'Failed to fetch one-time orders');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while loading orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders(true);
    }, [userToken])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders(false);
  };

  const handleCancelOrder = (orderId) => {
    showAlert(
      t('oneTimeOrders.title'),
      t('oneTimeOrders.confirmCancel'),
      [
        { text: t('staff.cancel'), style: 'cancel' },
        {
          text: t('staff.deleteBtn'),
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.updateOneTimeOrderStatus(userToken, orderId, 'cancelled');
              if (res.success) {
                showAlert(t('completeReg.success'), t('oneTimeOrders.orderCancelled'), 'success');
                fetchOrders(false);
              } else {
                throw new Error(res.message || 'Could not cancel order');
              }
            } catch (err) {
              showAlert('Error', err.message || 'An error occurred', 'error');
            }
          },
        },
      ]
    );
  };

  const getStatusColors = (status) => {
    switch (status) {
      case 'fulfilled':
        return { dot: '#16A34A', text: '#15803D' };
      case 'cancelled':
        return { dot: '#94A3B8', text: '#64748B' };
      default:
        return { dot: '#D97706', text: '#B45309' }; // pending
    }
  };

  const formatDisplayDate = (str) => {
    if (!str) return '—';
    const [y, m, d] = str.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d} ${months[parseInt(m) - 1]} ${y}`;
  };

  const filteredOrders = orders.filter((item) => {
    const query = searchQuery.toLowerCase();
    const customerMatch = item.Customer?.name?.toLowerCase().includes(query);
    const itemMatch = (item.OneTimeOrderItems || []).some(
      (itm) => itm.Product?.name?.toLowerCase().includes(query)
    );
    return customerMatch || itemMatch;
  });

  const renderOrderItem = ({ item }) => {
    const statusColors = getStatusColors(item.status);
    const dateDisplay = item.orderFrom === item.orderTo 
      ? formatDisplayDate(item.orderFrom) 
      : `${formatDisplayDate(item.orderFrom)} → ${formatDisplayDate(item.orderTo)}`;
    
    // Calculate total price of order
    const totalOrderPrice = (item.OneTimeOrderItems || []).reduce((acc, current) => {
      const price = parseFloat(current.unitPrice) || 0;
      const qty = parseInt(current.quantity) || 0;
      return acc + (price * qty);
    }, 0);

    const itemsCount = (item.OneTimeOrderItems || []).length;
    const itemsSummary = (item.OneTimeOrderItems || [])
      .map(itm => `${itm.Product?.name || 'Item'} (x${itm.quantity})`)
      .join(', ');

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <ShoppingBag size={22} color={COLORS.primary} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.Customer?.name || 'Unknown Customer'}
            </Text>
            <View style={styles.row}>
              <Text style={styles.subText} numberOfLines={1}>
                {itemsCount === 1 ? itemsSummary : `${itemsCount} Products: ${itemsSummary}`}
              </Text>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: statusColors.dot }]} />
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.metaContainer}>
            <Calendar size={14} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.metaText} numberOfLines={1}>
              {dateDisplay}
            </Text>
          </View>

          <View style={styles.footerRight}>
            <Text style={styles.totalPrice}>₹{totalOrderPrice.toFixed(2)}</Text>
            
            {item.status === 'pending' && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleCancelOrder(item.id)}
                activeOpacity={0.7}
              >
                <Trash2 size={14} color={COLORS.danger} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.contentWrapper}>
        
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ChevronLeft size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('oneTimeOrders.title')}</Text>
          <View style={styles.headerRightSpacing} />
        </View>

        {/* Search Box */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color={COLORS.textPlaceholder} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by customer or product..."
              placeholderTextColor={COLORS.textPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading one-time orders...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <AlertCircle size={40} color={COLORS.primary} style={{ marginBottom: 12 }} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchOrders(true)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            renderItem={renderOrderItem}
            contentContainerStyle={
              filteredOrders.length === 0 ? styles.emptyListContent : styles.listContent
            }
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ShoppingBag size={48} color={COLORS.textPlaceholder} style={{ marginBottom: 16 }} />
                <Text style={styles.emptyTitle}>{t('oneTimeOrders.noOrders')}</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery 
                    ? 'No orders match your search query.' 
                    : t('oneTimeOrders.noOrdersSub')}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {!loading && !error && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AddOneTimeOrder')}
        >
          <Plus size={26} color="#FFF" />
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
  contentWrapper: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 24 : 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  headerRightSpacing: {
    width: 32,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
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
    fontFamily: 'Geologica-Medium',
    fontSize: 15,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
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
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  titleContainer: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontFamily: 'Geologica-Bold',
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  subText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Geologica-Medium',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Geologica-Bold',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  totalPrice: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: COLORS.primary,
  },
  cancelBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPlaceholder,
  },
  errorText: {
    fontSize: 15,
    fontFamily: 'Geologica-Medium',
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: 'Geologica-Bold',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textPlaceholder,
    textAlign: 'center',
    fontFamily: 'Geologica-Medium',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OneTimeOrderListScreen;
