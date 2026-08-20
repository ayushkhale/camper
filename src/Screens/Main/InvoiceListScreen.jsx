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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { Plus, Search, FileText, ChevronRight, AlertCircle, RefreshCw, Calendar, DollarSign, ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import CurvedHeader from '../../components/CurvedHeader';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

const InvoiceListScreen = () => {
  const navigation = useNavigation();
  const { userToken, user } = useContext(AuthContext);
  const { t } = useTranslation();

  const [invoices, setInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const route = useRoute();
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, partially_paid, paid

  React.useEffect(() => {
    if (route.params?.searchQuery) {
      setSearchQuery(route.params.searchQuery);
    }
  }, [route.params?.searchQuery]);

  const fetchInvoices = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await api.listInvoices(userToken);
      console.log('--- InvoiceListScreen: fetchInvoices Response ---', JSON.stringify(res, null, 2));
      if (res && res.success) {
        setInvoices(res.data || []);
      } else {
        throw new Error(res.message || 'Failed to fetch invoices');
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchInvoices(true);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvoices(false);
  };

  const getStatusColors = (status) => {
    switch (status) {
      case 'paid': return { dot: '#16A34A', text: '#15803D' };
      case 'partially_paid': return { dot: '#3B82F6', text: '#1D4ED8' }; // Blue
      case 'pending': return { dot: '#D97706', text: '#B45309' }; // Orange
      default: return { dot: '#94A3B8', text: '#64748B' };
    }
  };

  const filteredInvoices = invoices.filter((item) => {
    // 1. Status Filter
    if (filterStatus !== 'all' && item.status !== filterStatus) {
      return false;
    }
    // 2. Search Query Filter
    const query = searchQuery.toLowerCase();
    const customerMatch = item.Customer?.name?.toLowerCase().includes(query);
    const idMatch = item.id?.toLowerCase().includes(query);
    return customerMatch || idMatch;
  });

  const renderInvoiceCard = ({ item }) => {
    const statusColors = getStatusColors(item.status);
    const dateFormatted = item.created_at ? new Date(item.created_at).toLocaleDateString() : '';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.id, invoice: item })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <FileText size={22} color={COLORS.primary} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.Customer?.name || 'Unknown Customer'}
            </Text>
            <Text style={styles.subText} numberOfLines={1}>
              {item.periodStart} to {item.periodEnd}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: statusColors.dot }]} />
            <Text style={[styles.statusText, { color: statusColors.text, textAlign: 'right', fontSize: 9, lineHeight: 11 }]}>
              {item.status === 'partially_paid' ? 'PARTIALLY\nPAID' : (item.status || 'pending').replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.metaContainer}>
            <Calendar size={14} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.metaText} numberOfLines={1}>
              {dateFormatted}
            </Text>
          </View>
          <View style={styles.amountContainer}>
            {parseFloat(item.previousDues || 0) > 0 ? (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.paidSubText, { color: '#64748B', marginBottom: 2 }]}>
                  Prev. Due: ₹{parseFloat(item.previousDues).toFixed(2)}
                </Text>
                <Text style={[styles.paidSubText, { color: '#64748B', marginBottom: 4 }]}>
                  Current: ₹{parseFloat(item.totalAmount || 0).toFixed(2)}
                </Text>
                <Text style={[styles.amountText, { color: COLORS.primary }]}>
                  Total: ₹{(parseFloat(item.previousDues || 0) + parseFloat(item.totalAmount || 0)).toFixed(2)}
                </Text>
              </View>
            ) : (
              <Text style={styles.amountText}>
                ₹{parseFloat(item.totalAmount || 0).toFixed(2)}
              </Text>
            )}
            {item.status !== 'paid' && parseFloat(item.amountPaid || 0) > 0 && (
              <Text style={[styles.paidSubText, { marginTop: 4 }]}>
                Paid: ₹{parseFloat(item.amountPaid).toFixed(2)}
              </Text>
            )}
          </View>
          <ChevronRight size={18} color={COLORS.textPlaceholder} style={{ marginLeft: 8 }} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <CurvedHeader
        title={<Text style={{ color: '#FFF', fontSize: 20, fontFamily: 'Geologica-Bold' }}>{t('invoices.title')}</Text>}
        leftIcon={<ChevronLeft size={28} color="#FFF" />}
        onLeftPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.openDrawer?.()}
        height={140}
        contentStyle={{ paddingTop: Platform.OS === 'ios' ? 40 : 20, paddingBottom: 25 }}
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

        {/* Status Filter Chips */}
        <View style={styles.filterContainer}>
          {['all', 'pending', 'partially_paid', 'paid'].map(status => (
            <TouchableOpacity
              key={status}
              style={[styles.filterTab, filterStatus === status && styles.filterTabActive]}
              onPress={() => setFilterStatus(status)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterTabText, filterStatus === status && styles.filterTabTextActive]}>
                {status === 'partially_paid' ? 'PARTIALLY' : status.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
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
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchInvoices(true)}>
              <RefreshCw size={16} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredInvoices}
            keyExtractor={(item) => item.id || Math.random().toString()}
            renderItem={renderInvoiceCard}
            contentContainerStyle={
              filteredInvoices.length === 0 ? styles.emptyListContent : styles.listContent
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
                <FileText size={48} color={COLORS.textPlaceholder} style={{ marginBottom: 16 }} />
                <Text style={styles.emptyTitle}>{t('invoices.noInvoicesFound')}</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery || filterStatus !== 'all'
                    ? t('customers.noCustomersSearch')
                    : t('invoices.noInvoicesFound')}
                </Text>
                {!searchQuery && filterStatus === 'all' && user?.role !== 'staff' && (
                  <TouchableOpacity
                    style={styles.emptyAddBtn}
                    onPress={() => navigation.navigate('GenerateInvoice')}
                  >
                    <Plus size={18} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.emptyAddBtnText}>{t('invoices.generateInvoices')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </View>

      {!loading && !error && user?.role !== 'staff' && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('GenerateInvoice')}
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
    fontFamily: 'Geologica-Medium',
    fontSize: 15,
    paddingVertical: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.border,
  },
  filterTabText: {
    fontSize: 10,
    fontFamily: 'Geologica-Bold',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  filterTabTextActive: {
    color: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
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
  subText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Geologica-Bold',
    fontWeight: 'bold',
    marginTop: 4,
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
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 15,
    fontFamily: 'Geologica-Bold',
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  paidSubText: {
    fontSize: 11,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
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
    fontSize: 10,
    fontFamily: 'Geologica-Bold',
    fontWeight: 'bold',
    letterSpacing: 0.5,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: 'Geologica-Bold',
    fontSize: 15,
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
    marginBottom: 24,
    fontFamily: 'Geologica-Medium',
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
    fontFamily: 'Geologica-Bold',
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

export default InvoiceListScreen;
