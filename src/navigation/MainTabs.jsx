import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import FastImage from 'react-native-fast-image';
import Svg, { Path } from 'react-native-svg';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Truck, Users, Bell, CreditCard, Menu, Droplet } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/colors';
import HomeScreen from '../Screens/Main/HomeScreen';
import OrdersScreen from '../Screens/Main/OrdersScreen';
import PaymentsScreen from '../Screens/Main/PaymentsScreen';
import CustomerListScreen from '../Screens/Main/CustomerListScreen';
import CurvedHeader from '../components/CurvedHeader';

const Tab = createBottomTabNavigator();

const CustomDropletIcon = ({ size = 20, color = "#0B409C", style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    {/* Thick outer droplet path */}
    <Path 
      d="M12 2.5l-.27.27C7.6 7.07 4 11.23 4 15.5 4 19.92 7.58 23.5 12 23.5s8-3.58 8-8c0-4.27-3.6-8.43-7.73-12.54L12 2.5z" 
      stroke={color} 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    {/* Inner swoosh/crescent highlight */}
    <Path 
      d="M7 14.5 C7 17.5 9.5 20 12.5 20.5 C9 19.5 8 16.5 8.5 13.5 C8 13.8 7.5 14 7 14.5 Z"
      fill={color}
    />
  </Svg>
);

const HomeHeader = () => {
  const navigation = useNavigation();

  return (
    <CurvedHeader
      height={120}
      contentStyle={{ paddingTop: 10, paddingBottom: 25 }}
      leftIcon={<Menu color="#0B409C" size={28} strokeWidth={2} />}
      onLeftPress={() => navigation.toggleDrawer()}
      title={(
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: -8 }}>
          <FastImage
            source={require('../../assets/logo1.png')}
            style={{ width: 140, height: 38 }}
            resizeMode="contain"
          />
        </View>
      )}
      rightIcon={(
        <FastImage
          source={require('../../assets/heroSetting.jpeg')}
          style={styles.vendorAvatar}
        />
      )}
      onRightPress={() => navigation.navigate('MainDrawer', { screen: 'Settings' })}
    />
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
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: '#E2E8F0',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          position: 'absolute', // Required for rounded corners to show over content
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          paddingTop: 8,
          paddingBottom: Math.max(20, insets.bottom), // Force min 20px padding
          height: 70 + Math.max(0, insets.bottom), // Force larger height
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Rubik-SemiBold',
          marginTop: 4,
        },
        tabBarIcon: ({ focused }) => {
          const iconSize = 24;
          const strokeWidth = focused ? 2.5 : 2;

          let IconComponent = Home;
          if (route.name === 'Deliveries') IconComponent = Truck;
          if (route.name === 'Payments') IconComponent = CreditCard;
          if (route.name === 'Customers') IconComponent = Users;

          // Match the image: Blue for active, Slate for inactive
          const activeColor = '#1D4ED8'; // Deep blue matching the image
          const inactiveColor = '#64748B'; // Slate gray
          const color = focused ? activeColor : inactiveColor;

          return <IconComponent color={color} size={iconSize} strokeWidth={strokeWidth} />;
        },
        tabBarLabel: ({ focused }) => {
          let label = t('tabs.home');
          if (route.name === 'Deliveries') label = t('tabs.deliveries');
          if (route.name === 'Payments') label = t('tabs.payments');
          if (route.name === 'Customers') label = t('tabs.customers');

          const activeColor = '#1D4ED8';
          const inactiveColor = '#64748B';
          const color = focused ? activeColor : inactiveColor;

          return (
            <Text style={{
              color,
              fontSize: 10,
              fontFamily: focused ? 'Rubik-Bold' : 'Rubik-SemiBold',
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
        options={{ tabBarLabel: t('tabs.payments') }}
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
    borderWidth: 2,
    borderColor: '#0B409C',
  },
});

export default MainTabs;
