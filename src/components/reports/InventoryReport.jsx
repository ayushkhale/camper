import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { Package, ArrowUpRight, ArrowDownRight, PackageCheck, AlertTriangle } from 'lucide-react-native';
import { api } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../constants/colors';

const InventoryReport = ({ filters }) => {
  const { userToken } = useContext(AuthContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getInventoryReports(userToken, filters);
      if (res.success && res.data && res.data.inventory) {
        setData(res.data.inventory);
      } else {
        setError(res.message || 'Failed to load inventory data');
      }
    } catch (err) {
      setError('An error occurred while fetching data');
      console.log('Inventory report error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderInventoryItem = ({ item }) => {
    const isNetPositive = item.netChangeInRange > 0;
    const isNetNegative = item.netChangeInRange < 0;
    const isHighRisk = item.cumulativeOutstanding >= 5;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{item.customerName}</Text>
            {item.customerPhone ? <Text style={styles.subText}>{item.customerPhone}</Text> : null}
            <Text style={styles.routeBadge}>{item.routeName} • {item.staffName}</Text>
          </View>

          <View style={[styles.outstandingBadge, isHighRisk && styles.highRiskBadge]}>
            {isHighRisk && <AlertTriangle size={14} color="#B45309" style={{marginRight: 4}} />}
            <Text style={[styles.outstandingLabel, isHighRisk && { color: '#B45309' }]}>Outstanding Jars</Text>
            <Text style={[styles.outstandingAmount, isHighRisk && { color: '#92400E' }]}>{item.cumulativeOutstanding}</Text>
          </View>
        </View>

        <View style={styles.flowContainer}>
          <View style={styles.flowItem}>
            <Text style={styles.flowLabel}>Delivered</Text>
            <View style={styles.flowValueRow}>
              <ArrowUpRight size={14} color="#EF4444" />
              <Text style={styles.flowValue}>{item.deliveredInRange}</Text>
            </View>
          </View>
          
          <View style={styles.flowDivider} />
          
          <View style={styles.flowItem}>
            <Text style={styles.flowLabel}>Returned</Text>
            <View style={styles.flowValueRow}>
              <ArrowDownRight size={14} color="#10B981" />
              <Text style={styles.flowValue}>{item.returnedInRange}</Text>
            </View>
          </View>

          <View style={styles.flowDivider} />

          <View style={[styles.flowItem, { backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8 }]}>
            <Text style={styles.flowLabel}>Net Change</Text>
            <Text style={[
              styles.netValue, 
              isNetPositive && { color: '#EF4444' }, // Red if client accumulated more jars
              isNetNegative && { color: '#10B981' }  // Green if client returned more jars
            ]}>
              {isNetPositive ? '+' : ''}{item.netChangeInRange}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <PackageCheck size={48} color="#CBD5E1" style={{marginBottom: 16}} />
        <Text style={styles.emptyTitle}>No Inventory Changes</Text>
        <Text style={styles.emptySubtitle}>No jar deliveries or returns recorded for the selected period.</Text>
      </View>
    );
  }

  const totalOutstanding = data.reduce((acc, curr) => acc + (curr.cumulativeOutstanding || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Package size={24} color="#B45309" />
        <View style={{marginLeft: 12}}>
          <Text style={styles.headerTitle}>Total Outstanding Empty Jars</Text>
          <Text style={styles.headerAmount}>{totalOutstanding}</Text>
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.customerId)}
        renderItem={renderInventoryItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
    padding: 20,
  },
  errorText: {
    fontFamily: 'Geologica-Medium',
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Geologica-SemiBold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Geologica-Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  header: {
    backgroundColor: '#FFFBEB',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: '#92400E',
    textTransform: 'uppercase',
  },
  headerAmount: {
    fontSize: 24,
    fontFamily: 'Geologica-Bold',
    color: '#B45309',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  customerInfo: {
    flex: 1,
    paddingRight: 16,
  },
  customerName: {
    fontSize: 17,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  subText: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  routeBadge: {
    fontSize: 11,
    fontFamily: 'Geologica-SemiBold',
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  outstandingBadge: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 95,
  },
  highRiskBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
  },
  outstandingLabel: {
    fontSize: 10,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  outstandingAmount: {
    fontSize: 18,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  flowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  flowItem: {
    flex: 1,
    alignItems: 'center',
  },
  flowDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  flowLabel: {
    fontSize: 11,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPlaceholder,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  flowValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flowValue: {
    fontSize: 16,
    fontFamily: 'Geologica-SemiBold',
    color: COLORS.textPrimary,
    marginLeft: 4,
  },
  netValue: {
    fontSize: 16,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textSecondary, // default gray
  }
});

export default InventoryReport;
