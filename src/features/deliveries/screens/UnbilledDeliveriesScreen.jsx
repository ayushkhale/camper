import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { FileText, Menu, User, Phone, Package, Calendar, ArrowRight, Search } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import CurvedHeader from '../../../shared/components/CurvedHeader';
import { AuthContext } from '../../../app/providers/AuthContext';
import { useAlert } from '../../../app/providers/AlertContext';
import { api } from '../../../shared/services/api';
import { toLocalDateString, validateInvoicePeriod } from '../../../shared/utils/billing';
import { COLORS } from '../../../shared/constants/colors';

const CustomerCard = ({
  item,
  handleGenerateInvoice,
  handleCustomerPress,
  handleLowerSectionPress,
  user,
  generatingForId,
  t,
}) => {
  const getInitialEndDate = () => {
    const startStr = String(item.earliestDeliveryDate || toLocalDateString()).split('T')[0];
    const parts = startStr.split('-');
    if (parts.length === 3) {
      const endOfMonth = new Date(parseInt(parts[0]), parseInt(parts[1]), 0);
      const yyyy = endOfMonth.getFullYear();
      const mm = String(endOfMonth.getMonth() + 1).padStart(2, '0');
      const dd = String(endOfMonth.getDate()).padStart(2, '0');
      const monthEnd = `${yyyy}-${mm}-${dd}`;
      return monthEnd > toLocalDateString() ? toLocalDateString() : monthEnd;
    }
    return toLocalDateString();
  };

  const [periodStart, setPeriodStart] = useState(() => {
    const candidate = String(item.earliestDeliveryDate || toLocalDateString()).split('T')[0];
    return candidate < '2020-01-01' ? '2020-01-01' : candidate > toLocalDateString() ? toLocalDateString() : candidate;
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    const candidate = getInitialEndDate();
    return candidate < '2020-01-01' ? '2020-01-01' : candidate;
  });

  const calculateDerivedStats = () => {
    let total = 0;
    let count = 0;
    if (!item.deliveries || !Array.isArray(item.deliveries)) {
      return { total: item.estimatedTotal || 0, count: item.uninvoicedDeliveries || 0 };
    }
    const pStart = new Date(periodStart);
    const pEnd = new Date(periodEnd);
    pStart.setHours(0, 0, 0, 0);
    pEnd.setHours(23, 59, 59, 999);

    item.deliveries.forEach(d => {
      const dDate = new Date(d.deliveryDate);
      if (dDate >= pStart && dDate <= pEnd) {
        total += Number(d.estimatedAmount || 0);
        count += 1;
      }
    });
    return { total, count };
  };

  const { total: calcTotal, count: calcCount } = calculateDerivedStats();
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const formatDateString = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const parseDateString = (str) => {
    if (!str) return new Date();
    const parts = str.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return new Date();
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => handleCustomerPress(item.customerId)}
        activeOpacity={0.75}
        accessibilityRole="button"
      >
        <View style={styles.customerInfoContainer}>
          <View style={[styles.avatarBox, { backgroundColor: '#F0F9FF' }]}>
            <User size={20} color="#0EA5E9" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName} numberOfLines={1}>{item.customerName}</Text>
            <View style={styles.phoneRow}>
              <Phone size={12} color={COLORS.textSecondary} style={{marginRight: 4}} />
              <Text style={styles.customerPhone}>{item.customerPhone || 'No Phone'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>{t('invoices.estimatedTotal')}</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountValue}>₹{Number(calcTotal).toFixed(2)}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cardStats}
        onPress={handleLowerSectionPress}
        activeOpacity={0.75}
        accessibilityRole="button"
      >
        <View style={styles.statRow}>
          <View style={styles.iconWrapperSmall}>
            <Package size={14} color={COLORS.primary} />
          </View>
          <Text style={styles.statValueText}>{calcCount} {t('deliveries.title') || 'Deliveries'}</Text>
        </View>
        
        <View style={styles.statRow}>
          <View style={[styles.iconWrapperSmall, { backgroundColor: '#F8FAFC' }]}>
            <Calendar size={14} color="#64748B" />
          </View>
          <View style={styles.dateTextContainer}>
            <TouchableOpacity onPress={() => setShowStartPicker(true)}>
                <Text style={[styles.dateText, { textDecorationLine: 'underline', color: COLORS.primary }]}>{periodStart}</Text>
            </TouchableOpacity>
            
            <ArrowRight size={14} color="#CBD5E1" style={{marginHorizontal: 8}} />
            
            <TouchableOpacity onPress={() => setShowEndPicker(true)}>
                <Text style={[styles.dateText, { textDecorationLine: 'underline', color: COLORS.primary }]}>{periodEnd}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {showStartPicker && (
        <DateTimePicker
          value={parseDateString(periodStart)}
          mode="date"
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (date) {
              const nextStart = formatDateString(date);
              setPeriodStart(nextStart);
              if (periodEnd < nextStart) setPeriodEnd(nextStart);
            }
          }}
          minimumDate={new Date(2020, 0, 1)}
          maximumDate={new Date()}
        />
      )}
      
      {showEndPicker && (
        <DateTimePicker
          value={parseDateString(periodEnd)}
          mode="date"
          minimumDate={parseDateString(periodStart)}
          maximumDate={new Date()}
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (date) setPeriodEnd(formatDateString(date));
          }}
        />
      )}

      <View style={styles.cardActions}>
        {user?.role !== 'staff' && (
          <TouchableOpacity 
            style={styles.generateButton}
            onPress={() => handleGenerateInvoice(item.customerId, periodStart, periodEnd)}
            disabled={generatingForId === item.customerId}
            activeOpacity={0.8}
          >
            {generatingForId === item.customerId ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <FileText size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.generateButtonText}>{t('invoices.generateInvoices')}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const UnbilledDeliveriesScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { userToken, user } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summaryData, setSummaryData] = useState([]);
  const [generatingForId, setGeneratingForId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSummaryData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return summaryData;

    return summaryData.filter(item =>
      String(item.customerName || '').toLowerCase().includes(query)
      || String(item.customerPhone || '').toLowerCase().includes(query)
    );
  }, [searchQuery, summaryData]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await api.getUninvoicedSummary(userToken);
      if (response.success && response.data) {
        setSummaryData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch uninvoiced summary:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userToken]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  const handleGenerateInvoice = async (customerId, periodStart, periodEnd) => {
    const periodError = validateInvoicePeriod(periodStart, periodEnd);
    if (periodError) {
      showAlert(t('common.error'), t(`invoices.${periodError}`), 'error');
      return;
    }
    showAlert(
      t('invoices.generateInvoice'),
      t('invoices.generateConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('deliveries.generate'),
          style: 'default',
          onPress: async () => {
            try {
              setGeneratingForId(customerId);
              const payload = { customerId, periodStart, periodEnd };
              const res = await api.generateInvoices(userToken, payload);
              if (!res?.success) throw new Error(res?.message || t('invoices.generateFailed'));
              const created = res.data?.invoicesGenerated;
              showAlert(
                created === 0 ? t('common.notice') : t('common.success'),
                res.message || t(created === 0 ? 'invoices.noNewInvoices' : 'invoices.generatedSuccessfully'),
                created === 0 ? 'info' : 'success'
              );
              fetchSummary();
            } catch (error) {
              if (!error?.isPlanLimit) showAlert(t('common.error'), error.message || t('invoices.generateFailed'), 'error');
            } finally {
              setGeneratingForId(null);
            }
          }
        }
      ]
    );
  };

  const handleCustomerPress = customerId => {
    navigation.navigate('CustomerDetail', { customerId });
  };

  const handleLowerSectionPress = () => {
    showAlert(
      t('common.comingSoon'),
      t('common.functionalityComingSoon'),
      [{ text: t('common.okay') }],
      'info'
    );
  };

  const renderCustomerCard = ({ item }) => (
    <CustomerCard
      item={item}
      handleGenerateInvoice={handleGenerateInvoice}
      handleCustomerPress={handleCustomerPress}
      handleLowerSectionPress={handleLowerSectionPress}
      user={user}
      generatingForId={generatingForId}
      t={t}
    />
  );

  return (
    <View style={styles.container}>
      <CurvedHeader
        title={t('invoices.pendingToInvoice')}
        leftIcon={<Menu color="#FFFFFF" size={24} />}
        onLeftPress={() => navigation.toggleDrawer()}
        height={130}
        contentStyle={{ paddingTop: 10, paddingBottom: 25 }}
      />
      
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : summaryData.length === 0 ? (
        <View style={styles.centerContainer}>
          <FileText size={60} color={COLORS.textPlaceholder} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>{t('invoices.noInvoicesFound')}</Text>
          <Text style={styles.emptySubtitle}>{t('deliveries.noDeliveriesFound')}</Text>
        </View>
      ) : (
        <View style={styles.contentWrapper}>
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={20} color={COLORS.textPlaceholder} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('customers.searchPlaceholder')}
                placeholderTextColor={COLORS.textPlaceholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
            </View>
          </View>

          <FlatList
            data={filteredSummaryData}
            keyExtractor={(item) => item.customerId}
            renderItem={renderCustomerCard}
            contentContainerStyle={
              filteredSummaryData.length === 0
                ? styles.emptyListContainer
                : styles.listContainer
            }
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
            }
            ListEmptyComponent={
              <View style={styles.searchEmptyContainer}>
                <Search size={52} color={COLORS.textPlaceholder} style={styles.searchEmptyIcon} />
                <Text style={styles.emptyTitle}>{t('invoices.noInvoicesFound')}</Text>
                <Text style={styles.emptySubtitle}>{t('customers.noCustomersSearch')}</Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  contentWrapper: {
    flex: 1,
    paddingTop: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    color: COLORS.textPrimary,
    fontFamily: 'Rubik-Medium',
    fontSize: 15,
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
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  searchEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 80,
  },
  searchEmptyIcon: {
    marginBottom: 16,
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
    marginBottom: 16,
  },
  customerInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerName: {
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerPhone: {
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
    color: COLORS.textSecondary,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 10,
    fontFamily: 'Rubik-Medium',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  amountValue: {
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    color: '#16A34A',
  },
  cardStats: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconWrapperSmall: {
    backgroundColor: '#EFF6FF',
    padding: 6,
    borderRadius: 8,
    marginRight: 10,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValueText: {
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
  },
  dateTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  dateText: {
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
    color: COLORS.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
  },
  generateButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
  }
});

export default UnbilledDeliveriesScreen;
