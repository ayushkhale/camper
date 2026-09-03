import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { api } from '../../services/api';
import CurvedHeader from '../../components/CurvedHeader';
import { ChevronLeft, Package, Clock, CheckCircle2, XCircle, FileText, ArrowLeft, Droplets, IndianRupee, Truck } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';

const CustomerHistoryScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { customerId } = route.params;
  const { userToken } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const [activeTab, setActiveTab] = useState('deliveries'); // 'deliveries' or 'jars'
  const [loading, setLoading] = useState(true);

  // Deliveries data
  const [deliveries, setDeliveries] = useState([]);
  const [deliveriesSummary, setDeliveriesSummary] = useState(null);

  // Jars data
  const [jarCollections, setJarCollections] = useState([]);
  const [jarsSummary, setJarsSummary] = useState(null);

  useEffect(() => {
    fetchHistoryData();
  }, [customerId, activeTab]);

  const fetchHistoryData = async () => {
    try {
      // console.log('--- USER TOKEN ---', userToken);
      setLoading(true);
      if (activeTab === 'deliveries') {
        const res = await api.getCustomerDeliveries(userToken, customerId);
        if (res.success) {
          setDeliveries(res.data.deliveries || []);
          setDeliveriesSummary(res.data.summary || null);
        }
      } else {
        const res = await api.getCustomerJarCollections(userToken, customerId);
        if (res.success) {
          setJarCollections(res.data.history || res.data.collections || []);
          setJarsSummary(res.data.summary || null);
        }
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      showAlert('Error', 'Failed to load history data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const renderDeliveryItem = ({ item }) => {
    // Determine dynamic left border color
    let statusBorderColor = '#3B82F6'; // Default Blue
    if (item.status === 'pending') statusBorderColor = '#EAB308'; // Yellow
    if (item.status === 'skipped') statusBorderColor = '#EF4444'; // Red

    return (
      <View style={[styles.historyCard, { borderLeftColor: statusBorderColor }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>{formatDate(item.deliveryDate)}</Text>
          <View style={[styles.statusBadge,
          item.status === 'delivered' ? { backgroundColor: '#EFF6FF' } :
            item.status === 'skipped' ? { backgroundColor: '#FEF2F2' } :
              { backgroundColor: '#FFFBEB' }
          ]}>
            <Text style={[styles.statusText,
            item.status === 'delivered' ? { color: '#3B82F6' } :
              item.status === 'skipped' ? { color: '#EF4444' } :
                { color: '#B45309' }
            ]}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.productRow}>
            <Package size={16} color="#64748B" />
            <Text style={styles.productName}>{item.product?.name || 'N/A'}</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>{t('deliveries.delivered')}</Text>
              <Text style={styles.statBoxValue}>{item.fullUnitsDelivered || 0}</Text>
            </View>
            <View style={styles.statBoxDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>{t('deliveries.emptyRetrieved')}</Text>
              <Text style={styles.statBoxValue}>{item.emptyUnitsCollected || 0}</Text>
            </View>
          </View>

          {item.status === 'delivered' && (
            <View style={styles.billingRow}>
              {item.isInvoiced ? (
                <View style={styles.billedBadge}>
                  <CheckCircle2 size={14} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={styles.billedText}>{t('customerDetail.unbilled')}</Text>
                  {/* Note: I should fix the translation key here if it says 'unbilled' for invoiced, but maintaining existing code behavior first */}
                </View>
              ) : (
                <View style={styles.unbilledBadge}>
                  <Clock size={14} color="#F59E0B" style={{ marginRight: 4 }} />
                  <Text style={styles.unbilledText}>{t('customerDetail.unbilled')} • ₹{item.estimatedAmount || 0}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderJarItem = ({ item }) => {
    // Calculate net change for this event
    const netJars = (item.fullUnitsDelivered || 0) - (item.emptyUnitsCollected || 0);
    const netText = netJars > 0 ? `+${netJars} Jars Out` : netJars < 0 ? `${netJars} Jars Returned` : 'Balanced (0)';
    const netColor = netJars > 0 ? '#EF4444' : netJars < 0 ? '#10B981' : '#64748B';
    const netBg = netJars > 0 ? '#FEF2F2' : netJars < 0 ? '#ECFDF5' : '#F1F5F9';

    return (
      <View style={[styles.historyCard, { borderLeftColor: '#0EA5E9' }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>{formatDate(item.deliveryDate || item.date)}</Text>
          <View style={[styles.jarsOutBadge, { backgroundColor: netBg }]}>
            <Text style={[styles.jarsOutText, { color: netColor }]}>{netText}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.productRow}>
            <Package size={16} color="#64748B" />
            <Text style={styles.productName}>{item.product?.name || 'N/A'}</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>{t('deliveries.delivered')}</Text>
              <Text style={styles.statBoxValue}>{item.fullUnitsDelivered || 0}</Text>
            </View>
            <View style={styles.statBoxDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>{t('deliveries.emptyRetrieved')}</Text>
              <Text style={styles.statBoxValue}>{item.emptyUnitsCollected || 0}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CurvedHeader
        title={t('customerDetail.viewHistory')}
        leftIcon={<ArrowLeft size={24} color="#FFFFFF" />}
        onLeftPress={() => navigation.goBack()}
        height={130}
        contentStyle={{ paddingTop: Platform.OS === 'ios' ? 40 : 20, paddingBottom: 25 }}
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'deliveries' && styles.activeTab]}
          onPress={() => setActiveTab('deliveries')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'deliveries' && styles.activeTabText]}>
            {t('deliveries.title')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'jars' && styles.activeTab]}
          onPress={() => setActiveTab('jars')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'jars' && styles.activeTabText]}>
            {t('deliveries.emptyJars')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Area */}
      {!loading && activeTab === 'deliveries' && deliveriesSummary && (
        <LinearGradient
          colors={['#0F4499', '#0A3172']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconBox}>
                <Droplets size={20} color="#60A5FA" />
              </View>
              <View>
                <Text style={styles.summaryLabelLight}>{t('deliveries.delivered')}</Text>
                <Text style={styles.summaryValueLight}>{deliveriesSummary.totalUnitsDelivered || 0}</Text>
              </View>
            </View>
            <View style={styles.summaryItemDivider} />
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconBox}>
                <IndianRupee size={20} color="#FBBF24" />
              </View>
              <View>
                <Text style={styles.summaryLabelLight}>{t('customerDetail.unbilled')}</Text>
                <Text style={[styles.summaryValueLight, { color: '#FCD34D' }]}>₹{deliveriesSummary.estimatedUnbilledAmount || 0}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      )}

      {!loading && activeTab === 'jars' && jarsSummary && (
        <LinearGradient
          colors={['#0F4499', '#0A3172']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconBox}>
                <Package size={20} color="#60A5FA" />
              </View>
              <View>
                <Text style={styles.summaryLabelLight}>{t('customerDetail.currentlyWithCustomer')}</Text>
                <Text style={styles.summaryValueLight}>{jarsSummary.jarsCurrentlyOut || 0} Jars</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      )}

      {/* List Area */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : activeTab === 'deliveries' ? (
        <FlatList
          data={deliveries}
          keyExtractor={(item, index) => item.id || String(index)}
          renderItem={renderDeliveryItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Truck size={48} color="#CBD5E1" strokeWidth={1.5} />
              <Text style={styles.emptyText}>{t('deliveries.noDeliveriesFound')}</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={jarCollections}
          keyExtractor={(item, index) => String(index)}
          renderItem={renderJarItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package size={48} color="#CBD5E1" strokeWidth={1.5} />
              <Text style={styles.emptyText}>No jar history found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9', // Premium light background
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16, // Fixed overlap issue
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 6,
    // Soft shadow for segmented control
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#0F4499',
    shadowColor: '#0F4499',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Rubik-SemiBold',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontFamily: 'Rubik-Bold',
  },
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0A3172',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryItemDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
  summaryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabelLight: {
    fontSize: 12,
    color: '#93C5FD',
    fontFamily: 'Rubik-Medium',
    marginBottom: 4,
  },
  summaryValueLight: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Rubik-Bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 5, // Thick premium left border
    borderStyle: 'solid',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dateText: {
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    color: '#1E293B',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Rubik-Bold',
    letterSpacing: 0.5,
  },
  jarsOutBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  jarsOutText: {
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
    color: '#3B82F6',
  },
  cardBody: {
    gap: 12,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Rubik-Medium',
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statBoxDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  statBoxLabel: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'Rubik-Medium',
  },
  statBoxValue: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: 'Rubik-Bold',
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  billedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  billedText: {
    fontSize: 12,
    color: '#10B981',
    fontFamily: 'Rubik-SemiBold',
  },
  unbilledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unbilledText: {
    fontSize: 12,
    color: '#F59E0B',
    fontFamily: 'Rubik-SemiBold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontFamily: 'Rubik-SemiBold',
    fontSize: 15,
  }
});

export default CustomerHistoryScreen;
