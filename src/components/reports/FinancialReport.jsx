import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { IndianRupee, CreditCard, Banknote, Landmark } from 'lucide-react-native';
import { api } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../constants/colors';

const FinancialReport = ({ filters }) => {
  const { userToken } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getFinancialReports(userToken, filters);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load financial data');
      }
    } catch (err) {
      setError('An error occurred while fetching data');
      console.log('Financial report error:', err);
    } finally {
      setLoading(false);
    }
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

  if (!data) return null;

  const { totalRevenue = 0, totalCollections = 0, collectionsByMode = {} } = data;
  const efficiency = totalRevenue > 0 ? Math.min(100, Math.round((totalCollections / totalRevenue) * 100)) : 0;
  
  // Format for pie chart
  const pieData = [];
  if (collectionsByMode.cash > 0) pieData.push({ value: collectionsByMode.cash, color: '#10B981', text: 'Cash' });
  if (collectionsByMode.upi > 0) pieData.push({ value: collectionsByMode.upi, color: '#3B82F6', text: 'UPI' });
  if (collectionsByMode.bank_transfer > 0) pieData.push({ value: collectionsByMode.bank_transfer, color: '#8B5CF6', text: 'Bank' });

  // If no collections, show empty grey circle
  if (pieData.length === 0) {
    pieData.push({ value: 1, color: '#E2E8F0', text: 'None' });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      
      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        <View
          style={[styles.kpiCard, { backgroundColor: '#ECFDF5', borderColor: '#BBF7D0' }]}
        >
          <Text style={[styles.kpiLabel, { color: '#065F46' }]}>Billed Revenue</Text>
          <Text style={[styles.kpiValue, { color: '#047857' }]}>₹{totalRevenue.toLocaleString()}</Text>
        </View>
        <View
          style={[styles.kpiCard, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}
        >
          <Text style={[styles.kpiLabel, { color: '#3730A3' }]}>Collected</Text>
          <Text style={[styles.kpiValue, { color: '#4338CA' }]}>₹{totalCollections.toLocaleString()}</Text>
        </View>
      </View>

      {/* Efficiency Bar */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Collection Efficiency</Text>
          <Text style={[styles.efficiencyText, { color: efficiency >= 80 ? '#10B981' : efficiency < 50 ? '#EF4444' : '#F59E0B' }]}>
            {efficiency}%
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${efficiency}%`, 
                backgroundColor: efficiency >= 80 ? '#10B981' : efficiency < 50 ? '#EF4444' : '#F59E0B'
              }
            ]} 
          />
        </View>
        <Text style={styles.progressHelper}>
          {efficiency >= 80 ? 'Excellent collection rate!' : efficiency < 50 ? 'Warning: High amount of uncollected revenue.' : 'Average collection rate.'}
        </Text>
      </View>

      {/* Breakdown Pie Chart */}
      <View style={styles.card}>
        <Text style={[styles.cardTitle, { marginBottom: 20 }]}>Collections Breakdown</Text>
        
        {totalCollections > 0 ? (
          <View style={styles.chartContainer}>
            <PieChart
              data={pieData}
              donut
              showText
              textColor="white"
              radius={80}
              innerRadius={50}
              textSize={12}
              centerLabelComponent={() => {
                return (
                  <View style={{justifyContent: 'center', alignItems: 'center'}}>
                    <Text style={{fontSize: 18, color: '#334155', fontWeight: 'bold'}}>
                      ₹{totalCollections >= 1000 ? (totalCollections/1000).toFixed(1) + 'k' : totalCollections}
                    </Text>
                    <Text style={{fontSize: 10, color: '#64748B'}}>Total</Text>
                  </View>
                );
              }}
            />
            
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>Cash (₹{collectionsByMode.cash || 0})</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.legendText}>UPI (₹{collectionsByMode.upi || 0})</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
                <Text style={styles.legendText}>Bank (₹{collectionsByMode.bank_transfer || 0})</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <IndianRupee size={40} color="#CBD5E1" style={{marginBottom: 10}} />
            <Text style={styles.emptyStateText}>No collections recorded for this period.</Text>
          </View>
        )}
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  kpiLabel: {
    fontSize: 13,
    fontFamily: 'Geologica-SemiBold',
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 26,
    fontFamily: 'Geologica-Bold',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Geologica-SemiBold',
    color: COLORS.textPrimary,
  },
  efficiencyText: {
    fontSize: 18,
    fontFamily: 'Geologica-Bold',
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressHelper: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
  },
  chartContainer: {
    alignItems: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Geologica-Regular',
    color: COLORS.textPlaceholder,
  }
});

export default FinancialReport;
