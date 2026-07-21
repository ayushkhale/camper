import React, { useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  UserPlus, Package, MapPin, Users, Repeat, ShoppingBag
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

const HomeScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { userToken, user } = useContext(AuthContext);

  const [stats, setStats] = useState({ customers: 0, subscriptions: 0, routes: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchStats = async () => {
        setLoadingStats(true);
        try {
          const [custRes, subRes, routeRes] = await Promise.all([
            api.listCustomers(userToken),
            api.listSubscriptions(userToken, '', 'active'),
            api.listRoutes(userToken)
          ]);

          if (isActive) {
            setStats({
              customers: custRes.success ? (custRes.data?.length || 0) : 0,
              subscriptions: subRes.success ? (subRes.data?.length || 0) : 0,
              routes: routeRes.success ? (routeRes.data?.length || 0) : 0,
            });
          }
        } catch (err) {
          console.error('Error fetching dashboard stats:', err);
        } finally {
          if (isActive) setLoadingStats(false);
        }
      };

      fetchStats();
      return () => { isActive = false; };
    }, [userToken])
  );

  const features = [
    { title: t('tabs.customers'), icon: Users, screen: 'CustomerList' },
    { title: t('subscriptions.title'), icon: Repeat, screen: 'SubscriptionList' },
    { title: t('deliveries.allRoutes'), icon: MapPin, screen: 'RouteList' },
    { title: t('products.title'), icon: Package, screen: 'ProductCatalog' },
    { title: t('staff.title'), icon: UserPlus, screen: 'StaffManagement' },
    { title: t('oneTimeOrders.title'), icon: ShoppingBag, screen: 'OneTimeOrderList' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Dashboard Overview Stats (M3 Filled Cards) */}
        <Text style={styles.sectionTitle}>{t('home.overviewTitle')}</Text>
        {loadingStats ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : (
          <View style={styles.statsRow}>
            {/* Customers Card */}
            <View style={[styles.statM3Card, { backgroundColor: COLORS.surface }]}>
              <Text style={[styles.statValue, { color: COLORS.primary }]}>{stats.customers}</Text>
              <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>{t('tabs.customers')}</Text>
            </View>

            {/* Active Subs Card */}
            <View style={[styles.statM3Card, { backgroundColor: COLORS.surface }]}>
              <Text style={[styles.statValue, { color: COLORS.primary }]}>{stats.subscriptions}</Text>
              <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>{t('subscriptions.active')}</Text>
            </View>

            {/* Routes Card */}
            <View style={[styles.statM3Card, { backgroundColor: COLORS.surface }]}>
              <Text style={[styles.statValue, { color: COLORS.primary }]}>{stats.routes}</Text>
              <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>{t('deliveries.allRoutes')}</Text>
            </View>
          </View>
        )}

        {/* Features Grid (M3 Elevated Cards) */}
        <Text style={styles.sectionTitle}>{t('home.quickActionsTitle')}</Text>
        <View style={styles.featuresGrid}>
          {features.map((feature, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.featureCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(feature.screen)}
            >
              <View style={[styles.featureIconWrap, { backgroundColor: COLORS.surface }]}>
                <feature.icon size={22} color={COLORS.primary} strokeWidth={2.5} />
              </View>
              <Text style={styles.featureText}>{feature.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 16,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statM3Card: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F0F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
});

export default HomeScreen;
