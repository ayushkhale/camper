import React, { useState, useContext, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Package, MapPin, Repeat, ShoppingBag, FileText, Calendar, Truck, CheckCircle2, XCircle, AlertCircle, UserPlus, Plus
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

const { width } = Dimensions.get('window');

const BarGraph = ({ color, delay = 0 }) => {
  const [anim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 800,
      delay: delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0]
  });

  return (
    <Animated.View style={{ position: 'absolute', bottom: 16, right: 16, height: 45, width: 60, opacity: anim, transform: [{ translateY }], flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <View style={{ width: 10, height: '40%', backgroundColor: color, borderRadius: 4, opacity: 0.4 }} />
      <View style={{ width: 10, height: '65%', backgroundColor: color, borderRadius: 4, opacity: 0.6 }} />
      <View style={{ width: 10, height: '50%', backgroundColor: color, borderRadius: 4, opacity: 0.8 }} />
      <View style={{ width: 10, height: '100%', backgroundColor: color, borderRadius: 4, opacity: 1 }} />
    </Animated.View>
  );
};

const MapBackground = ({ color, delay = 0 }) => {
  const [anim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 1000,
      delay: delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1]
  });

  return (
    <Animated.View style={{ position: 'absolute', bottom: -5, right: -5, height: 85, width: 85, opacity: anim, transform: [{ scale }] }}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Path d="M10,90 L30,60 L50,80 L90,20" stroke={color} strokeWidth="3" fill="none" opacity="0.6" strokeDasharray="4 4" />
        <Path d="M20,0 L20,100 M40,0 L40,100 M60,0 L60,100 M80,0 L80,100" stroke={color} strokeWidth="1" opacity="0.1" />
        <Path d="M0,20 L100,20 M0,40 L100,40 M0,60 L100,60 M0,80 L100,80" stroke={color} strokeWidth="1" opacity="0.1" />
        <Circle cx="90" cy="20" r="7" fill={color} opacity="0.9" />
        <Circle cx="50" cy="80" r="4" fill={color} opacity="0.5" />
        <Circle cx="30" cy="60" r="4" fill={color} opacity="0.5" />
      </Svg>
    </Animated.View>
  );
};

const AnimatedIcon = ({ source, delay = 0 }) => {
  const [anim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 600,
      delay: delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1]
  });

  return (
    <Animated.View style={{ position: 'absolute', bottom: 10, right: 10, opacity: anim, transform: [{ scale }] }}>
      <Image source={source} style={{ width: 65, height: 65 }} resizeMode="contain" />
    </Animated.View>
  );
};

