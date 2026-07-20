import React, { useState, useContext, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  UserPlus, Package, MapPin, Users, Repeat, LayoutDashboard
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
  const insets = useSafeAreaInsets();

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
    { title: 'Customers', icon: Users, screen: 'CustomerList', color: COLORS.primary },
    { title: 'Subscriptions', icon: Repeat, screen: 'SubscriptionList', color: COLORS.success },
    { title: 'Routes', icon: MapPin, screen: 'RouteList', color: COLORS.warning },
    { title: 'Product Catalog', icon: Package, screen: 'ProductCatalog', color: COLORS.textPrimary },
    { title: 'Staff', icon: UserPlus, screen: 'StaffManagement', color: '#8B5CF6' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={[styles.headerContainer, { paddingTop: insets.top > 0 ? insets.top + 10 : 20 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingText}>Good Morning,</Text>
            <Text style={styles.userName}>{user?.ownerName || 'Admin'}</Text>
          </View>
          <TouchableOpacity style={styles.profileCircle} onPress={() => navigation.openDrawer()}>
            <LayoutDashboard size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Dashboard Overview Stats */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsCard}>
          {loadingStats ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.customers}</Text>
                <Text style={styles.statLabel}>Customers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.subscriptions}</Text>
                <Text style={styles.statLabel}>Active Subs</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.routes}</Text>
                <Text style={styles.statLabel}>Routes</Text>
              </View>
            </View>
          )}
        </View>

        {/* Features Grid */}
        <Text style={styles.sectionTitle}>Dashboard Features</Text>
        <View style={styles.featuresGrid}>
          {features.map((feature, idx) => (
            <TouchableOpacity 
              key={idx}
              style={styles.featureCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(feature.screen)}
            >
              <View style={styles.featureIconWrap}>
                <feature.icon size={24} color={feature.color} strokeWidth={2} />
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
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: COLORS.primary,
  },
  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
    marginLeft: 4,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },
  loadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
});

export default HomeScreen;
