import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { FileText, ChevronRight, Menu, CheckCircle } from 'lucide-react-native';
import CurvedHeader from '../../components/CurvedHeader';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { COLORS } from '../../constants/colors';

const UnbilledDeliveriesScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { userToken, user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summaryData, setSummaryData] = useState([]);
  const [generatingForId, setGeneratingForId] = useState(null);

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
    Alert.alert(
      'Generate Invoice',
      'Are you sure you want to generate an invoice for these deliveries?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Generate', 
          style: 'default',
          onPress: async () => {
            try {
              setGeneratingForId(customerId);
              const payload = { customerId, periodStart, periodEnd };
              const res = await api.generateInvoices(userToken, payload);
              if (res.success) {
                Alert.alert('Success', res.message || 'Invoice generated successfully.');
                fetchSummary(); // Refresh list to remove generated items
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to generate invoice.');
            } finally {
              setGeneratingForId(null);
            }
          }
        }
      ]
    );
  };

  const renderCustomerCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <Text style={styles.customerPhone}>{item.customerPhone || 'No Phone'}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>{t('invoices.estimatedTotal')}</Text>
          <Text style={styles.amountValue}>₹{Number(item.estimatedTotal).toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.cardStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.uninvoicedDeliveries}</Text>
          <Text style={styles.statLabel}>{t('deliveries.title')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.earliestDeliveryDate}</Text>
          <Text style={styles.statLabel}>{t('invoices.periodStartDate')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.latestDeliveryDate}</Text>
          <Text style={styles.statLabel}>{t('invoices.periodEndDate')}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        {user?.role !== 'staff' && (
          <TouchableOpacity 
            style={styles.generateButton}
            onPress={() => handleGenerateInvoice(item.customerId, item.earliestDeliveryDate, item.latestDeliveryDate)}
            disabled={generatingForId === item.customerId}
          >
            {generatingForId === item.customerId ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <CheckCircle size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.generateButtonText}>{t('invoices.generateInvoices')}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <CurvedHeader
        title={<Text style={{ color: '#FFF', fontSize: 20, fontFamily: 'Geologica-Bold' }}>{t('invoices.pendingToInvoice')}</Text>}
        leftIcon={<Menu color="#FFF" size={24} />}
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
        <FlatList
          data={summaryData}
          keyExtractor={(item) => item.customerId}
          renderItem={renderCustomerCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
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
    backgroundColor: COLORS.surface,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Geologica-Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  customerName: {
    fontSize: 16,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
  },
  amountContainer: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  amountLabel: {
    fontSize: 10,
    fontFamily: 'Geologica-Medium',
    color: '#059669',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 16,
    fontFamily: 'Geologica-Bold',
    color: '#059669',
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Geologica-Medium',
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
    fontFamily: 'Geologica-Bold',
  }
});

export default UnbilledDeliveriesScreen;
