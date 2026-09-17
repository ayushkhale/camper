import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import {
  BarChart3,
  Clock,
  CreditCard,
  FileText,
  History,
  Home,
  ListOrdered,
  Lock,
  LogOut,
  MapPin,
  Package,
  ReceiptText,
  Repeat,
  Settings,
  ShoppingBag,
  UserCog,
  Users,
  ChevronRight,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../shared/constants/colors';
import { AuthContext } from '../providers/AuthContext';
import { useAlert } from '../providers/AlertContext';
import { api } from '../../shared/services/api';
import { useEntitlements } from '../providers/EntitlementContext';
import { ENTITLEMENT_KEYS } from '../../shared/constants/subscriptionEntitlements';

const CustomDrawerContent = (props) => {
  const { t } = useTranslation();
  const { user, userToken, logout } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const { guardEntitlement, isEntitlementLocked } = useEntitlements();
  const { navigation } = props;
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = React.useState(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (userToken) {
          const res = await api.getVendorProfile(userToken);
          if (res.success && res.profile) {
            setProfile(res.profile);
          }
        }
      } catch (e) {
        console.error('Failed to fetch profile for drawer', e);
      }
    };
    fetchProfile();
  }, [userToken]);

  // Only list screens that actually exist and are registered in navigation
  const allMenuItems = [
    { title: t('tabs.home'), icon: Home, type: 'navigate', screen: 'MainTabs', params: { screen: 'Home' } },
    { title: t('deliveries.pastDeliveries') || 'Modify / Past Deliveries', icon: History, type: 'navigate', screen: 'PastDeliveries', featureKey: ENTITLEMENT_KEYS.DELIVERY_TRACKING },
    { title: t('deliveries.allRoutes'), icon: MapPin, type: 'navigate', screen: 'RouteList', featureKey: ENTITLEMENT_KEYS.ROUTE_MANAGEMENT, lockFeatureKeys: [ENTITLEMENT_KEYS.ROUTE_LIMIT] },
    { title: t('tabs.customers'), icon: Users, type: 'navigate', screen: 'MainTabs', params: { screen: 'Customers' }, featureKey: ENTITLEMENT_KEYS.CUSTOMER_MANAGEMENT, lockFeatureKeys: [ENTITLEMENT_KEYS.CUSTOMER_LIMIT] },
    { title: t('deliveries.unbilledDeliveries'), icon: Clock, type: 'navigate', screen: 'UnbilledDeliveries', ownerOnly: true, featureKey: ENTITLEMENT_KEYS.INVOICING },
    { title: t('invoices.title'), icon: ReceiptText, type: 'navigate', screen: 'InvoiceList', featureKey: ENTITLEMENT_KEYS.INVOICING },
    { title: t('routes.customerSequence'), icon: ListOrdered, type: 'navigate', screen: 'RouteBuilder', ownerOnly: true, featureKey: ENTITLEMENT_KEYS.ROUTE_MANAGEMENT },
    { title: t('subscriptions.title'), icon: Repeat, type: 'navigate', screen: 'SubscriptionList', featureKey: ENTITLEMENT_KEYS.SUBSCRIPTION_MANAGEMENT },
    { title: t('oneTimeOrders.title'), icon: ShoppingBag, type: 'navigate', screen: 'OneTimeOrderList', featureKey: ENTITLEMENT_KEYS.ONE_TIME_ORDERS },
    { title: t('products.title'), icon: Package, type: 'navigate', screen: 'ProductCatalog', featureKey: ENTITLEMENT_KEYS.PRODUCT_MANAGEMENT, lockFeatureKeys: [ENTITLEMENT_KEYS.PRODUCT_LIMIT] },
    { title: t('staff.title'), icon: UserCog, type: 'navigate', screen: 'StaffManagement', ownerOnly: true, featureKey: ENTITLEMENT_KEYS.STAFF_MANAGEMENT, lockFeatureKeys: [ENTITLEMENT_KEYS.STAFF_LIMIT], requiredFeatureKeys: [ENTITLEMENT_KEYS.STAFF_LIMIT] },
    { title: t('tabs.reports') || 'Reports & Analytics', icon: BarChart3, type: 'navigate', screen: 'Reports', ownerOnly: true, featureKey: ENTITLEMENT_KEYS.REPORTS_ANALYTICS },
    { title: t('subscriptionBilling.title'), icon: CreditCard, type: 'navigate', screen: 'SubscriptionDashboard', ownerOnly: true },
    { title: t('settings.title'), icon: Settings, type: 'navigate', screen: 'Settings', ownerOnly: true },
    { title: t('settings.logout'), icon: LogOut, type: 'logout' },
  ];

  const menuItems = allMenuItems.filter(item => !(user?.role === 'staff' && item.ownerOnly));

  const handlePress = async (item) => {
    navigation.closeDrawer();
    if (item.type === 'navigate') {
      const navigateToItem = () => navigation.navigate(item.screen, item.params);
      if (item.featureKey) {
        await guardEntitlement(item.featureKey, async () => {
          for (const requiredFeatureKey of item.requiredFeatureKeys || []) {
            const isAllowed = await guardEntitlement(requiredFeatureKey);
            if (!isAllowed) return;
          }
          navigateToItem();
        });
      } else {
        navigateToItem();
      }
    } else if (item.type === 'logout') {
      showAlert(t('settings.logout'), t('settings.logoutConfirm'), [
        { text: t('staff.cancel'), style: 'cancel' },
        { text: t('settings.logout'), style: 'destructive', onPress: () => logout() },
      ]);
    }
  };

  const vendorAccount = profile?.VendorAccounts?.[0];
  const businessName = vendorAccount?.businessName || user?.businessName || 'My Business';
  const ownerName = profile?.name || user?.ownerName || 'Owner Account';
  const roleDisplay = profile?.role
    ? (profile.role.charAt(0).toUpperCase() + profile.role.slice(1))
    : (user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Admin');

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={StyleSheet.absoluteFill}>
          <Svg height="100%" width="100%">
            <Defs>
              <SvgLinearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor="#063A8F" />
                <Stop offset="20%" stopColor="#073996" />
                <Stop offset="45%" stopColor="#043997" />
                <Stop offset="70%" stopColor="#063A99" />
                <Stop offset="100%" stopColor="#043B97" />
              </SvgLinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#bgGrad)" />
          </Svg>
        </View>

        <View style={styles.avatarCircle}>
          <Image source={require('../../../assets/heroSetting.jpeg')} style={styles.avatarImage} />
        </View>

        <View style={styles.headerLeft}>
          <Text style={styles.businessName} numberOfLines={1}>
            {businessName}
          </Text>
          <Text style={styles.ownerName} numberOfLines={1}>
            {ownerName}
          </Text>
          <Text style={styles.roleText}>{roleDisplay}</Text>
        </View>
      </View>

      {/* Navigation List of Existing Screens */}
      <ScrollView
        style={styles.menuScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.menuContent}
      >
        {menuItems.map((item, index) => {
          const ItemIcon = item.icon || FileText;
          const visibleLockKeys = [item.featureKey, ...(item.lockFeatureKeys || [])].filter(Boolean);
          const isLocked = visibleLockKeys.some(isEntitlementLocked);
          let isActive = false;
          if (props.state && item.type === 'navigate') {
            const currentRoute = props.state.routes[props.state.index];
            isActive = currentRoute.name === item.screen;

            if (isActive && item.params?.screen) {
              if (currentRoute.state) {
                // Check nested tab state
                const tabState = currentRoute.state;
                isActive = tabState.routeNames[tabState.index] === item.params.screen;
              } else {
                // If nested state isn't initialized yet, default tab is Home
                isActive = item.params.screen === 'Home';
              }
            }
          }

          return (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, isActive && styles.activeMenuItem]}
              activeOpacity={0.7}
              onPress={() => handlePress(item)}
            >
              <View style={styles.menuItemMain}>
                <View style={[
                  styles.menuIconWrap,
                  isActive && styles.activeMenuIconWrap,
                  item.type === 'logout' && styles.logoutMenuIconWrap,
                  isLocked && styles.lockedMenuIconWrap,
                ]}>
                  <ItemIcon
                    size={18}
                    color={item.type === 'logout'
                      ? COLORS.danger
                      : isLocked
                        ? '#B45309'
                        : isActive
                          ? '#04297A'
                          : COLORS.textSecondary}
                    strokeWidth={2.2}
                  />
                </View>
                <Text style={[
                  styles.itemText,
                  isActive && styles.activeItemText,
                  isLocked && styles.lockedItemText,
                  item.type === 'logout' && styles.logoutItemText,
                ]}>
                  {item.title}
                </Text>
              </View>
              {isLocked ? (
                <View style={styles.lockBadge}>
                  <Lock size={13} color="#B45309" strokeWidth={2.5} />
                </View>
              ) : item.type !== 'logout' ? (
                <ChevronRight size={18} color={isActive ? '#04297A' : COLORS.textPlaceholder} strokeWidth={2.5} />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    backgroundColor: '#0B409C',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#0B409C',
  },
  headerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  businessName: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 14,
    fontFamily: 'Rubik-SemiBold',
    color: '#E2E8F0',
    marginBottom: 2,
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'Rubik-Medium',
    color: '#CBD5E1',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#0B409C',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  menuScroll: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  menuContent: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    marginBottom: 4,
    borderRadius: 16,
  },
  menuItemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activeMenuIconWrap: {
    backgroundColor: 'rgba(4, 41, 122, 0.12)',
  },
  logoutMenuIconWrap: {
    backgroundColor: '#FEF2F2',
  },
  lockedMenuIconWrap: {
    backgroundColor: '#FFF7ED',
  },
  activeMenuItem: {
    backgroundColor: 'rgba(4, 41, 122, 0.08)', // Very soft deep blue background
  },
  itemText: {
    fontSize: 14.5,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  lockedItemText: {
    color: '#92400E',
  },
  logoutItemText: {
    color: COLORS.danger,
  },
  lockBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeItemText: {
    color: '#04297A', // Deep premium blue text
    fontWeight: 'bold',
  },
});

export default CustomDrawerContent;
