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
  Package, MapPin, Repeat, ShoppingBag, FileText, Calendar, Truck, CheckCircle2, XCircle, AlertCircle, UserPlus, Plus, Clock
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
    <View style={{ gap: 16, marginTop: 10 }}>
      {/* Daily Progress Skeleton */}
      <View>
        <Animated.View style={[styles.skeletonTitle, { width: 140, height: 20, marginBottom: 12, opacity: pulseAnim }]} />
        <Animated.View style={[styles.progressCard, { height: 160, opacity: pulseAnim, padding: 20, justifyContent: 'space-between' }]}>
          <View>
            <View style={[styles.skeletonTitle, { width: 100, height: 14, backgroundColor: 'rgba(255,255,255,0.4)', marginTop: 0, marginBottom: 8 }]} />
            <View style={[styles.skeletonTitle, { width: 180, height: 32, backgroundColor: 'rgba(255,255,255,0.4)', marginTop: 0 }]} />
          </View>
          <View style={[styles.skeletonTitle, { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.3)', marginTop: 0, borderRadius: 4 }]} />
        </Animated.View>
      </View>

      {/* 2x2 Stats Grid Skeleton */}
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <Animated.View style={[styles.statCard, { opacity: pulseAnim, height: 90, padding: 16, justifyContent: 'space-between' }]}>
            <View style={[styles.skeletonTitle, { width: 60, height: 12, marginTop: 0 }]} />
            <View style={[styles.skeletonTitle, { width: 40, height: 24, marginTop: 0 }]} />
          </Animated.View>
          <Animated.View style={[styles.statCard, { opacity: pulseAnim, height: 90, padding: 16, justifyContent: 'space-between' }]}>
            <View style={[styles.skeletonTitle, { width: 60, height: 12, marginTop: 0 }]} />
            <View style={[styles.skeletonTitle, { width: 40, height: 24, marginTop: 0 }]} />
          </Animated.View>
        </View>
        <View style={styles.statsRow}>
          <Animated.View style={[styles.statCard, { opacity: pulseAnim, height: 90, padding: 16, justifyContent: 'space-between' }]}>
            <View style={[styles.skeletonTitle, { width: 80, height: 12, marginTop: 0 }]} />
            <View style={[styles.skeletonTitle, { width: 40, height: 24, marginTop: 0 }]} />
          </Animated.View>
          <Animated.View style={[styles.statCard, { opacity: pulseAnim, height: 90, padding: 16, justifyContent: 'space-between' }]}>
            <View style={[styles.skeletonTitle, { width: 80, height: 12, marginTop: 0 }]} />
            <View style={[styles.skeletonTitle, { width: 40, height: 24, marginTop: 0 }]} />
          </Animated.View>
        </View>
      </View>

      {/* Next Delivery Skeleton */}
      <Animated.View style={[styles.nextDeliveryCardOptionA, { opacity: pulseAnim, height: 80, padding: 16, flexDirection: 'row', alignItems: 'center' }]}>
        <View style={[styles.skeletonCircle, { width: 40, height: 40, borderRadius: 20, marginRight: 12 }]} />
        <View style={{ flex: 1 }}>
          <View style={[styles.skeletonTitle, { width: 100, height: 14, marginTop: 0, marginBottom: 8 }]} />
          <View style={[styles.skeletonTitle, { width: 180, height: 12, marginTop: 0 }]} />
        </View>
      </Animated.View>

      {/* Quick Actions Skeleton */}
      <View>
        <Animated.View style={[styles.skeletonTitle, { width: 120, height: 20, marginBottom: 16, opacity: pulseAnim }]} />
        <View style={styles.servicesGridOptionA}>
          {[1, 2, 3, 4, 5, 6].map((key) => (
            <View key={key} style={styles.serviceItemOptionA}>
              <Animated.View style={[styles.serviceCircle, { backgroundColor: '#E2E8F0', opacity: pulseAnim }]} />
              <Animated.View style={[styles.skeletonTitle, { width: 60, height: 12, opacity: pulseAnim, alignSelf: 'center', marginTop: 10 }]} />
            </View>
          ))}
        </View>
      </View>

      {/* Orders Skeleton */}
      <View>
        <Animated.View style={[styles.skeletonTitle, { width: 140, height: 20, marginBottom: 12, opacity: pulseAnim }]} />
        <View style={styles.ordersListContainerOptionA}>
          {[1, 2, 3].map((key) => (
            <Animated.View key={key} style={[styles.orderRowOptionA, { opacity: pulseAnim }]}>
              <View style={styles.orderRowLeft}>
                <View style={styles.customerAvatarPlaceholder} />
                <View style={styles.orderRowInfo}>
                  <View style={[styles.skeletonTitle, { width: 100, height: 14, marginBottom: 8, marginTop: 0 }]} />
                  <View style={[styles.skeletonTitle, { width: 70, height: 12, marginTop: 0 }]} />
                </View>
              </View>
              <View style={styles.orderRowRight}>
                <View style={[styles.skeletonTitle, { width: 50, height: 12, marginBottom: 12, marginTop: 0 }]} />
                <View style={[styles.skeletonValue, { width: 60, height: 20, borderRadius: 10 }]} />
              </View>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );

  const features = [
    { title: t('customers.addNew', 'Add Customer'), icon: Plus, screen: 'AddCustomer', color: '#3B82F6', iconBg: '#EFF6FF' },
    { title: 'Products', icon: Package, screen: 'ProductCatalog', color: '#10B981', iconBg: '#ECFDF5' },
    { title: t('subscriptions.title'), icon: Repeat, screen: 'SubscriptionList', color: '#F59E0B', iconBg: '#FFFBEB' },
    { title: t('deliveries.allRoutes'), icon: MapPin, screen: 'RouteList', color: '#8B5CF6', iconBg: '#F5F3FF' },
    { title: t('invoices.title', 'Invoices'), icon: FileText, screen: 'InvoiceList', color: '#EF4444', iconBg: '#FEF2F2' },
    { title: 'All Deliveries', icon: Calendar, screen: 'PastDeliveries', color: '#6366F1', iconBg: '#EEF2FF' },
  ];

  const totalDeliveries = Array.isArray(todaysDeliveries) ? todaysDeliveries.length : 0;
  const completedDeliveries = Array.isArray(todaysDeliveries) 
    ? todaysDeliveries.filter(d => (d.status || '').toUpperCase() === 'DELIVERED').length 
    : 0;
  const pendingDeliveries = totalDeliveries - completedDeliveries;
  const deliveryProgress = totalDeliveries === 0 ? 0 : completedDeliveries / totalDeliveries;
  
  const radius = 34;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (deliveryProgress * circumference);

  const nextDelivery = Array.isArray(todaysDeliveries) 
    ? todaysDeliveries.find(d => (d.status || '').toUpperCase() === 'PENDING') 
    : null;

  return (
    <SafeAreaView
      style={styles.container}
      edges={['left', 'right']}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {(loadingStats || loadingDeliveries) ? (
           renderWholeScreenSkeleton()
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Overview</Text>
            </View>

            {/* Daily Delivery Progress Card */}
            <View style={styles.progressCard}>
              <Text style={styles.progressCardTitle}>Daily Delivery Progress</Text>
              <View style={styles.progressRow}>
                <View style={styles.circleContainer}>
                  <Svg width={90} height={90} viewBox="0 0 90 90">
                    <Circle
                      cx="45" cy="45" r={radius}
                      stroke="#EFF6FF" strokeWidth={strokeWidth} fill="none"
                    />
                    <Circle
                      cx="45" cy="45" r={radius}
                      stroke="#0B409C" strokeWidth={strokeWidth} fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      transform="rotate(-90 45 45)"
                    />
                  </Svg>
                  <View style={styles.circleTextContainer}>
                    <Text style={styles.circleTextBig}>{completedDeliveries}</Text>
                    <Text style={styles.circleTextSmall}>/{totalDeliveries}</Text>
                  </View>
                </View>

                <View style={styles.progressInfo}>
                  <Text style={styles.remainingText}>{pendingDeliveries} remaining</Text>
                  <Text style={styles.encouragingText}>Stay on track, you've got this!</Text>
                  <View style={styles.routeBadge}>
                    <MapPin size={12} color="#0B409C" style={{ marginRight: 4 }} />
                    <Text style={styles.routeBadgeText}>Today's Deliveries</Text>
                  </View>
                </View>
                
                {/* Fallback 3D illustration */}
                <Image source={require('../../../assets/delivery_rickshaw.png')} style={styles.illustrationImage} />
              </View>
            </View>

            {/* 2x2 Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <TouchableOpacity style={styles.statCard} activeOpacity={0.7} onPress={() => navigation.navigate('MainDrawer', { screen: 'MainTabs', params: { screen: 'Customers' } })}>
                  <Text style={styles.statLabel}>Customers</Text>
                  <Text style={styles.statValue}>{stats.customers}</Text>
                  <View style={styles.statFooterRow}>
                    <Text style={styles.statSubText}>+ Total</Text>
                    <UserPlus size={18} color="#3B82F6" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.statCard} activeOpacity={0.7} onPress={() => navigation.navigate('SubscriptionList')}>
                  <Text style={styles.statLabel}>Active Subscriptions</Text>
                  <Text style={styles.statValue}>{stats.subscriptions}</Text>
                  <View style={styles.statFooterRow}>
                    <Text style={styles.statSubText}>+ Active</Text>
                    <Repeat size={18} color="#10B981" />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.statsRow}>
                <TouchableOpacity style={styles.statCard} activeOpacity={0.7} onPress={() => navigation.navigate('RouteList')}>
                  <Text style={styles.statLabel}>Routes</Text>
                  <Text style={styles.statValue}>{stats.routes}</Text>
                  <View style={styles.statFooterRow}>
                    <Text style={[styles.statSubText, { color: '#059669' }]}>+ Scheduled</Text>
                    <MapPin size={18} color="#059669" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.statCard} activeOpacity={0.7} onPress={() => navigation.navigate('OneTimeOrderList')}>
                  <Text style={styles.statLabel}>One-Time Orders</Text>
                  <Text style={styles.statValue}>{stats.oneTimeOrders}</Text>
                  <View style={styles.statFooterRow}>
                    <Text style={styles.statSubText}>+ Pending</Text>
                    <Package size={18} color="#F59E0B" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Next Delivery Card */}
            {nextDelivery && (
              <TouchableOpacity style={styles.nextDeliveryCardOptionA} activeOpacity={0.8} onPress={() => navigation.navigate('MainDrawer', { screen: 'MainTabs', params: { screen: 'Deliveries' } })}>
                <View style={styles.nextDeliveryLeft}>
                  <View style={styles.clockIconOutline}>
                    <Clock size={18} color="#3B82F6" />
                  </View>
                  <View style={styles.nextDeliveryInfo}>
                    <Text style={styles.nextDeliveryTitle}>Next delivery</Text>
                    <Text style={styles.nextDeliveryName} numberOfLines={1}>
                      10:30 AM • {nextDelivery.Customer?.name || 'Customer'}
                    </Text>
                    <Text style={styles.nextDeliveryAddress} numberOfLines={1}>
                      {nextDelivery.Customer?.address || 'View address'} • Stop 7 of {totalDeliveries}
                    </Text>
                  </View>
                </View>
                <View style={styles.nextDeliveryCenter}>
                  <Image source={require('../../../assets/branded_water_jar.png')} style={styles.jarImage} />
                </View>
                <View style={styles.nextDeliveryRightCircle}>
                  <ChevronRight size={18} color="#3B82F6" />
                </View>
              </TouchableOpacity>
            )}

            {/* Quick Actions */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
            <View style={styles.quickActionsGrid}>
              {features.map((feature, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickActionItem}
                  activeOpacity={0.65}
                  onPress={() => navigation.navigate(feature.screen)}
                >
                  <View style={styles.quickActionCircle}>
                    <feature.icon size={22} color={feature.color} strokeWidth={2.5} />
                  </View>
                  <Text style={styles.quickActionText}>{feature.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Today's Orders / Premium List */}
            <View style={[styles.sectionHeader, { marginTop: 10, marginBottom: 8 }]}>
              <Text style={styles.sectionTitle}>Today's Orders</Text>
            </View>

            <View style={styles.ordersListContainerOptionA}>
              {!Array.isArray(todaysDeliveries) || todaysDeliveries.length === 0 ? (
                <View style={styles.emptyOrdersBox}>
                  <View style={styles.emptyIconBg}>
                    <Truck size={28} color="#3B82F6" strokeWidth={2} />
                  </View>
                  <Text style={styles.emptyOrdersTitle}>You're all caught up!</Text>
                  <Text style={styles.emptyOrdersText}>No orders scheduled for today.</Text>
                </View>
              ) : (
                todaysDeliveries.slice(0, 5).map((item, idx) => {
                  let statusColor = '#F59E0B'; // warning (orange)
                  let bgHighlight = '#FFFBEB'; // warning bg
                  let statusText = 'PENDING';

                  if (item.status === 'delivered') {
                    statusColor = '#10B981'; // success
                    bgHighlight = '#ECFDF5';
                    statusText = 'DELIVERED';
                  } else if (item.status === 'skipped') {
                    statusColor = '#EF4444'; // danger
                    bgHighlight = '#FEF2F2';
                    statusText = 'SKIPPED';
                  }

                  const qty = item.Subscription?.baseQuantity || 1;

                  return (
                    <TouchableOpacity
                      key={item.id || idx}
                      style={styles.orderRowOptionA}
                      activeOpacity={0.7}
                      onPress={() => navigation.navigate('MainDrawer', { screen: 'MainTabs', params: { screen: 'Deliveries' } })}
                    >
                      <View style={styles.orderRowLeft}>
                        <View style={styles.customerAvatarPlaceholder}>
                          <UserPlus size={16} color="#64748B" />
                        </View>
                        <View style={styles.orderRowInfo}>
                          <Text style={styles.orderRowName} numberOfLines={1}>
                            {item.Customer?.name || 'Customer'}
                          </Text>
                          <Text style={styles.orderRowProduct} numberOfLines={1}>
                            {qty} jar{qty > 1 ? 's' : ''} - 20L
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.orderRowRight}>
                        <Text style={styles.orderRowTime}>10:30 AM</Text>
                        <View style={[styles.orderRowBadge, { backgroundColor: bgHighlight }]}>
                          <Text style={[styles.orderRowBadgeText, { color: statusColor }]}>
                            {statusText}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            <TouchableOpacity 
              style={{ marginHorizontal: 16, marginTop: 12, marginBottom: 30, paddingVertical: 14, backgroundColor: '#EFF6FF', borderRadius: 12, alignItems: 'center' }}
              onPress={() => navigation.navigate('MainDrawer', { screen: 'MainTabs', params: { screen: 'Deliveries' } })}
            >
              <Text style={{ color: '#1D4ED8', fontFamily: 'Geologica-Bold', fontSize: 15 }}>View All Deliveries</Text>
            </TouchableOpacity>

            <View style={{ height: 10 }} />

          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const ChevronRight = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 18l6-6-6-6" />
  </Svg>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 120, // Increased to ensure the bottom button is not hidden by navigation
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Geologica-Bold',
    color: '#1E293B',
  },
  
  // Progress Card Option A style
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  progressCardTitle: {
    fontSize: 13,
    fontFamily: 'Geologica-Bold',
    color: '#3B82F6',
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleContainer: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleTextContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  circleTextBig: {
    fontSize: 22,
    fontFamily: 'Geologica-Bold',
    color: '#0F172A',
  },
  circleTextSmall: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: '#64748B',
  },
  progressInfo: {
    flex: 1,
    paddingLeft: 12,
  },
  remainingText: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  encouragingText: {
    fontSize: 10,
    fontFamily: 'Geologica-Medium',
    color: '#64748B',
    marginBottom: 8,
  },
  routeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  routeBadgeText: {
    fontSize: 9,
    fontFamily: 'Geologica-Bold',
    color: '#0B409C',
  },
  illustrationImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginLeft: 8,
  },

  // Stats Grid 2x2
  statsGrid: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: '#475569',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Geologica-Bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  statFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  statSubText: {
    fontSize: 10,
    fontFamily: 'Geologica-Medium',
    color: '#10B981',
  },

  // Next Delivery Card (Option A style)
  nextDeliveryCardOptionA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F9FF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  nextDeliveryLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  clockIconOutline: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  nextDeliveryInfo: {
    flex: 1,
  },
  nextDeliveryTitle: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: '#3B82F6',
    marginBottom: 6,
  },
  nextDeliveryName: {
    fontSize: 11,
    fontFamily: 'Geologica-Bold',
    color: '#334155',
    marginBottom: 4,
  },
  nextDeliveryAddress: {
    fontSize: 10,
    fontFamily: 'Geologica-Medium',
    color: '#64748B',
  },
  nextDeliveryCenter: {
    marginHorizontal: 10,
  },
  jarImage: {
    width: 45,
    height: 60,
    resizeMode: 'contain',
  },
  nextDeliveryRightCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // Quick Actions Grid
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  quickActionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  quickActionText: {
    fontSize: 10,
    fontFamily: 'Geologica-Bold',
    color: '#475569',
    textAlign: 'center',
  },

  // Premium Orders List (Option A layout)
  viewAllTopText: {
    fontSize: 12,
    fontFamily: 'Geologica-Bold',
    color: '#3B82F6',
  },
  ordersListContainerOptionA: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  orderRowOptionA: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  orderRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderRowInfo: {
    flex: 1,
  },
  orderRowName: {
    fontSize: 12,
    fontFamily: 'Geologica-Bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  orderRowProduct: {
    fontSize: 10,
    fontFamily: 'Geologica-Medium',
    color: '#64748B',
  },
  orderRowRight: {
    alignItems: 'flex-end',
  },
  orderRowTime: {
    fontSize: 10,
    fontFamily: 'Geologica-Medium',
    color: '#64748B',
    marginBottom: 4,
  },
  orderRowBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  orderRowBadgeText: {
    fontSize: 9,
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
  skeletonCircle: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
  }
});

export default HomeScreen;
