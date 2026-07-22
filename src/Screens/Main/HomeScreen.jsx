import React, { useState, useContext, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Animated
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

  const [stats, setStats] = useState({ customers: 0, subscriptions: 0, routes: 0, oneTimeOrders: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchStats = async () => {
        setLoadingStats(true);
        try {
          const res = await api.getDashboardStats(userToken);
          if (isActive && res.success) {
            const data = res.data || {};
            setStats({
              customers: data.customersCount || 0,
              subscriptions: data.activeSubscriptionsCount || 0,
              routes: data.routesCount || 0,
              oneTimeOrders: data.oneTimeOrdersCount || 0,
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

  const pulseAnim = React.useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (loadingStats) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.8,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          })
        ])
      ).start();
    }
  }, [loadingStats]);

  const renderSkeleton = () => (
    <View style={styles.overviewGrid}>
      <View style={styles.overviewRow}>
        <Animated.View style={[styles.overviewCardQuart, { backgroundColor: '#F1F5F9', opacity: pulseAnim }]}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonValue} />
        </Animated.View>
        <Animated.View style={[styles.overviewCardQuart, { backgroundColor: '#F1F5F9', opacity: pulseAnim }]}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonValue} />
        </Animated.View>
      </View>
      <View style={[styles.overviewRow, { marginBottom: 0 }]}>
        <Animated.View style={[styles.overviewCardQuart, { backgroundColor: '#F1F5F9', opacity: pulseAnim }]}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonValue} />
        </Animated.View>
        <Animated.View style={[styles.overviewCardQuart, { backgroundColor: '#F1F5F9', opacity: pulseAnim }]}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonValue} />
        </Animated.View>
      </View>
    </View>
  );

  const features = [
    { title: t('tabs.customers'), icon: Users, tab: 'Customers' },
    { title: t('subscriptions.title'), icon: Repeat, screen: 'SubscriptionList' },
    { title: t('deliveries.allRoutes'), icon: MapPin, screen: 'RouteList' },
    { title: t('products.title'), icon: Package, screen: 'ProductCatalog' },
    { title: t('staff.title'), icon: UserPlus, screen: 'StaffManagement' },
    { title: t('oneTimeOrders.title'), icon: ShoppingBag, screen: 'OneTimeOrderList' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Today's Overview (Colorful Vertical Cards) */}
        <Text style={styles.sectionTitle}>{t('home.overviewTitle') || 'Today\'s Overview'}</Text>
        {loadingStats ? renderSkeleton() : (
          <View style={styles.overviewGrid}>
            <View style={styles.overviewRow}>
              {/* Customers Card */}
              <View style={styles.overviewCardQuart}>
                <View style={styles.overviewImageBgPlaceholder} />
                <View style={[styles.overviewIconAbsolute, { right: 0, bottom: 0, opacity: 0.95, transform: [{ rotate: '0deg' }] }]}>
                  <Image
                    source={require('../../../assets/customerstats.png')}
                    style={{ width: 95, height: 95 }}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.overviewTitleDark}>{t('tabs.customers')}</Text>
                <Text style={styles.overviewValueDark}>{stats.customers}</Text>
              </View>

              {/* Active Subs Card */}
              <View style={styles.overviewCardQuart}>
                <View style={styles.overviewImageBgPlaceholder} />
                <View style={[styles.overviewIconAbsolute, { right: 0, bottom: 0, opacity: 0.95, transform: [{ rotate: '0deg' }] }]}>
                  <Image
                    source={require('../../../assets/activesubstat.png')}
                    style={{ width: 95, height: 95 }}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.overviewTitleDark}>{t('customers.activeSubscriptions')}</Text>
                <Text style={styles.overviewValueDark}>{stats.subscriptions}</Text>
              </View>
            </View>
            <View style={[styles.overviewRow, { marginBottom: 0 }]}>
              {/* Routes Card */}
              <View style={styles.overviewCardQuart}>
                <View style={styles.overviewImageBgPlaceholder} />
                <View style={[styles.overviewIconAbsolute, { right: -25, bottom: -25, opacity: 0.95, transform: [{ rotate: '0deg' }] }]}>
                  <Image
                    source={require('../../../assets/routestat.png')}
                    style={{ width: 140, height: 140 }}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.overviewTitleDark}>{t('deliveries.allRoutes')}</Text>
                <Text style={styles.overviewValueDark}>{stats.routes}</Text>
              </View>

              {/* One Time Orders Card */}
              <View style={styles.overviewCardQuart}>
                <View style={styles.overviewImageBgPlaceholder} />
                <View style={[styles.overviewIconAbsolute, { right: 0, bottom: 0, opacity: 0.95, transform: [{ rotate: '0deg' }] }]}>
                  <Image
                    source={require('../../../assets/onetimestat.png')}
                    style={{ width: 95, height: 95 }}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.overviewTitleDark}>{t('oneTimeOrders.title')}</Text>
                <Text style={styles.overviewValueDark}>{stats.oneTimeOrders}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Business Services (White Card Grid) */}
        <Text style={styles.sectionTitle}>{t('home.quickActionsTitle') || 'Business Services'}</Text>
        <View style={styles.servicesCard}>
          {features.map((feature, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.serviceItem}
              activeOpacity={0.7}
              onPress={() => {
                if (feature.tab) {
                  navigation.navigate('MainDrawer', {
                    screen: 'MainTabs',
                    params: { screen: feature.tab },
                  });
                } else {
                  navigation.navigate(feature.screen);
                }
              }}
            >
              <View style={styles.serviceIconWrap}>
                <feature.icon size={28} color={COLORS.primary} strokeWidth={2} />
              </View>
              <Text style={styles.serviceText}>{feature.title}</Text>
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
    backgroundColor: COLORS.background, // Pure white background to match onboarding/login
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
    marginTop: 10,
    marginLeft: 4,
  },

  // Overview Section
  loadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  overviewGrid: {
    marginBottom: 4,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  overviewCardQuart: {
    width: '48%',
    height: 120,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: 'rgba(14, 68, 168, 0.06)', // Low opacity primary
  },
  overviewTitleDark: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
    zIndex: 2,
  },
  overviewValueDark: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    fontWeight: 'bold',
    color: COLORS.primary,
    zIndex: 2,
  },
  overviewImageBgPlaceholder: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 90,
    height: 90,
    backgroundColor: 'rgba(14, 68, 168, 0.08)',
    borderRadius: 45,
    zIndex: 0,
  },
  overviewIconAbsolute: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    zIndex: 1,
    opacity: 0.06,
    transform: [{ rotate: '-10deg' }],
  },

  // Business Services Grid
  servicesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24, // softer, pillowy rounding
    paddingVertical: 24,
    paddingHorizontal: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: 'rgba(14, 68, 168, 0.12)',
    // Soft M3 elevated shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 10,
  },
  serviceItem: {
    width: '33.33%',
    alignItems: 'center',
    marginBottom: 20,
  },
  serviceIconWrap: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  skeletonTitle: {
    width: '65%',
    height: 14,
    backgroundColor: '#E2E8F0',
    borderRadius: 7,
    marginBottom: 12,
    marginTop: 2,
  },
  skeletonValue: {
    width: '40%',
    height: 28,
    backgroundColor: '#E2E8F0',
    borderRadius: 7,
  },
});

export default HomeScreen;
