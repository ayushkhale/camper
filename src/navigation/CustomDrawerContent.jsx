import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { ChevronRight, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/colors';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

const CustomDrawerContent = (props) => {
  const { t } = useTranslation();
  const { user, userToken, logout } = useContext(AuthContext);
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
    { title: t('tabs.home'), type: 'navigate', screen: 'MainTabs', params: { screen: 'Home' } },
    { title: t('deliveries.allRoutes'), type: 'navigate', screen: 'RouteList' },
    { title: t('tabs.customers'), type: 'navigate', screen: 'MainTabs', params: { screen: 'Customers' } },
    { title: t('deliveries.unbilledDeliveries'), type: 'navigate', screen: 'UnbilledDeliveries', ownerOnly: true },
    { title: t('invoices.title'), type: 'navigate', screen: 'InvoiceList' },
    { title: t('routes.customerSequence'), type: 'navigate', screen: 'RouteBuilder', ownerOnly: true },
    { title: t('subscriptions.title'), type: 'navigate', screen: 'SubscriptionList' },
    { title: t('oneTimeOrders.title'), type: 'navigate', screen: 'OneTimeOrderList' },
    { title: t('products.title'), type: 'navigate', screen: 'ProductCatalog' },
    { title: t('staff.title'), type: 'navigate', screen: 'StaffManagement', ownerOnly: true },
    { title: t('tabs.reports') || 'Reports & Analytics', type: 'navigate', screen: 'Reports', ownerOnly: true },
    { title: t('settings.title'), type: 'navigate', screen: 'Settings', ownerOnly: true },
    { title: t('settings.logout'), type: 'logout' },
  ];

  const menuItems = allMenuItems.filter(item => !(user?.role === 'staff' && item.ownerOnly));

  const handlePress = (item) => {
    navigation.closeDrawer();
    if (item.type === 'navigate') {
      navigation.navigate(item.screen, item.params);
    } else if (item.type === 'logout') {
      Alert.alert(t('settings.logout'), t('settings.logoutConfirm'), [
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
                <Stop offset="0%" stopColor="#9DCFFD" />
                <Stop offset="25%" stopColor="#BEDDFE" />
                <Stop offset="50%" stopColor="#D6E9FC" />
                <Stop offset="75%" stopColor="#C1DFFE" />
                <Stop offset="100%" stopColor="#A1D0FD" />
              </SvgLinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#bgGrad)" />
          </Svg>
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
              <Text style={[
                styles.itemText,
                isActive && styles.activeItemText,
                item.type === 'logout' && { color: COLORS.danger }
              ]}>
                {item.title}
              </Text>
              {item.type !== 'logout' && (
                <ChevronRight size={18} color={isActive ? COLORS.primary : COLORS.textPlaceholder} strokeWidth={2.5} />
              )}
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
    color: '#0B409C',
    fontWeight: '700',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 14,
    fontFamily: 'Rubik-SemiBold',
    color: '#1E293B',
    marginBottom: 2,
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'Rubik-Medium',
    color: '#334155',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
  activeMenuItem: {
    backgroundColor: COLORS.primaryLight,
  },
  itemText: {
    fontSize: 14.5,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  activeItemText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default CustomDrawerContent;
