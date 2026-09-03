import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { CheckCircle, Truck, XCircle, PackageCheck, PackageX, User, MapPin } from 'lucide-react-native';
import { PieChart } from 'react-native-gifted-charts';
import { api } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../constants/colors';
import { useTranslation } from 'react-i18next';

const OperationsReport = ({ filters }) => {
  const { t } = useTranslation();
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
    { value: successRate, color: successRate >= 85 ? '#059669' : successRate >= 60 ? '#D97706' : '#E11D48' },
    { value: Math.max(0, 100 - successRate), color: '#FFF1F2' }
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
            <Text style={styles.leaderboardName}>{item.routeName || item.staffName || t('reports.unassigned')}</Text>
          </View>
          <View style={[styles.successBadge, { backgroundColor: isGood ? '#D1FAE5' : isBad ? '#FEE2E2' : '#FEF3C7' }]}>
            <Text style={[styles.successBadgeText, { color: isGood ? '#065F46' : isBad ? '#991B1B' : '#92400E' }]}>
              {itemSuccessRate}%
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>{t('reports.scheduled') || 'Scheduled'}</Text>
            <Text style={styles.statBoxValue}>{item.total}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>{t('reports.skipped') || 'Skipped'}</Text>
            <Text style={[styles.statBoxValue, item.skipped > 0 && { color: '#EF4444' }]}>{item.skipped}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>{t('reports.delivered') || 'Delivered'}</Text>
            <Text style={styles.statBoxValue}>{item.delivered}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>{t('reports.returned') || 'Returned'}</Text>
            <Text style={styles.statBoxValue}>{item.returned}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderHorizontalBar = (item, type) => {
    const total = item.total || 0;
    const completed = item.completed || 0;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const label = type === 'route' ? (item.routeName || t('reports.unassigned')) : (item.staffName || t('reports.unassigned'));
    
    let color = '#E11D48'; // Rose
    let bgColor = '#FFF1F2';
    if (rate >= 85) { color = '#059669'; bgColor = '#ECFDF5'; }
    else if (rate >= 60) { color = '#D97706'; bgColor = '#FFFBEB'; }

    // Use a composite key in case there are multiple 'Unassigned'
    const uniqueKey = `${type}-${label}-${item.routeId || item.staffId || Math.random()}`;

    return (
      <View key={uniqueKey} style={styles.customBarContainer}>
        <View style={[styles.customBarFill, { width: `${rate}%`, backgroundColor: bgColor, borderRightColor: color }]} />
        <View style={styles.customBarContent}>
          <Text style={styles.customBarLabel} numberOfLines={1}>{label}</Text>
          <Text style={[styles.customBarValue, { color }]}>{rate}%</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* Gauge Chart (Success Rate) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('reports.successRate') || 'Success Rate'}</Text>
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
          {successRate >= 85 ? t('reports.excellentOperations') : successRate >= 60 ? t('reports.acceptableOperations') : t('reports.warningOperations')}
        </Text>
      </View>

      {/* Summary Grid */}
      <View style={styles.gridContainer}>
        <View style={[styles.gridItem, { backgroundColor: '#F8FAFC' }]}>
          <Truck size={24} color="#64748B" />
          <Text style={styles.gridValue}>{totalScheduled}</Text>
          <Text style={styles.gridLabel}>{t('reports.totalScheduled') || 'Total Scheduled'}</Text>
        </View>
        
        <View style={[styles.gridItem, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', borderWidth: 1 }]}>
          <CheckCircle size={24} color="#10B981" />
          <Text style={[styles.gridValue, { color: '#047857' }]}>{totalCompleted}</Text>
          <Text style={[styles.gridLabel, { color: '#065F46' }]}>{t('reports.completed') || 'Completed'}</Text>
        </View>

        <View style={[styles.gridItem, { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1 }]}>
          <XCircle size={24} color="#EF4444" />
          <Text style={[styles.gridValue, { color: '#B91C1C' }]}>{totalSkipped}</Text>
          <Text style={[styles.gridLabel, { color: '#991B1B' }]}>{t('reports.skipped') || 'Skipped'}</Text>
        </View>

        <View style={[styles.gridItem, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', borderWidth: 1 }]}>
          <PackageCheck size={24} color="#0B409C" />
          <Text style={[styles.gridValue, { color: '#1E3A8A' }]}>{totalDeliveredJars}</Text>
          <Text style={[styles.gridLabel, { color: '#0B409C' }]}>{t('reports.jarsDelivered') || 'Jars Delivered'}</Text>
        </View>

        <View style={[styles.gridItem, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A', borderWidth: 1 }]}>
          <PackageX size={24} color="#D97706" />
          <Text style={[styles.gridValue, { color: '#B45309' }]}>{totalReturnedJars}</Text>
          <Text style={[styles.gridLabel, { color: '#92400E' }]}>{t('reports.jarsReturned') || 'Jars Returned'}</Text>
        </View>
      </View>

      {/* Leaderboards */}
      {byRoute && byRoute.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('reports.routePerformance') || 'Route Performance (Success %)'}</Text>
          <View style={{ marginTop: 4 }}>
            {byRoute.map((item) => renderHorizontalBar(item, 'route'))}
          </View>
        </View>
      )}

      {byStaff && byStaff.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('reports.staffPerformance') || 'Staff Performance (Success %)'}</Text>
          <View style={{ marginTop: 4 }}>
            {byStaff.map((item) => renderHorizontalBar(item, 'staff'))}
          </View>
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
    fontFamily: 'Rubik-SemiBold',
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
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-SemiBold',
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
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 2,
  },
  gridLabel: {
    fontSize: 12,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textSecondary,
    textAlign: 'center',
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
    borderRightWidth: 3,
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
  }
});

export default OperationsReport;
