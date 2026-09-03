import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ChevronLeft, Truck, Repeat, IndianRupee, FileText, ShieldCheck, Ticket, Package, Activity, Clock, CheckCircle, ChevronDown, ChevronUp , ArrowLeft} from 'lucide-react-native';
import CurvedHeader from '../../components/CurvedHeader';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { COLORS } from '../../constants/colors';
import { useTranslation } from 'react-i18next';

const CustomerDeliveryHistoryScreen = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { userToken } = useContext(AuthContext);
  
  const { customerId, customerName } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  
  // Accordion state
  const [expandedId, setExpandedId] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const limit = 10;
  
  // Filters state
  const [filterType, setFilterType] = useState('all');

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'delivery', label: 'Deliveries' },
    { id: 'payment', label: 'Payments' },
    { id: 'invoice', label: 'Invoices' },
    { id: 'subscription', label: 'Subscriptions' },
    { id: 'deposit', label: 'Deposits' },
    { id: 'ticket', label: 'Tickets' },
    { id: 'order', label: 'Orders' },
  ];

  const fetchActivities = useCallback(async (pageNumber = 1, isLoadMore = false) => {
    if (!customerId) return;
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const response = await api.getCustomerActivity(userToken, customerId, {
        type: filterType,
        page: pageNumber,
        limit
      });
      if (response.success && response.data) {
        const { activities: fetchedActivities, summary, customer } = response.data;
        const list = Array.isArray(fetchedActivities) ? fetchedActivities : 
                     (Array.isArray(response.data) ? response.data : []);
        
        if (summary) setSummaryData(summary);
        if (customer) setCustomerData(customer);

        if (isLoadMore) {
          setActivities(prev => [...prev, ...list]);
        } else {
          setActivities(list);
        }
        
        if (list.length < limit) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to fetch customer activity:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [userToken, customerId, filterType]);

  useEffect(() => {
    setExpandedId(null);
    setPage(1);
    setHasMore(true);
    fetchActivities(1, false);
  }, [fetchActivities]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchActivities(1, false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchActivities(nextPage, true);
    }
  };

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  const getIconForType = (type) => {
    switch(type?.toLowerCase()) {
      case 'delivery': return <Truck size={20} color={COLORS.primary} />;
      case 'jar_collection': return <Package size={20} color="#059669" />;
      case 'subscription': return <Repeat size={20} color="#8B5CF6" />;
      case 'payment': return <IndianRupee size={20} color="#10B981" />;
      case 'invoice': return <FileText size={20} color="#F59E0B" />;
      case 'deposit': return <ShieldCheck size={20} color="#3B82F6" />;
      case 'ticket': return <Ticket size={20} color="#EF4444" />;
      case 'order': return <Package size={20} color="#14B8A6" />;
      default: return <Activity size={20} color={COLORS.textSecondary} />;
    }
  };

  const getBadgeStyleForType = (type) => {
    switch(type?.toLowerCase()) {
      case 'delivery': return { bg: '#E0E7FF', border: '#C7D2FE' };
      case 'jar_collection': return { bg: '#D1FAE5', border: '#A7F3D0' };
      case 'subscription': return { bg: '#EDE9FE', border: '#DDD6FE' };
      case 'payment': return { bg: '#D1FAE5', border: '#A7F3D0' };
      case 'invoice': return { bg: '#FEF3C7', border: '#FDE68A' };
      case 'deposit': return { bg: '#DBEAFE', border: '#BFDBFE' };
      case 'ticket': return { bg: '#FEE2E2', border: '#FECACA' };
      case 'order': return { bg: '#CCFBF1', border: '#99F6E4' };
      default: return { bg: '#F1F5F9', border: '#E2E8F0' };
    }
  };

  const getBadgeColor = (colorString) => {
    switch(colorString) {
      case 'info': return { bg: '#E0E7FF', text: '#3730A3' };
      case 'success': return { bg: '#D1FAE5', text: '#065F46' };
      case 'warning': return { bg: '#FEF3C7', text: '#92400E' };
      case 'danger': return { bg: '#FEE2E2', text: '#991B1B' };
      case 'primary': return { bg: COLORS.primaryLight, text: COLORS.primary };
      default: return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {filterOptions.map((opt) => (
          <TouchableOpacity 
            key={opt.id}
            style={[styles.filterChip, filterType === opt.id && styles.filterChipActive]}
            onPress={() => setFilterType(opt.id)}
          >
            <Text style={[styles.filterText, filterType === opt.id && styles.filterTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSummaryHeader = () => {
    if (!summaryData) return null;
    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('customerDetail.quickSummary')}</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summaryData.totalDeliveries || 0}</Text>
              <Text style={styles.summaryLabel}>{t('customerDetail.totalDeliveries')}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summaryData.uninvoicedDeliveriesCount || 0}</Text>
              <Text style={styles.summaryLabel}>{t('customerDetail.unbilled')}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>₹{Number(summaryData.estimatedUnbilledAmount || 0).toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>{t('customerDetail.unbilledAmt')}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderActivityItem = ({ item }) => {
    const isExpanded = expandedId === item.id;
    const badgeStyle = getBadgeStyleForType(item.type);
    
    // Parse nice date
    let formattedDate = 'Unknown Date';
    let formattedTime = '';
    if (item.timestamp) {
      const d = new Date(item.timestamp);
      formattedDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      formattedTime = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } else if (item.date) {
      formattedDate = new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Badge styling from backend
    let dynamicBadge = null;
    if (item.badge) {
      const colors = getBadgeColor(item.badge.color);
      dynamicBadge = (
        <View style={[styles.dynamicBadge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.dynamicBadgeText, { color: colors.text }]}>{item.badge.text}</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity 
        style={[styles.activityCard, isExpanded && styles.activityCardExpanded]} 
        onPress={() => toggleExpand(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.timelineIconContainer, { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border }]}>
            {getIconForType(item.type)}
          </View>
          
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <Text style={styles.activityTitle} numberOfLines={1}>{item.title || item.type}</Text>
              {dynamicBadge}
            </View>
            <Text style={styles.activitySubtitle}>{item.subtitle || ''}</Text>
            
            <View style={styles.dateRow}>
              <Clock size={12} color={COLORS.textPlaceholder} style={{ marginRight: 4 }} />
              <Text style={styles.dateText}>{formattedDate} {formattedTime ? `â€¢ ${formattedTime}` : ''}</Text>
            </View>
          </View>

          <View style={styles.expandIconContainer}>
            {isExpanded ? (
              <ChevronUp size={20} color={COLORS.textSecondary} />
            ) : (
              <ChevronDown size={20} color={COLORS.textSecondary} />
            )}
          </View>
        </View>

        {isExpanded && (item.amount !== null || item.details) && (
          <View style={styles.expandedContent}>
            <View style={styles.divider} />
            
            {item.amount !== null && !isNaN(Number(item.amount)) && (
              <View style={styles.amountRow}>
                <Text style={styles.detailLabel}>{t('invoices.amount')}</Text>
                <Text style={styles.activityAmount}>₹{Number(item.amount).toFixed(2)}</Text>
              </View>
            )}
            
            {item.details && typeof item.details === 'object' && (
              <View style={styles.detailsGrid}>
                {item.details.fullUnitsDelivered !== undefined && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t('deliveries.delivered')}</Text>
                    <Text style={styles.detailValue}>{item.details.fullUnitsDelivered}</Text>
                  </View>
                )}
                {item.details.emptyUnitsCollected !== undefined && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t('deliveries.emptyRetrieved')}</Text>
                    <Text style={styles.detailValue}>{item.details.emptyUnitsCollected}</Text>
                  </View>
                )}
                {item.details.unitPriceCharged !== undefined && !isNaN(Number(item.details.unitPriceCharged)) && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t('invoices.rate')}</Text>
                    <Text style={styles.detailValue}>₹{Number(item.details.unitPriceCharged).toFixed(2)}</Text>
                  </View>
                )}
                {item.status && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t('common.status')}</Text>
                    <Text style={[styles.detailValue, { textTransform: 'capitalize', color: item.status === 'delivered' || item.status === 'collected' ? '#059669' : '#D97706' }]}>
                      {item.status}
                    </Text>
                  </View>
                )}
                {item.isInvoiced !== undefined && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t('invoices.title')}</Text>
                    <Text style={[styles.detailValue, { color: item.isInvoiced ? '#059669' : '#D97706' }]}>
                      {item.isInvoiced ? 'Invoiced' : t('customerDetail.unbilled')}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <CurvedHeader
        title={`${customerName || 'Customer'} Activity`}
        leftIcon={<ArrowLeft size={24} color="#FFFFFF" />}
        onLeftPress={() => navigation.goBack()}
        height={130}
        contentStyle={{ paddingTop: 10, paddingBottom: 25 }}
      />

      <View style={{ height: 50, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#FFF' }}>
        {renderFilterChips()}
      </View>

      {loading && !refreshing && page === 1 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : activities.length === 0 ? (
        <View style={styles.centerContainer}>
          <Activity size={60} color={COLORS.textPlaceholder} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>{t('customerDetail.noActivityFound')}</Text>
          <Text style={styles.emptySubtitle}>{t('customerDetail.noActivityFilter')}</Text>
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item, index) => item.id ? String(item.id) : String(index)}
          renderItem={renderActivityItem}
          ListHeaderComponent={renderSummaryHeader}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  filterContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    alignSelf: 'center',
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryLight,
  },
  filterText: {
    fontSize: 13,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.primary,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryContainer: {
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  summaryTitle: {
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textSecondary,
  },
  activityCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  activityCardExpanded: {
    borderColor: '#E2E8F0',
    shadowOpacity: 0.06,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  activityTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
  },
  activitySubtitle: {
    fontSize: 13,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textPlaceholder,
  },
  expandIconContainer: {
    paddingLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dynamicBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  dynamicBadgeText: {
    fontSize: 10,
    fontFamily: 'Rubik-Bold',
  },
  expandedContent: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
  },
  activityAmount: {
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    color: '#059669',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
  },
  detailItem: {
    width: '50%',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textPlaceholder,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
  }
});

export default CustomerDeliveryHistoryScreen;

