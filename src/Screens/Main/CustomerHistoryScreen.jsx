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
import { ChevronLeft, Package, Clock, CheckCircle2, XCircle, FileText } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

const CustomerHistoryScreen = ({ route, navigation }) => {
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
          setJarCollections(res.data.collections || []);
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

  const renderDeliveryItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{formatDate(item.deliveryDate)}</Text>
        <View style={[styles.statusBadge, 
          item.status === 'delivered' ? { backgroundColor: '#ECFDF5' } :
          item.status === 'skipped' ? { backgroundColor: '#FEF2F2' } :
          { backgroundColor: '#FFFBEB' }
        ]}>
          <Text style={[styles.statusText,
            item.status === 'delivered' ? { color: '#10B981' } :
            item.status === 'skipped' ? { color: '#EF4444' } :
            { color: '#B45309' }
          ]}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.row}>
          <Text style={styles.label}>Product:</Text>
          <Text style={styles.value}>{item.product?.name || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Delivered:</Text>
          <Text style={styles.value}>{item.fullUnitsDelivered || 0}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Empty Retrieved:</Text>
          <Text style={styles.value}>{item.emptyUnitsCollected || 0}</Text>
        </View>
        {item.status === 'delivered' && (
          <View style={styles.billingRow}>
            {item.isInvoiced ? (
              <View style={styles.billedBadge}>
                <CheckCircle2 size={12} color="#10B981" style={{marginRight: 4}} />
                <Text style={styles.billedText}>Billed</Text>
              </View>
            ) : (
              <View style={styles.unbilledBadge}>
                <Clock size={12} color="#F59E0B" style={{marginRight: 4}} />
                <Text style={styles.unbilledText}>Unbilled - ₹{item.estimatedAmount || 0}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );

  const renderJarItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{formatDate(item.date)}</Text>
        <View style={styles.jarsOutBadge}>
          <Text style={styles.jarsOutText}>{item.runningJarsOut} Jars Out</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.row}>
          <Text style={styles.label}>Product:</Text>
          <Text style={styles.value}>{item.product?.name || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Delivered (Full):</Text>
          <Text style={styles.value}>{item.fullUnitsDelivered || 0}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Collected (Empty):</Text>
          <Text style={styles.value}>{item.emptyUnitsCollected || 0}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <CurvedHeader
        title={
          <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: '#FFF', fontSize: 20, fontFamily: 'Geologica-Bold' }}>
            Customer History
          </Text>
        }
        leftIcon={<ChevronLeft size={28} color="#FFF" />}
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
            Deliveries
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'jars' && styles.activeTab]}
          onPress={() => setActiveTab('jars')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'jars' && styles.activeTabText]}>
            Jar Collections
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Area */}
      {!loading && activeTab === 'deliveries' && deliveriesSummary && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Delivered</Text>
              <Text style={styles.summaryValue}>{deliveriesSummary.totalUnitsDelivered || 0}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pending Bill</Text>
              <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>₹{deliveriesSummary.estimatedUnbilledAmount || 0}</Text>
            </View>
          </View>
        </View>
      )}

      {!loading && activeTab === 'jars' && jarsSummary && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Currently With Customer</Text>
              <Text style={[styles.summaryValue, { color: COLORS.primary }]}>{jarsSummary.jarsCurrentlyOut || 0} Jars</Text>
            </View>
          </View>
        </View>
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
            <Text style={styles.emptyText}>No deliveries found in this period.</Text>
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
            <Text style={styles.emptyText}>No jar collections found.</Text>
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
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Geologica-Medium',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Geologica-Regular',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    color: '#1E293B',
    fontFamily: 'Geologica-Bold',
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: '#334155',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Geologica-Bold',
  },
  jarsOutBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  jarsOutText: {
    fontSize: 10,
    fontFamily: 'Geologica-Bold',
    color: '#3B82F6',
  },
  cardBody: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Geologica-Regular',
  },
  value: {
    fontSize: 13,
    color: '#334155',
    fontFamily: 'Geologica-Medium',
  },
  billingRow: {
    marginTop: 8,
    flexDirection: 'row',
  },
  billedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  billedText: {
    fontSize: 11,
    color: '#10B981',
    fontFamily: 'Geologica-Medium',
  },
  unbilledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  unbilledText: {
    fontSize: 11,
    color: '#F59E0B',
    fontFamily: 'Geologica-Medium',
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontFamily: 'Geologica-Medium',
    marginTop: 40,
  }
});

export default CustomerHistoryScreen;
