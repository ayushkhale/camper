import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TextInput } from 'react-native';
import { Package, ArrowUpRight, ArrowDownRight, PackageCheck, AlertTriangle, Search } from 'lucide-react-native';
import { api } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../constants/colors';
import { useTranslation } from 'react-i18next';

const InventoryReport = ({ filters }) => {
  const { t } = useTranslation();
  const { userToken } = useContext(AuthContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
            <View style={{ gap: 4, marginTop: 4 }}>
              <Text style={styles.routeBadge}>Route: {item.routeName || 'Unassigned'}</Text>
              <Text style={[styles.routeBadge, { backgroundColor: '#F1F5F9', color: '#475569' }]}>Staff: {item.staffName || 'Unassigned'}</Text>
            </View>
          </View>

          <View style={[styles.outstandingBadge, isHighRisk && styles.highRiskBadge]}>
            {isHighRisk && <AlertTriangle size={14} color="#B45309" style={{marginRight: 4}} />}
            <Text style={[styles.outstandingLabel, isHighRisk && { color: '#B45309' }]}>{t('reports.outstandingJars') || 'Outstanding Jars'}</Text>
            <Text style={[styles.outstandingAmount, isHighRisk && { color: '#92400E' }]}>{item.cumulativeOutstanding}</Text>
          </View>
        </View>

        <View style={styles.flowContainer}>
          <View style={styles.flowItem}>
            <Text style={styles.flowLabel}>{t('reports.delivered') || 'Delivered'}</Text>
            <View style={styles.flowValueRow}>
              <ArrowUpRight size={14} color="#0284C7" />
              <Text style={[styles.flowValue, { color: '#0369A1' }]}>{item.deliveredInRange}</Text>
            </View>
          </View>
          
          <View style={styles.flowDivider} />
          
          <View style={styles.flowItem}>
            <Text style={styles.flowLabel}>{t('reports.returned') || 'Returned'}</Text>
            <View style={styles.flowValueRow}>
              <ArrowDownRight size={14} color="#059669" />
              <Text style={[styles.flowValue, { color: '#047857' }]}>{item.returnedInRange}</Text>
            </View>
          </View>

          <View style={styles.flowDivider} />

          <View style={[styles.flowItem, { backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8 }]}>
            <Text style={styles.flowLabel}>{t('reports.netChange') || 'Net Change'}</Text>
            <Text style={[
              styles.netValue, 
              isNetPositive && { color: '#0284C7' },
              isNetNegative && { color: '#059669' }
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
        <Text style={styles.emptyTitle}>{t('reports.noInventoryChanges') || 'No Inventory Changes'}</Text>
        <Text style={styles.emptySubtitle}>{t('reports.noJarChanges') || 'No jar deliveries or returns recorded for the selected period.'}</Text>
      </View>
    );
  }

  const totalOutstanding = data.reduce((acc, curr) => acc + (curr.cumulativeOutstanding || 0), 0);

  const topMovers = [...data]
    .sort((a, b) => (Number(b.deliveredInRange) + Number(b.returnedInRange)) - (Number(a.deliveredInRange) + Number(a.returnedInRange)))
    .slice(0, 4);

  const renderRatioBar = (item) => {
    const delivered = Number(item.deliveredInRange) || 0;
    const returned = Number(item.returnedInRange) || 0;
    const total = delivered + returned;
    
    // Default to 50/50 if both are 0, though topMovers usually won't have 0 total
    const delPercent = total > 0 ? (delivered / total) * 100 : 50;
    const retPercent = total > 0 ? (returned / total) * 100 : 50;

    return (
      <View key={String(item.customerId)} style={styles.customBarContainer}>
        <View style={styles.customBarContent}>
          <Text style={styles.customBarLabel} numberOfLines={1}>{item.customerName}</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: '#0369A1', fontFamily: 'Rubik-Medium', fontSize: 11 }}>{t('reports.delivered') || 'Delivered'}:</Text>
              <Text style={{ color: '#0284C7', fontFamily: 'Rubik-Bold', fontSize: 13 }}>{delivered}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: '#047857', fontFamily: 'Rubik-Medium', fontSize: 11 }}>{t('reports.returned') || 'Returned'}:</Text>
              <Text style={{ color: '#059669', fontFamily: 'Rubik-Bold', fontSize: 13 }}>{returned}</Text>
            </View>
          </View>
        </View>
        <View style={styles.ratioBarTrack}>
          {delivered > 0 && <View style={[styles.ratioBarFill, { width: `${delPercent}%`, backgroundColor: '#0284C7' }]} />}
          {returned > 0 && <View style={[styles.ratioBarFill, { width: `${retPercent}%`, backgroundColor: '#059669' }]} />}
        </View>
      </View>
    );
  };

  const filteredData = data.filter(item => 
    item.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredData}
        keyExtractor={(item) => String(item.customerId)}
        renderItem={renderInventoryItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Package size={24} color="#B45309" />
              <View style={{marginLeft: 12}}>
                <Text style={styles.headerTitle}>{t('reports.totalOutstandingJars') || 'Total Outstanding Empty Jars'}</Text>
                <Text style={styles.headerAmount}>{totalOutstanding}</Text>
              </View>
            </View>

            {topMovers.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>{t('reports.topInventoryMovers') || 'Top Inventory Movers'}</Text>
                <View style={{ marginTop: 10 }}>
                  {topMovers.map(renderRatioBar)}
                </View>
              </View>
            )}

            <View style={styles.listHeaderRow}>
              <Text style={styles.listSectionTitle}>{t('reports.detailedList') || 'Detailed List'}</Text>
            </View>

            <View style={styles.searchContainer}>
              <Search size={18} color={COLORS.textPlaceholder} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('reports.searchCustomers') || 'Search customers...'}
                placeholderTextColor={COLORS.textPlaceholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            
            {filteredData.length === 0 && searchQuery !== '' && (
              <Text style={styles.emptySearchText}>{t('reports.noCustomersFound') || 'No customers found matching'} "{searchQuery}"</Text>
            )}
          </>
        }
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
    fontFamily: 'Rubik-SemiBold',
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
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
    fontFamily: 'Rubik-SemiBold',
    color: '#92400E',
    textTransform: 'uppercase',
  },
  headerAmount: {
    fontSize: 24,
    fontFamily: 'Rubik-Bold',
    color: '#B45309',
  },
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  customBarContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  customBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  customBarLabel: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 14,
    color: '#1E293B',
    flex: 1,
    marginRight: 10,
  },
  ratioBarTrack: {
    flexDirection: 'row',
    height: 6,
    width: '100%',
    backgroundColor: '#E2E8F0',
  },
  ratioBarFill: {
    height: '100%',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  listSectionTitle: {
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: COLORS.textPrimary,
    height: '100%',
  },
  emptySearchText: {
    textAlign: 'center',
    fontFamily: 'Rubik-Regular',
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 10,
    marginBottom: 20,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
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
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  subText: {
    fontSize: 13,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  routeBadge: {
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  outstandingAmount: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-SemiBold',
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
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
    marginLeft: 4,
  },
  netValue: {
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textSecondary, // default gray
  }
});

export default InventoryReport;
