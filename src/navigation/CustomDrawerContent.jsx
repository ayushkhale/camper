import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, User } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { AuthContext } from '../context/AuthContext';

const CustomDrawerContent = (props) => {
  const { user, logout } = useContext(AuthContext);
  const { navigation } = props;
  const insets = useSafeAreaInsets();

  // Only list screens that actually exist and are registered in navigation
  const menuItems = [
    { title: 'Home', type: 'navigate', screen: 'MainTabs' },
    { title: 'Routes', type: 'navigate', screen: 'RouteList' },
    { title: 'Customers', type: 'navigate', screen: 'CustomerList' },
    { title: 'Subscriptions', type: 'navigate', screen: 'SubscriptionList' },
    { title: 'Product Catalog', type: 'navigate', screen: 'ProductCatalog' },
    { title: 'Staff Management', type: 'navigate', screen: 'StaffManagement' },
    { title: 'Settings', type: 'navigate', screen: 'Settings' },
    { title: 'Logout', type: 'logout' },
  ];

  const handlePress = (item) => {
    navigation.closeDrawer();
    if (item.type === 'navigate') {
      navigation.navigate(item.screen);
    } else if (item.type === 'logout') {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => logout() },
      ]);
    }
  };

  const businessName = user?.businessName || 'My Business';
  const ownerName = user?.ownerName || 'Owner Account';
  const roleDisplay = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Admin';

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left']}>
      {/* Deep Indigo Premium Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 30 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.businessName} numberOfLines={1}>
            {businessName}
          </Text>
          <Text style={styles.ownerName} numberOfLines={1}>
            {ownerName}
          </Text>
          <Text style={styles.roleText}>{roleDisplay}</Text>
        </View>

        {/* User Avatar Circle */}
        <View style={styles.avatarCircle}>
          <User size={28} color={COLORS.textPlaceholder} />
        </View>
      </View>

      {/* Navigation List of Existing Screens */}
      <ScrollView 
        style={styles.menuScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.menuContent}
      >
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => handlePress(item)}
          >
            <Text style={styles.itemText}>{item.title}</Text>
            <ChevronRight size={16} color="#1E3A5F" strokeWidth={2.5} />
          </TouchableOpacity>
        ))}
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
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  businessName: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#CBD5E1',
    marginBottom: 2,
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#94A3B8',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuScroll: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  menuContent: {
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
});

export default CustomDrawerContent;
