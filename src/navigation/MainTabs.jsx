import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Truck, Users, Bell, CreditCard } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/colors';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import HomeScreen from '../Screens/Main/HomeScreen';
import OrdersScreen from '../Screens/Main/OrdersScreen';
import PaymentsScreen from '../Screens/Main/PaymentsScreen';
import CustomerListScreen from '../Screens/Main/CustomerListScreen';

const Tab = createBottomTabNavigator();

const DummyScreen = () => <View style={{ flex: 1, backgroundColor: COLORS.background }} />;

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
      <TouchableOpacity onPress={() => navigation.toggleDrawer()} activeOpacity={0.7}>
        {vendorLogo ? (
          <Image source={{ uri: vendorLogo }} style={styles.vendorAvatar} />
        ) : (
          <Image source={require('../../assets/customerfallback.png')} style={styles.vendorAvatar} />
        )}
      </TouchableOpacity>
      <View style={styles.logoContainer}>
        <Image 
          source={i18n.language === 'hi' ? require('../../assets/hindilogo.png') : require('../../assets/englishlogo.png')} 
          style={{ height: 42, width: 140 }} 
          resizeMode="contain" 
        />
      </View>
      <TouchableOpacity activeOpacity={0.7} onPress={() => Alert.alert('Notifications', 'No new notifications')}>
        <Bell color={COLORS.textPrimary} size={24} />
      </TouchableOpacity>
    </View>
  );
};

const MainTabs = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          paddingTop: 5,
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontFamily: 'Geologica-Medium',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const iconSize = 20; // Reduced size
          if (route.name === 'Home') return <Home color={color} size={iconSize} />;
          if (route.name === 'Deliveries') return <Truck color={color} size={iconSize} />;
          if (route.name === 'Payments') return <CreditCard color={color} size={iconSize} />;
          if (route.name === 'Customers') return <Users color={color} size={iconSize} />;
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: COLORS.background, 
  },
  logoContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
  },
});

export default MainTabs;
