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
  UserPlus, Package, MapPin, Users, Repeat, ShoppingBag, FileText, CreditCard, Truck, ChevronRight, Calendar
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
  const [todaysDeliveries, setTodaysDeliveries] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(true);

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

      const fetchDeliveries = async () => {
        setLoadingDeliveries(true);
        try {
          const todayStr = new Date().toISOString().split('T')[0];
          const res = await api.listDeliveries(userToken, todayStr);
          if (isActive && res && res.success) {
            const list = Array.isArray(res.data) 
              ? res.data 
              : (Array.isArray(res.data?.deliveries) ? res.data.deliveries : []);
            setTodaysDeliveries(list);
          }
        } catch (err) {
          console.error('Error fetching today deliveries:', err);
        } finally {
          if (isActive) setLoadingDeliveries(false);
        }
      };

      fetchStats();
      fetchDeliveries();
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

  const renderWholeScreenSkeleton = () => (
    <View style={{ gap: 20 }}>
      {/* 1. Today's Overview Skeleton */}
      <View>
        <View style={styles.skeletonBarTitle} />
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
      </View>

      {/* 2. Business Services Skeleton */}
      <View>
        <View style={styles.skeletonBarTitle} />
        <Animated.View style={[styles.servicesCard, { opacity: pulseAnim }]}>
          {[1, 2, 3, 4, 5, 6].map((key) => (
            <View key={key} style={styles.serviceItem}>
              <View style={[styles.skeletonCircle, { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E2E8F0', marginBottom: 8 }]} />
              <View style={[styles.skeletonBar, { width: 50, height: 12, backgroundColor: '#E2E8F0', borderRadius: 6 }]} />
            </View>
          ))}
        </Animated.View>
      </View>

      {/* 3. Today's Orders Skeleton */}
      <View>
        <View style={styles.skeletonBarTitle} />
        <Animated.View style={[styles.todaysOrdersCardContainer, { padding: 16, opacity: pulseAnim }]}>
          {[1, 2, 3].map((key) => (
            <View key={key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#CBD5E1', marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <View style={[styles.skeletonBar, { width: '60%', height: 14, backgroundColor: '#E2E8F0', borderRadius: 6, marginBottom: 4 }]} />
                  <View style={[styles.skeletonBar, { width: '40%', height: 11, backgroundColor: '#E2E8F0', borderRadius: 6 }]} />
                </View>
              </View>
              <View style={[styles.skeletonBar, { width: 60, height: 20, backgroundColor: '#E2E8F0', borderRadius: 10 }]} />
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );

  const features = [
    { title: t('invoices.title', 'Invoices'), icon: FileText, screen: 'InvoiceList' },
    { title: t('subscriptions.title'), icon: Repeat, screen: 'SubscriptionList' },
    { title: t('deliveries.allRoutes'), icon: MapPin, screen: 'RouteList' },
    { title: 'Products', icon: Package, screen: 'ProductCatalog' },
    { title: 'Past Deliveries', icon: Calendar, screen: 'PastDeliveries' },
    { title: '1 Time Orders', icon: ShoppingBag, screen: 'OneTimeOrderList' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {(loadingStats || loadingDeliveries) ? (
          renderWholeScreenSkeleton()
        ) : (
          <>
            {/* Today's Overview (Colorful Vertical Cards) */}
            <Text style={styles.sectionTitle}>{t('home.overviewTitle') || 'Today\'s Overview'}</Text>
            <View style={styles.overviewGrid}>
              <View style={styles.overviewRow}>
                {/* Customers Card */}
                <View style={styles.overviewCardQuart}>
                  <View style={styles.overviewImageBgPlaceholder} />
                  <View style={[styles.overviewIconAbsolute, { right: -5, bottom: -5, opacity: 0.95, transform: [{ rotate: '0deg' }] }]}>
                    <Image
                      source={require('../../../assets/customerstats.png')}
                      style={{ width: 65, height: 65 }}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.overviewTitleDark} numberOfLines={2}>{t('tabs.customers')}</Text>
                  <Text style={styles.overviewValueDark}>{stats.customers}</Text>
                </View>

                {/* Active Subs Card */}
                <View style={styles.overviewCardQuart}>
                  <View style={styles.overviewImageBgPlaceholder} />
                  <View style={[styles.overviewIconAbsolute, { right: 0, bottom: 0, opacity: 0.95, transform: [{ rotate: '0deg' }] }]}>
                    <Image
                      source={require('../../../assets/activesubstat.png')}
                      style={{ width: 70, height: 70 }}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.overviewTitleDark} numberOfLines={2}>{t('customers.activeSubscriptions')}</Text>
                  <Text style={styles.overviewValueDark}>{stats.subscriptions}</Text>
                </View>
              </View>
              <View style={[styles.overviewRow, { marginBottom: 0 }]}>
                {/* Routes Card */}
                <View style={styles.overviewCardQuart}>
                  <View style={styles.overviewImageBgPlaceholder} />
                  <View style={[styles.overviewIconAbsolute, { right: -10, bottom: -10, opacity: 0.95, transform: [{ rotate: '0deg' }] }]}>
                    <Image
                      source={require('../../../assets/routestat.png')}
                      style={{ width: 85, height: 85 }}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.overviewTitleDark} numberOfLines={2}>{t('deliveries.allRoutes')}</Text>
                  <Text style={styles.overviewValueDark}>{stats.routes}</Text>
                </View>

                {/* One Time Orders Card */}
                <View style={styles.overviewCardQuart}>
                  <View style={styles.overviewImageBgPlaceholder} />
                  <View style={[styles.overviewIconAbsolute, { right: 0, bottom: 0, opacity: 0.95, transform: [{ rotate: '0deg' }] }]}>
                    <Image
                      source={require('../../../assets/onetimestat.png')}
                      style={{ width: 70, height: 70 }}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.overviewTitleDark} numberOfLines={2}>{t('oneTimeOrders.title')}</Text>
                  <Text style={styles.overviewValueDark}>{stats.oneTimeOrders}</Text>
                </View>
              </View>
            </View>

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
                    <feature.icon size={28} color={COLORS.secondary} strokeWidth={2} />
                  </View>
                  <Text style={styles.serviceText}>{feature.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Dedicated Today's Orders Card Section */}
            <Text style={styles.sectionTitle}>Today's Orders</Text>
            <View style={styles.todaysOrdersCardContainer}>
              {!Array.isArray(todaysDeliveries) || todaysDeliveries.length === 0 ? (
                <View style={styles.emptyOrdersBox}>
                  <Truck size={32} color={COLORS.textPlaceholder} style={{ marginBottom: 8 }} />
                  <Text style={styles.emptyOrdersText}>No orders scheduled for today.</Text>
                </View>
              ) : (
                todaysDeliveries.slice(0, 5).map((item, idx) => {
                  const statusColor = 
                    item.status === 'delivered' ? COLORS.success :
                    item.status === 'skipped' ? COLORS.danger : COLORS.warning;
                  
                  return (
                    <View key={item.id || idx} style={[styles.orderCardItem, idx < Math.min(todaysDeliveries.length, 5) - 1 && styles.orderItemBorder]}>
                      <View style={styles.orderCardLeft}>
                        <View style={[styles.orderStatusDot, { backgroundColor: statusColor }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.orderCustomerName} numberOfLines={1}>
                            {item.Customer?.name || 'Customer'}
                          </Text>
                          <Text style={styles.orderProductInfo} numberOfLines={1}>
                            {item.Subscription?.Product?.name || 'Product'} • Qty: {item.Subscription?.baseQuantity || 1}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.orderStatusBadge, { backgroundColor: statusColor + '18' }]}>
                        <Text style={[styles.orderStatusText, { color: statusColor }]}>
                          {String(item.status || 'pending').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
              {Array.isArray(todaysDeliveries) && todaysDeliveries.length > 5 && (
                <TouchableOpacity 
                  style={styles.viewMoreBtn}
                  onPress={() => {
                    navigation.navigate('MainDrawer', {
                      screen: 'MainTabs',
                      params: { screen: 'Deliveries' },
                    });
                  }}
                >
                  <Text style={styles.viewMoreText}>View All ({todaysDeliveries.length})</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

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
    fontFamily: 'Geologica-Medium',
    color: COLORS.primary,
    marginBottom: 16,
    marginTop: 10,
    marginLeft: 4,
  },
  todaysOrdersCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  emptyOrdersBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyOrdersText: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPlaceholder,
  },
  orderCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  orderItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  orderCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  orderStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  orderCustomerName: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  orderProductInfo: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
  },
  orderStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orderStatusText: {
    fontSize: 10,
    fontFamily: 'Geologica-Bold',
  },
  viewMoreBtn: {
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  viewMoreText: {
    fontSize: 13,
    fontFamily: 'Geologica-Bold',
    color: COLORS.primary,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  overviewTitleDark: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.primary,
    marginBottom: 4,
    zIndex: 10,
    maxWidth: '85%',
  },
  overviewValueDark: {
    fontSize: 26,
    fontFamily: 'Geologica-Bold',
    fontWeight: 'bold',
    color: COLORS.secondary,
    zIndex: 10,
  },
  overviewImageBgPlaceholder: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 90,
    height: 90,
    backgroundColor: COLORS.secondaryLight,
    borderRadius: 45,
    zIndex: 0,
  },
  overviewIconAbsolute: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    zIndex: 1,
    opacity: 0.95,
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
    borderColor: COLORS.border,
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
    fontFamily: 'Geologica-Medium',
    color: COLORS.primary,
    textAlign: 'center',
  },
  skeletonBarTitle: {
    width: 140,
    height: 18,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    marginBottom: 14,
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
