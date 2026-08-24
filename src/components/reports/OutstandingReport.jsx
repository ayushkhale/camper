import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TextInput } from 'react-native';
import { MapPin, Phone, User, AlertCircle, Search } from 'lucide-react-native';
import { api } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../constants/colors';
import { useTranslation } from 'react-i18next';

const OutstandingReport = ({ filters }) => {
  const { t } = useTranslation();
  const { userToken } = useContext(AuthContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [filters.routeId, filters.staffId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Exclude date filters for Outstanding
      const payload = {};
      if (filters.routeId) payload.routeId = filters.routeId;
      if (filters.staffId) payload.staffId = filters.staffId;

      const res = await api.getOutstandingReports(userToken, payload);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load outstanding data');
      }
    } catch (err) {
      setError('An error occurred while fetching data');
      console.log('Outstanding report error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderCustomerItem = ({ item }) => (
    <View style={styles.customerCard}>
      <View style={styles.cardHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          {item.phone ? (
            <View style={styles.subInfoRow}>
              <Phone size={12} color={COLORS.textPlaceholder} style={styles.subIcon} />
              <Text style={styles.subText}>{item.phone}</Text>
            </View>
          ) : null}
          {item.address ? (
            <View style={styles.subInfoRow}>
              <MapPin size={12} color={COLORS.textPlaceholder} style={styles.subIcon} />
              <Text style={styles.subText} numberOfLines={1}>{item.address}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>{t('reports.owes') || 'Owes'}</Text>
          <Text style={styles.balanceAmount}>₹{Number(item.currentBalance).toLocaleString()}</Text>
        </View>
      </View>
      
      {item.Route?.name && (
        <View style={styles.routeBadge}>
          <Text style={styles.routeBadgeText}>{item.Route.name}</Text>
        </View>
      )}
    </View>
  );

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
        <AlertCircle size={48} color="#CBD5E1" style={{marginBottom: 16}} />
        <Text style={styles.emptyTitle}>{t('reports.allClear') || 'All Clear!'}</Text>
        <Text style={styles.emptySubtitle}>{t('reports.noCustomersOwe') || 'No customers currently owe money based on the selected filters.'}</Text>
      </View>
    );
  }

  const totalOutstanding = data.reduce((acc, curr) => acc + Number(curr.currentBalance || 0), 0);

  const topDebtors = [...data]
    .sort((a, b) => Number(b.currentBalance || 0) - Number(a.currentBalance || 0))
    .slice(0, 5);

  const chartData = topDebtors.map(item => ({
    value: Number(item.currentBalance),
    label: item.name.split(' ')[0].substring(0, 8),
    frontColor: '#EF4444',
    topLabelComponent: () => <Text style={{ color: '#991B1B', fontSize: 10, marginBottom: 2 }}>₹{Number(item.currentBalance)}</Text>,
  }));

  const chartMax = chartData.length > 0 ? Math.max(...chartData.map(d => d.value)) : 100;

  const renderHorizontalBar = (item) => {
    const percentage = chartMax > 0 ? (item.value / chartMax) * 100 : 0;
    return (
      <View key={item.label} style={styles.customBarContainer}>
        <View style={[styles.customBarFill, { width: `${percentage}%` }]} />
        <View style={styles.customBarContent}>
          <Text style={styles.customBarLabel} numberOfLines={1}>{item.label}</Text>
          <Text style={styles.customBarValue}>₹{item.value}</Text>
        </View>
      </View>
    );
  };

  const filteredData = data.filter(item => 
    item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomerItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{t('reports.totalOutstandingDebt') || 'Total Outstanding Debt'}</Text>
              <Text style={styles.headerAmount}>₹{totalOutstanding.toLocaleString()}</Text>
            </View>

            {chartData.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>{t('reports.topDebtors') || 'Top Debtors'}</Text>
                <View style={{ marginTop: 10 }}>
                  {chartData.map(renderHorizontalBar)}
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
    backgroundColor: '#FFF1F2', // Rose soft
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontFamily: 'Rubik-SemiBold',
    color: '#BE123C', // Rose 700
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerAmount: {
    fontSize: 28,
    fontFamily: 'Rubik-Bold',
    color: '#E11D48', // Rose 600
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
    height: 44,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#FFE4E6', // soft rose track
    borderRightWidth: 3,
    borderRightColor: '#E11D48', // solid rose edge
  },
  customBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    zIndex: 1,
  },
  customBarLabel: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 14,
    color: '#1E293B',
    flex: 1,
    marginRight: 10,
  },
  customBarValue: {
    fontFamily: 'Rubik-Bold',
    fontSize: 14,
    color: '#BE123C', // darker rose for text
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
  customerCard: {
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
    borderLeftColor: '#E11D48',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerInfo: {
    flex: 1,
    paddingRight: 16,
  },
  customerName: {
    fontSize: 17,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  subIcon: {
    marginRight: 8,
  },
  subText: {
    fontSize: 13,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  balanceContainer: {
    alignItems: 'flex-end',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  balanceLabel: {
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
    color: '#E11D48',
    textTransform: 'uppercase',
  },
  balanceAmount: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    color: '#BE123C',
    marginTop: 2,
  },
  routeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  routeBadgeText: {
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
    color: '#475569',
  }
});

export default OutstandingReport;