const AnimatedLucideIcon = ({ Icon, color, delay = 0, size = 45 }) => {
  const [anim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 600,
      delay: delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1]
  });

  const fadeOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15]
  });

  return (
    <Animated.View style={{ position: 'absolute', bottom: 10, right: 10, opacity: fadeOpacity, transform: [{ scale }] }}>
      <Icon size={size} color={color} strokeWidth={1.5} />
    </Animated.View>
  );
};

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
            console.log('📊 Dashboard Stats API Response:', JSON.stringify(data));
            setStats({
              customers: data.customersCount ?? data.customers ?? 0,
              subscriptions: data.activeSubscriptionsCount ?? data.subscriptionsCount ?? data.subscriptions ?? 0,
              routes: data.routesCount ?? data.routes ?? 0,
              oneTimeOrders: data.oneTimeOrdersCount ?? data.oneTimeOrderCount ?? data.oneTimeOrders ?? data.pendingOneTimeOrders ?? 0,
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
              
            const sortedList = [...list].sort((a, b) => {
              const statusA = (a.status || '').toUpperCase();
              const statusB = (b.status || '').toUpperCase();
              if (statusA === 'PENDING' && statusB !== 'PENDING') return -1;
              if (statusA !== 'PENDING' && statusB === 'PENDING') return 1;
              if (statusA === 'DELIVERED' && statusB !== 'DELIVERED') return 1;
              if (statusA !== 'DELIVERED' && statusB === 'DELIVERED') return -1;
              return 0;
            });
            
            setTodaysDeliveries(sortedList);
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
  }, [loadingStats, pulseAnim]);

  const renderWholeScreenSkeleton = () => (
    <View style={{ gap: 24, marginTop: 8 }}>
      {/* Overview Skeleton */}
      <View>
        <Animated.View style={[styles.skeletonTitle, { width: 160, height: 20, marginBottom: 16, opacity: pulseAnim }]} />
        <View style={styles.overviewGrid}>
          <View style={styles.overviewRow}>
            <Animated.View style={[styles.overviewCardQuart, { opacity: pulseAnim }]}>
              <View style={[styles.skeletonTitle, { width: 70, height: 14 }]} />
              <View style={[styles.skeletonValue, { width: 40, height: 28 }]} />
            </Animated.View>
            <Animated.View style={[styles.overviewCardQuart, { opacity: pulseAnim }]}>
              <View style={[styles.skeletonTitle, { width: 70, height: 14 }]} />
              <View style={[styles.skeletonValue, { width: 40, height: 28 }]} />
            </Animated.View>
          </View>
          <View style={[styles.overviewRow, { marginBottom: 0 }]}>
            <Animated.View style={[styles.overviewCardQuart, { opacity: pulseAnim }]}>
              <View style={[styles.skeletonTitle, { width: 70, height: 14 }]} />
              <View style={[styles.skeletonValue, { width: 40, height: 28 }]} />
            </Animated.View>
            <Animated.View style={[styles.overviewCardQuart, { opacity: pulseAnim }]}>
              <View style={[styles.skeletonTitle, { width: 70, height: 14 }]} />
              <View style={[styles.skeletonValue, { width: 40, height: 28 }]} />
            </Animated.View>
          </View>
        </View>
      </View>

      {/* Quick Actions Skeleton */}
      <View>
        <Animated.View style={[styles.skeletonTitle, { width: 140, height: 20, marginBottom: 16, opacity: pulseAnim }]} />
        <View style={styles.servicesGrid}>
          {[1, 2, 3, 4, 5, 6].map((key) => (
            <View key={key} style={styles.serviceItem}>
              <Animated.View style={[styles.skeletonCircle, { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E2E8F0', marginBottom: 10, opacity: pulseAnim }]} />
              <Animated.View style={[styles.skeletonTitle, { width: 60, height: 12, opacity: pulseAnim }]} />
            </View>
          ))}
        </View>
      </View>

      {/* Orders Skeleton */}
      <View>
        <Animated.View style={[styles.skeletonTitle, { width: 140, height: 20, marginBottom: 16, opacity: pulseAnim }]} />
        <View style={styles.ordersListContainer}>
          {[1, 2, 3].map((key) => (
            <Animated.View key={key} style={[styles.premiumOrderCard, { borderColor: '#E2E8F0', borderWidth: 1, borderLeftWidth: 1, opacity: pulseAnim }]}>
              <View style={[styles.premiumCardContent, { backgroundColor: '#FFFFFF' }]}>
                <View style={styles.orderCardLeft}>
                  <View style={[styles.statusIconWrap, { backgroundColor: '#F1F5F9' }]} />
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <View style={[styles.skeletonTitle, { width: '50%', height: 14, marginBottom: 6, marginTop: 0 }]} />
                    <View style={[styles.skeletonTitle, { width: '30%', height: 11, marginTop: 0 }]} />
                  </View>
                </View>
                <View style={[styles.skeletonValue, { width: 70, height: 24, borderRadius: 12 }]} />
              </View>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );

  const features = [
    { title: t('customers.addNew', 'Add Customer'), icon: Plus, screen: 'AddCustomer', color: '#EC4899', bg: '#FDF2F8' },
    { title: 'Products', icon: Package, screen: 'ProductCatalog', color: '#F59E0B', bg: '#FFFBEB' },
    { title: t('subscriptions.title'), icon: Repeat, screen: 'SubscriptionList', color: '#10B981', bg: '#ECFDF5' },
    { title: t('deliveries.allRoutes'), icon: MapPin, screen: 'RouteList', color: '#3B82F6', bg: '#EFF6FF' },
    { title: t('invoices.title', 'Invoices'), icon: FileText, screen: 'InvoiceList', color: '#6366F1', bg: '#EEF2FF' },
    { title: 'All Deliveries', icon: Calendar, screen: 'PastDeliveries', color: '#EF4444', bg: '#FEF2F2' },
  ];

  return (
    <SafeAreaView 
      style={[styles.container, { paddingTop: Platform.OS === 'android' ? 15 : 0 }]} 
      edges={Platform.OS === 'ios' ? ['top', 'left', 'right'] : ['left', 'right']}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {(loadingStats || loadingDeliveries) ? (
          renderWholeScreenSkeleton()
        ) : (
          <>
            {/* Interactive Overview Cards with Minimal Colors */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.overviewTitle') || 'Business Snapshot'}</Text>
            </View>
            
            <View style={styles.overviewGrid}>
              <View style={styles.overviewRow}>
                {/* Customers Card */}
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  style={styles.overviewCardQuart}
                  onPress={() => navigation.navigate('MainDrawer', { screen: 'MainTabs', params: { screen: 'Customers' }})}
                >
                  <AnimatedIcon source={require('../../../assets/customerstats.png')} delay={0} />
                  <Text style={styles.overviewTitleMinimal} numberOfLines={1}>{t('tabs.customers')}</Text>
                  <Text style={styles.overviewValueMinimal}>{stats.customers}</Text>
                </TouchableOpacity>

                {/* Subscriptions Card */}
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  style={styles.overviewCardQuart}
                  onPress={() => navigation.navigate('SubscriptionList')}
                >
                  <BarGraph color="#10B981" delay={150} />
                  <Text style={styles.overviewTitleMinimal} numberOfLines={1}>{t('customers.activeSubscriptions')}</Text>
                  <Text style={styles.overviewValueMinimal}>{stats.subscriptions}</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.overviewRow, { marginBottom: 0 }]}>
                {/* Routes Card */}
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  style={styles.overviewCardQuart}
                  onPress={() => navigation.navigate('RouteList')}
                >
                  <MapBackground color="#6366F1" delay={300} />
                  <Text style={styles.overviewTitleMinimal} numberOfLines={1}>{t('deliveries.allRoutes')}</Text>
                  <Text style={styles.overviewValueMinimal}>{stats.routes}</Text>
                </TouchableOpacity>

                {/* One Time Orders Card */}
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  style={styles.overviewCardQuart}
                  onPress={() => navigation.navigate('OneTimeOrderList')}
                >
                  <AnimatedLucideIcon Icon={ShoppingBag} color="#000000" delay={450} size={45} />
                  <Text style={styles.overviewTitleMinimal} numberOfLines={1}>{t('oneTimeOrders.title')}</Text>
                  <Text style={styles.overviewValueMinimal}>{stats.oneTimeOrders}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Actions / Business Services */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.quickActionsTitle') || 'Quick Actions'}</Text>
            </View>
            <View style={styles.servicesGrid}>
              {features.map((feature, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.serviceItem}
                  activeOpacity={0.65}
                  onPress={() => navigation.navigate(feature.screen)}
                >
                  <View style={[styles.serviceIconWrap, { backgroundColor: feature.bg }]}>
                    <feature.icon size={26} color={feature.color} strokeWidth={2.5} />
                  </View>
                  <Text style={styles.serviceText}>{feature.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Today's Orders / Premium List */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Orders</Text>
            </View>

            <View style={styles.ordersListContainer}>
              {!Array.isArray(todaysDeliveries) || todaysDeliveries.length === 0 ? (
                <View style={styles.emptyOrdersBox}>
                  <View style={styles.emptyIconBg}>
                    <Truck size={28} color={COLORS.primary} strokeWidth={2} />
                  </View>
                  <Text style={styles.emptyOrdersTitle}>You're all caught up!</Text>
                  <Text style={styles.emptyOrdersText}>No orders scheduled for today.</Text>
                </View>
              ) : (
                todaysDeliveries.slice(0, 5).map((item, idx) => {
                  let statusColor = COLORS.warning;
                  let bgHighlight = '#FFFBEB';
                  let StatusIcon = AlertCircle;
                  let statusText = 'PENDING';
                  
                  if (item.status === 'delivered') {
                    statusColor = COLORS.success;
                    bgHighlight = '#ECFDF5';
                    StatusIcon = CheckCircle2;
                    statusText = 'DELIVERED';
                  } else if (item.status === 'skipped') {
                    statusColor = COLORS.danger;
                    bgHighlight = '#FEF2F2';
                    StatusIcon = XCircle;
                    statusText = 'SKIPPED';
                  }
                  
                  return (
                    <TouchableOpacity 
                      key={item.id || idx} 
                      style={[styles.premiumOrderCard, { borderLeftColor: statusColor }]}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('MainDrawer', { screen: 'MainTabs', params: { screen: 'Deliveries' }})}
                    >
                      <View style={styles.premiumCardContent}>
                        <View style={styles.orderCardLeft}>
                          <View style={[styles.statusIconWrap, { backgroundColor: bgHighlight }]}>
                            <StatusIcon size={20} color={statusColor} />
                          </View>
                          <View style={{ flex: 1, paddingRight: 10 }}>
                            <Text style={styles.orderCustomerName} numberOfLines={1}>
                              {item.Customer?.name || 'Customer'}
                            </Text>
                            <Text style={styles.orderProductInfo} numberOfLines={1}>
                              {item.Subscription?.Product?.name || 'Product'} • Qty: {item.Subscription?.baseQuantity || 1}
                            </Text>
                          </View>
                        </View>
                        <View style={[styles.orderStatusBadge, { backgroundColor: bgHighlight }]}>
                          <Text style={[styles.orderStatusText, { color: statusColor }]}>
                            {statusText}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
            
            {Array.isArray(todaysDeliveries) && todaysDeliveries.length > 5 && (
              <TouchableOpacity 
                style={styles.viewAllBottomBtn}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('MainDrawer', { screen: 'MainTabs', params: { screen: 'Deliveries' }})}
              >
                <Text style={styles.viewAllBottomText}>View All Deliveries</Text>
              </TouchableOpacity>
            )}
            
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Geologica-Bold',
    color: '#0F172A',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: COLORS.primary,
  },
  viewAllBottomBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewAllBottomText: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: COLORS.primary,
  },
  
  // Overview Grid (Minimal but Attractive)
  overviewGrid: {
    marginBottom: 16,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
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
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  overviewTitleMinimal: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: '#64748B',
    marginBottom: 6,
    zIndex: 10,
    maxWidth: '85%',
  },
  overviewValueMinimal: {
    fontSize: 26,
    fontFamily: 'Geologica-Bold',
    color: '#0F172A',
    zIndex: 10,
  },

  // Services Grid
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  serviceItem: {
    width: '31%',
    alignItems: 'center',
    marginBottom: 20,
  },
  serviceIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceText: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: '#334155',
    textAlign: 'center',
  },

  // Premium Orders List
  ordersListContainer: {
    gap: 12,
  },
  emptyOrdersBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyOrdersTitle: {
    fontSize: 16,
    fontFamily: 'Geologica-Bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyOrdersText: {
    fontSize: 14,
    fontFamily: 'Geologica-Medium',
    color: '#64748B',
  },
  premiumOrderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  premiumCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderLeftWidth: 0,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  orderCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderCustomerName: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: '#0F172A',
    marginBottom: 3,
  },
  orderProductInfo: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: '#64748B',
  },
  orderStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  orderStatusText: {
    fontSize: 10,
    fontFamily: 'Geologica-Bold',
  },

  // Skeleton
  skeletonTitle: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  skeletonValue: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
});

export default HomeScreen;
