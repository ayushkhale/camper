import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { CheckCircle, Truck, XCircle, PackageCheck, PackageX, User, MapPin } from 'lucide-react-native';
import { PieChart } from 'react-native-gifted-charts';
import { api } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../constants/colors';

const OperationsReport = ({ filters }) => {
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
      const res = await api.getOperationsReports(userToken, filters);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load operations data');
      }
    } catch (err) {
      setError('An error occurred while fetching data');
      console.log('Operations report error:', err);
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

  const { summary = {}, byRoute = [], byStaff = [] } = data;
  const { totalScheduled = 0, totalCompleted = 0, totalSkipped = 0, totalDeliveredJars = 0, totalReturnedJars = 0, successRate = 0 } = summary;

  // Chart data for success rate
  const gaugeData = [
    { value: successRate, color: successRate >= 85 ? '#10B981' : successRate >= 60 ? '#F59E0B' : '#EF4444' },
    { value: 100 - successRate, color: '#E2E8F0' }
  ];

  const renderLeaderboardItem = (item, type, index) => {
    const itemSuccessRate = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
    const isGood = itemSuccessRate >= 85;
    const isBad = itemSuccessRate < 60;
    
    // Provide a solid unique key
    const uniqueKey = type === 'route' ? (item.routeId || `unassigned-route-${index}`) : (item.staffId || `unassigned-staff-${index}`);

    return (
      <View key={uniqueKey} style={styles.leaderboardItem}>
        <View style={styles.leaderboardHeader}>
          <View style={styles.leaderboardNameRow}>
            {type === 'route' ? (
              <MapPin size={16} color={COLORS.textSecondary} style={{marginRight: 6}} />
            ) : (
              <User size={16} color={COLORS.textSecondary} style={{marginRight: 6}} />
            )}
            <Text style={styles.leaderboardName}>{item.routeName || item.staffName}</Text>
          </View>
          <View style={[styles.successBadge, { backgroundColor: isGood ? '#D1FAE5' : isBad ? '#FEE2E2' : '#FEF3C7' }]}>
            <Text style={[styles.successBadgeText, { color: isGood ? '#065F46' : isBad ? '#991B1B' : '#92400E' }]}>
              {itemSuccessRate}%
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>Scheduled</Text>
            <Text style={styles.statBoxValue}>{item.total}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>Skipped</Text>
            <Text style={[styles.statBoxValue, item.skipped > 0 && { color: '#EF4444' }]}>{item.skipped}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>Delivered</Text>
            <Text style={styles.statBoxValue}>{item.delivered}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>Returned</Text>
            <Text style={styles.statBoxValue}>{item.returned}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* Gauge Chart (Success Rate) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Success Rate</Text>
        <View style={styles.gaugeContainer}>
          <PieChart
            data={gaugeData}
            donut
            semiCircle
            radius={100}
            innerRadius={70}
            centerLabelComponent={() => {
              return (
                <View style={{justifyContent: 'center', alignItems: 'center', marginTop: -20}}>
                  <Text style={{fontSize: 28, color: '#334155', fontWeight: 'bold'}}>{successRate}%</Text>
                </View>
              );
            }}
          />
        </View>
        <Text style={styles.gaugeHelper}>
          {successRate >= 85 ? 'Excellent operations performance.' : successRate >= 60 ? 'Acceptable, but has room for improvement.' : 'Warning: High failure/skip rate.'}
        </Text>
      </View>

      {/* Summary Grid */}
      <View style={styles.gridContainer}>
        <View style={[styles.gridItem, { backgroundColor: '#F8FAFC' }]}>
          <Truck size={24} color="#64748B" />
          <Text style={styles.gridValue}>{totalScheduled}</Text>
          <Text style={styles.gridLabel}>Total Scheduled</Text>
        </View>
        
        <View style={[styles.gridItem, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', borderWidth: 1 }]}>
          <CheckCircle size={24} color="#10B981" />
          <Text style={[styles.gridValue, { color: '#047857' }]}>{totalCompleted}</Text>
          <Text style={[styles.gridLabel, { color: '#065F46' }]}>Completed</Text>
        </View>

        <View style={[styles.gridItem, { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1 }]}>
          <XCircle size={24} color="#EF4444" />
          <Text style={[styles.gridValue, { color: '#B91C1C' }]}>{totalSkipped}</Text>
          <Text style={[styles.gridLabel, { color: '#991B1B' }]}>Skipped</Text>
        </View>

        <View style={[styles.gridItem, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', borderWidth: 1 }]}>
          <PackageCheck size={24} color="#6366F1" />
          <Text style={[styles.gridValue, { color: '#4338CA' }]}>{totalDeliveredJars}</Text>
          <Text style={[styles.gridLabel, { color: '#3730A3' }]}>Jars Delivered</Text>
        </View>

        <View style={[styles.gridItem, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A', borderWidth: 1 }]}>
          <PackageX size={24} color="#D97706" />
          <Text style={[styles.gridValue, { color: '#B45309' }]}>{totalReturnedJars}</Text>
          <Text style={[styles.gridLabel, { color: '#92400E' }]}>Jars Returned</Text>
        </View>
      </View>

      {/* Leaderboards */}
      {byRoute && byRoute.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Route Performance</Text>
          {byRoute.map((item, index) => renderLeaderboardItem(item, 'route', index))}
        </View>
      )}

      {byStaff && byStaff.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Staff Performance</Text>
          {byStaff.map((item, index) => renderLeaderboardItem(item, 'staff', index))}
        </View>
      )}

    </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: -10,
  },
  gaugeHelper: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  gridValue: {
    fontSize: 24,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 2,
  },
  gridLabel: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  leaderboardItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 16,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leaderboardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaderboardName: {
    fontSize: 15,
    fontFamily: 'Geologica-SemiBold',
    color: COLORS.textPrimary,
  },
  successBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  successBadgeText: {
    fontSize: 12,
    fontFamily: 'Geologica-Bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
  },
  statBox: {
    alignItems: 'center',
  },
  statBoxLabel: {
    fontSize: 10,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPlaceholder,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statBoxValue: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  }
});

export default OperationsReport;
