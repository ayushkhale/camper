import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  Plus,
  AlertCircle,
  ShoppingBag,
  Trash2,
  Calendar,
  Phone,
  Package,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

const OneTimeOrderListScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { userToken } = useContext(AuthContext);

  const [orders, setOrders] = useState([]);
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
    Alert.alert(
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
                Alert.alert(t('completeReg.success'), t('oneTimeOrders.orderCancelled'));
                fetchOrders(false);
              } else {
                throw new Error(res.message || 'Could not cancel order');
              }
            } catch (err) {
              Alert.alert('Error', err.message || 'An error occurred');
            }
          },
        },
      ]
    );
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'fulfilled':
        return { bg: COLORS.successLight, text: COLORS.success };
      case 'cancelled':
        return { bg: COLORS.dangerLight, text: COLORS.danger };
      default:
        return { bg: COLORS.warningLight, text: COLORS.warning };
    }
  };

  const renderOrderItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    const dateDisplay = item.orderFrom === item.orderTo ? item.orderFrom : `${item.orderFrom} to ${item.orderTo}`;
    
    // Calculate total price of order
    const totalOrderPrice = (item.OneTimeOrderItems || []).reduce((acc, current) => {
      const price = parseFloat(current.unitPrice) || 0;
      const qty = parseInt(current.quantity) || 0;
      return acc + (price * qty);
    }, 0);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{item.Customer?.name || 'Unknown Customer'}</Text>
            <View style={styles.phoneRow}>
              <Phone size={12} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.customerPhone}>{item.Customer?.phone || 'No phone'}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Date Row */}
        <View style={styles.detailRow}>
          <Calendar size={14} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
          <Text style={styles.detailText}>{dateDisplay}</Text>
        </View>

        {/* Items Summary */}
        <View style={styles.itemsContainer}>
          <Text style={styles.itemsTitle}>{t('oneTimeOrders.items')}</Text>
          {(item.OneTimeOrderItems || []).map((itm, index) => (
            <View key={index} style={styles.itemRow}>
              <Package size={12} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.itemName}>
                {itm.Product?.name || 'Unknown Product'} x {itm.quantity}
              </Text>
              <Text style={styles.itemPrice}>₹{(parseFloat(itm.unitPrice) * itm.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {item.notes ? (
          <View style={styles.notesContainer}>
            <Text style={styles.notesText} numberOfLines={2}>Note: "{item.notes}"</Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.totalLabel}>{t('home.todayEarnings')}:</Text>
          <Text style={styles.totalValue}>₹{totalOrderPrice.toFixed(2)}</Text>

          {item.status === 'pending' && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleCancelOrder(item.id)}
            >
              <Trash2 size={16} color={COLORS.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right', 'top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('oneTimeOrders.title')}</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('deliveries.updating')}</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={40} color={COLORS.danger} style={{ marginBottom: 12 }} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchOrders(true)}>
            <Text style={styles.retryText}>{t('products.cancel')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={
            orders.length === 0 ? styles.emptyListContent : styles.listContent
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ShoppingBag size={48} color={COLORS.textPlaceholder} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyTitle}>{t('oneTimeOrders.noOrders')}</Text>
              <Text style={styles.emptySubtitle}>{t('oneTimeOrders.noOrdersSub')}</Text>
            </View>
          }
        />
      )}

      {!loading && !error && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AddOneTimeOrder')}
        >
          <Plus size={24} color="#FFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
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
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
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
    fontSize: 13.5,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerPhone: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: COLORS.textPrimary,
  },
  itemsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: COLORS.textPrimary,
  },
  itemPrice: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
  },
  notesContainer: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  notesText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
    marginRight: 6,
  },
  totalValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: COLORS.primary,
  },
  cancelBtn: {
    marginLeft: 'auto',
    padding: 6,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 8,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default OneTimeOrderListScreen;
