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
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ChevronLeft,
  Plus,
  AlertCircle,
  ShoppingBag,
  Trash2,
  Calendar,
  Search,
  X,
  Truck,
  ChevronDown,
  ChevronUp,
  Edit2,
  Save,
  CheckSquare,
  ArrowLeft} from 'lucide-react-native';
import DeliveryStatusSlider from '../../components/DeliveryStatusSlider';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import CurvedHeader from '../../components/CurvedHeader';


const OneTimeOrderCard = ({ item, index, onUpdateStatus, getStatusColors, formatDisplayDate, onCancelOrder }) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const statusColors = getStatusColors(item.status);
  const dateDisplay = item.orderFrom === item.orderTo 
    ? formatDisplayDate(item.orderFrom) 
    : `${formatDisplayDate(item.orderFrom)} → ${formatDisplayDate(item.orderTo)}`;
  
  const orderedQty = (item.OneTimeOrderItems || []).reduce((acc, current) => {
    return acc + (parseInt(current.quantity) || 0);
  }, 0);

  const totalDeliveredUnits = (item.Deliveries || []).reduce((acc, d) => {
    return acc + (parseInt(d.fullUnitsDelivered) || 0);
  }, 0);

  const totalEmptyUnits = (item.Deliveries || []).reduce((acc, d) => {
    return acc + (parseInt(d.emptyUnitsCollected) || 0);
  }, 0);

  const additionalJars = Math.max(0, totalDeliveredUnits - orderedQty);
  const remainingJars = Math.max(0, orderedQty - totalDeliveredUnits);

  const defaultFull = (item.status === 'pending')
    ? (remainingJars > 0 ? String(remainingJars) : String(orderedQty || 1))
    : String(totalDeliveredUnits || 0);
    
  const defaultEmpty = (item.status === 'pending')
    ? '0'
    : String(totalEmptyUnits || 0);

  const [fullUnits, setFullUnits] = useState(defaultFull);
  const [emptyUnits, setEmptyUnits] = useState(defaultEmpty);

  const totalOrderPrice = (item.OneTimeOrderItems || []).reduce((acc, current) => {
    const productPrice = parseFloat(current.unitPrice) || 0;
    const qty = totalDeliveredUnits > 0 ? totalDeliveredUnits : (parseInt(current.quantity) || 0);
    return acc + (productPrice * qty);
  }, 0);

  const displayUnitPrice = parseFloat(item.OneTimeOrderItems?.[0]?.unitPrice) || 0;
  const activeQty = totalDeliveredUnits > 0 ? totalDeliveredUnits : orderedQty;
  const priceDisplayString = displayUnitPrice > 0 
    ? `₹${displayUnitPrice.toFixed(2)} × ${activeQty} = ₹${totalOrderPrice.toFixed(2)}`
    : `₹${totalOrderPrice.toFixed(2)}`;

  const itemsCount = (item.OneTimeOrderItems || []).length;
  const itemsSummary = (item.OneTimeOrderItems || [])
    .map(itm => `${itm.Product?.name || 'Item'} (x${itm.quantity})`)
    .join(', ');

  const handleUpdate = async (status, full, empty) => {
    setUpdating(true);
    await onUpdateStatus(item.id, {
      deliveryDate: new Date().toISOString().split('T')[0],
      status,
      fullUnitsDelivered: parseInt(full) || 0,
      emptyUnitsCollected: parseInt(empty) || 0,
    });
    setUpdating(false);
    setIsEditing(false);
    if (status !== 'pending') {
      setIsExpanded(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    handleUpdate(newStatus, fullUnits, emptyUnits);
  };

  return (
    <View style={[styles.card, isEditing && styles.cardEditing, { borderLeftWidth: 4, borderLeftColor: '#3B82F6' }]}>
      {updating && (
        <View style={styles.cardUpdatingOverlay}>
          <ActivityIndicator color="#1D4ED8" />
        </View>
      )}
      <TouchableOpacity 
        style={styles.cardHeader} 
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.iconBoxOptionC}>
          <Text style={styles.iconBoxTextOptionC}>{index}</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.customerName} numberOfLines={1}>
            {item.Customer?.name || t('common.unknownCustomer')}
          </Text>
          <View style={styles.row}>
            <Text style={styles.subText} numberOfLines={1}>
              {itemsCount === 1 ? itemsSummary : `${itemsCount} ${t('common.products')}: ${itemsSummary}`}
            </Text>
          </View>
          {additionalJars > 0 && (
            <Text style={{ fontSize: 11, fontFamily: 'Rubik-Bold', color: '#16A34A', marginTop: 2 }}>
              + {additionalJars} {t('deliveries.additionalJars')}
            </Text>
          )}
          {remainingJars > 0 && item.status === 'pending' && (
            <Text style={{ fontSize: 11, fontFamily: 'Rubik-SemiBold', color: '#D97706', marginTop: 2 }}>
              {remainingJars} {t('deliveries.remainingJars')}
            </Text>
          )}
        </View>

        <View style={styles.headerActions}>
          {item.status === 'pending' && !isExpanded && (
            <TouchableOpacity 
              style={[styles.quickDeliverIconBtn, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5', marginRight: 6 }]}
              onPress={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
                setIsEditing(true);
              }}
              activeOpacity={0.7}
            >
              <Edit2 size={20} color="#EA580C" />
            </TouchableOpacity>
          )}

          {item.status === 'pending' && !isExpanded ? (
            <TouchableOpacity 
              style={styles.quickDeliverIconBtn}
              onPress={(e) => {
                e.stopPropagation();
                handleStatusChange('delivered');
              }}
              activeOpacity={0.7}
            >
              <CheckSquare size={20} color="#16A34A" />
            </TouchableOpacity>
          ) : (
            item.status !== 'pending' && (
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: statusColors.dot }]} />
                <Text style={[styles.statusText, { color: statusColors.text }]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            )
          )}
          
          <View style={styles.expandIconContainer}>
            {isExpanded ? (
              <ChevronUp size={22} color="#64748B" />
            ) : (
              <ChevronDown size={22} color="#64748B" />
            )}
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.divider} />

      <View style={styles.cardFooter}>
        <View style={styles.metaContainer}>
          <Calendar size={14} color="#64748B" style={{ marginRight: 4 }} />
          <Text style={styles.metaText} numberOfLines={1}>
            {dateDisplay}
          </Text>
        </View>

        <View style={styles.footerRight}>
          <Text style={styles.totalPrice}>{priceDisplayString}</Text>
          
          {item.status === 'pending' && onCancelOrder && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => onCancelOrder(item.id)}
              activeOpacity={0.7}
            >
              <Trash2 size={14} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isExpanded && (
        <View style={styles.expandedContent}>

          {Array.isArray(item.Deliveries) && item.Deliveries.length > 0 ? (
            <View style={styles.deliveryLogsSection}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={styles.deliveryLogsTitle}>{t('deliveries.deliveryLogs')} ({item.Deliveries.length})</Text>
                {additionalJars > 0 && (
                  <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ fontSize: 11, fontFamily: 'Rubik-Bold', color: '#15803D' }}>
                      +{additionalJars} {t('deliveries.additionalJars')}
                    </Text>
                  </View>
                )}
              </View>
              {item.Deliveries.map((delivery, dIdx) => {
                const dStatus = (delivery.status || 'pending').toLowerCase();
                const badgeBg = dStatus === 'delivered' ? '#ECFDF5' : dStatus === 'skipped' ? '#FEF2F2' : '#FFFBEB';
                const badgeColor = dStatus === 'delivered' ? '#15803D' : dStatus === 'skipped' ? '#B91C1C' : '#B45309';

                return (
                  <View key={delivery.id || dIdx} style={styles.deliveryLogRow}>
                    <View style={styles.deliveryLogHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Truck size={14} color="#64748B" style={{ marginRight: 6 }} />
                        <Text style={styles.deliveryLogDate}>{delivery.deliveryDate || 'N/A'}</Text>
                      </View>
                      <View style={[styles.deliveryLogBadge, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.deliveryLogBadgeText, { color: badgeColor }]}>
                          {dStatus.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.deliveryLogUnitsRow}>
                      <Text style={styles.deliveryLogUnitText}>
                        {t('deliveries.delivered')}: <Text style={{ fontFamily: 'Rubik-Bold', color: '#0F172A' }}>{delivery.fullUnitsDelivered ?? 0}</Text>
                      </Text>
                      <Text style={styles.deliveryLogUnitText}>
                        {t('deliveries.emptyCollected')}: <Text style={{ fontFamily: 'Rubik-Bold', color: '#0F172A' }}>{delivery.emptyUnitsCollected ?? 0}</Text>
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : item.status !== 'pending' ? (
            <View style={styles.noDeliveriesInfo}>
              <Text style={styles.noDeliveriesText}>{t('deliveries.awaitingLogs')}</Text>
            </View>
          ) : null}

          {item.status === 'pending' && (
            <>
              {!isEditing ? (
                <View style={styles.sliderSection}>
                  <View style={styles.sliderUnitsRow}>
                    <View style={[styles.sliderUnit, styles.sliderUnitEmpty]}>
                      <Text style={[styles.sliderUnitLabel, { color: '#64748B' }]}>{t('deliveries.emptyJars')}</Text>
                      <Text style={[styles.sliderUnitValue, { color: '#0F172A' }]}>{emptyUnits}</Text>
                    </View>
                    <View style={[styles.sliderUnit, styles.sliderUnitDelivered]}>
                      <Text style={[styles.sliderUnitLabel, { color: '#1D4ED8' }]}>{t('deliveries.delivered')}</Text>
                      <Text style={[styles.sliderUnitValue, { color: '#1D4ED8' }]}>{fullUnits}</Text>
                    </View>
                  </View>
                  <DeliveryStatusSlider 
                    status={item.status} 
                    onStatusChange={handleStatusChange} 
                  />
                </View>
              ) : (
                <View style={styles.inlineEditContainer}>
                  <View style={styles.inlineInputWrapper}>
                    <View style={styles.inlineInputGroup}>
                      <Text style={styles.inlineInputLabel}>{t('deliveries.fullUnits')}</Text>
                      <TextInput
                        style={styles.inlineInput}
                        value={fullUnits}
                        onChangeText={setFullUnits}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>
                    <View style={styles.inlineInputGroup}>
                      <Text style={styles.inlineInputLabel}>{t('deliveries.emptyUnits')}</Text>
                      <TextInput
                        style={styles.inlineInput}
                        value={emptyUnits}
                        onChangeText={setEmptyUnits}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.inlineSaveBtn}
                    onPress={() => handleUpdate('delivered', fullUnits, emptyUnits)}
                    activeOpacity={0.8}
                  >
                    <Save size={16} color="#FFF" style={{ marginRight: 4 }} />
                    <Text style={styles.inlineSaveBtnText}>{t('common.save')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
};

const OneTimeOrderListScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { userToken, user } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const handleUpdateStatus = async (orderId, payload) => {
    try {
      const res = await api.fulfillOneTimeOrder(userToken, orderId, payload);
      if (res && res.success) {
        fetchOrders(false);
      } else {
        showAlert('Error', res.message || 'Failed to fulfill order', 'error');
      }
    } catch (err) {
      showAlert('Error', err.message, 'error');
    }
  };


  const fetchOrders = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const res = await api.listOneTimeOrders(userToken);
      if (res.success) {
        // Sort: pending first, then by date descending
        const sorted = (res.data || []).sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (a.status !== 'pending' && b.status === 'pending') return 1;
          return b.orderFrom.localeCompare(a.orderFrom);
        });
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!str) return 'â€”';
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

  const renderOrderItem = ({ item, index }) => (
    <OneTimeOrderCard 
      item={item} 
      index={index + 1}
      onUpdateStatus={handleUpdateStatus} 
      getStatusColors={getStatusColors} 
      formatDisplayDate={formatDisplayDate} 
      onCancelOrder={user?.role !== 'staff' ? handleCancelOrder : undefined}
    />
  );

  return (
    <View style={styles.container}>
      <CurvedHeader
        title={t('oneTimeOrders.title', 'One-Time Orders')}
        leftIcon={<ArrowLeft size={24} color="#FFFFFF" />}
        onLeftPress={() => navigation.goBack()}
        height={140}
        contentStyle={{ paddingTop: Platform.OS === 'ios' ? 40 : 20, paddingBottom: 35 }}
      />
      
      <View style={styles.contentWrapper}>
        {/* Search Box */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color={COLORS.textPlaceholder} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('customers.searchPlaceholder')}
              placeholderTextColor={COLORS.textPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>{t('oneTimeOrders.loadingOrders')}</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <AlertCircle size={40} color={COLORS.primary} style={{ marginBottom: 12 }} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchOrders(true)}>
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={item => String(item.id)}
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
                    ? t('oneTimeOrders.noOrdersSearch') 
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


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentWrapper: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
    marginTop: 10,
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

  cardEditing: {
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardUpdatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickDeliverIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  expandIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedContent: {
    paddingTop: 12,
    paddingHorizontal: 4,
  },
  editToggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editToggleText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Rubik-SemiBold',
  },
  sliderSection: {
    marginTop: 4,
    marginBottom: 8,
  },
  sliderUnitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sliderUnit: {
    alignItems: 'center',
  },
  sliderUnitLabel: {
    fontSize: 12,
    fontFamily: 'Rubik-SemiBold',
    marginBottom: 4,
  },
  sliderUnitValue: {
    fontSize: 20,
    fontFamily: 'Rubik-Bold',
  },
  inlineEditContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  inlineInputWrapper: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inlineInputGroup: {
    flex: 1,
  },
  inlineInputLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Rubik-SemiBold',
    marginBottom: 6,
  },
  inlineInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
    color: '#0F172A',
    textAlign: 'center',
  },
  inlineSaveBtn: {
    backgroundColor: '#1D4ED8',
    flexDirection: 'row',
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
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
  iconBoxOptionC: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconBoxTextOptionC: {
    color: '#1D4ED8',
    fontFamily: 'Rubik-Bold',
    fontSize: 14,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  customerName: {
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-SemiBold',
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
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-SemiBold',
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
    fontFamily: 'Rubik-Bold',
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
  deliverBlockBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  deliverBlockBtnText: {
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
    color: COLORS.primary,
    marginLeft: 8,
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
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: 'Rubik-Bold',
    fontSize: 14,
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
    fontFamily: 'Rubik-SemiBold',
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
  deliveryLogsSection: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deliveryLogsTitle: {
    fontSize: 12,
    fontFamily: 'Rubik-Bold',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deliveryLogRow: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deliveryLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  deliveryLogDate: {
    fontSize: 12,
    fontFamily: 'Rubik-SemiBold',
    color: '#334155',
  },
  deliveryLogBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deliveryLogBadgeText: {
    fontSize: 10,
    fontFamily: 'Rubik-Bold',
  },
  deliveryLogUnitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  deliveryLogUnitText: {
    fontSize: 12,
    fontFamily: 'Rubik-Medium',
    color: '#64748B',
  },
  noDeliveriesInfo: {
    padding: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  noDeliveriesText: {
    fontSize: 12,
    fontFamily: 'Rubik-SemiBold',
    color: '#64748B',
  },
});

export default OneTimeOrderListScreen;

