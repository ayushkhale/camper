import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Truck, Users, Bell, CreditCard, Menu } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/colors';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import HomeScreen from '../Screens/Main/HomeScreen';
import OrdersScreen from '../Screens/Main/OrdersScreen';
import PaymentsScreen from '../Screens/Main/PaymentsScreen';
import CustomerListScreen from '../Screens/Main/CustomerListScreen';

const Tab = createBottomTabNavigator();

const HomeHeader = () => {
  const { i18n } = useTranslation();
  const navigation = useNavigation();
  const { userToken, user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (userToken) {
          const res = await api.getVendorProfile(userToken);
          if (res.success && res.profile) {
            setProfile(res.profile);
          }
        }
      } catch (e) {
        console.error('Failed to fetch profile in HomeHeader', e);
      }
    };
    fetchProfile();
  }, [userToken]);

  const vendorLogo = profile?.logoUrl || profile?.imageUrl || user?.logoUrl || user?.imageUrl;

  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.toggleDrawer()}
        activeOpacity={0.7}
      >
        <Menu color="#000000" size={28} strokeWidth={2} />
      </TouchableOpacity>

      <View style={styles.logoContainer}>
        <Image
          source={i18n.language === 'hi' ? require('../../assets/hindilogo.png') : require('../../assets/englishlogo.png')}
          style={{ height: 38, width: 130 }}
          resizeMode="contain"
        />
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('MainDrawer', { screen: 'Settings' })} activeOpacity={0.7}>
        {vendorLogo ? (
          <Image source={{ uri: vendorLogo }} style={styles.vendorAvatar} />
        ) : (
          <Image source={require('../../assets/customerfallback.png')} style={styles.vendorAvatar} />
        )}
      </TouchableOpacity>
    </View>
  );
};

const MainTabs = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
          paddingTop: 8,
          paddingBottom: Math.max(20, insets.bottom), // Force min 20px padding
          height: 70 + Math.max(0, insets.bottom), // Force larger height
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Geologica-Medium',
          marginTop: 4,
        },
        tabBarIcon: ({ focused }) => {
          const iconSize = 24;
          const strokeWidth = focused ? 2.5 : 2;

          let IconComponent = Home;
          if (route.name === 'Deliveries') IconComponent = Truck;
          if (route.name === 'Payments') IconComponent = CreditCard;
          if (route.name === 'Customers') IconComponent = Users;

          // Premium Golden Color for active state
          const activeColor = '#D97706';
          const color = focused ? activeColor : '#94A3B8';

          return <IconComponent color={color} size={iconSize} strokeWidth={strokeWidth} />;
        },
        tabBarLabel: ({ focused }) => {
          let label = t('tabs.home');
          if (route.name === 'Deliveries') label = t('tabs.deliveries');
          if (route.name === 'Payments') label = 'Payments';
          if (route.name === 'Customers') label = t('tabs.customers');

          const activeColor = '#D97706';
          const color = focused ? activeColor : '#94A3B8';

          return (
            <Text style={{
              color,
              fontSize: 10,
              fontFamily: focused ? 'Geologica-Bold' : 'Geologica-Medium',
              marginTop: 4
            }}>
              {label}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: true,
          header: () => <HomeHeader />,
          tabBarLabel: t('tabs.home')
        }}
      />
      <Tab.Screen
        name="Deliveries"
        component={OrdersScreen}
        options={{ tabBarLabel: t('tabs.deliveries') }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{ tabBarLabel: 'Payments' }}
      />
      <Tab.Screen
        name="Customers"
        component={CustomerListScreen}
        options={{ tabBarLabel: t('tabs.customers') }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8', // Subtle iOS border
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  }
});

export default MainTabs;
