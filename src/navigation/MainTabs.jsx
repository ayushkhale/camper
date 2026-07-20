import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Truck, Package, Users, Menu, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/colors';
import HomeScreen from '../Screens/Main/HomeScreen';
import OrdersScreen from '../Screens/Main/OrdersScreen';
import ProductCatalogScreen from '../Screens/Main/ProductCatalogScreen';
import CustomerListScreen from '../Screens/Main/CustomerListScreen';

const Tab = createBottomTabNavigator();

const DummyScreen = () => <View style={{ flex: 1, backgroundColor: COLORS.background }} />;

const HomeHeader = () => {
  const navigation = useNavigation();
  
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.toggleDrawer()}>
        <Menu color={COLORS.textPrimary} size={28} />
      </TouchableOpacity>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/hindilogo.png')} 
          style={{ height: 42, width: 140 }} 
          resizeMode="contain" 
        />
      </View>
      <TouchableOpacity>
        <User color={COLORS.textPrimary} size={26} />
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
          fontFamily: 'Poppins-Medium',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const iconSize = 20; // Reduced size
          if (route.name === 'Home') return <Home color={color} size={iconSize} />;
          if (route.name === 'Deliveries') return <Truck color={color} size={iconSize} />;
          if (route.name === 'Products') return <Package color={color} size={iconSize} />;
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
        name="Products" 
        component={ProductCatalogScreen} 
        options={{ tabBarLabel: t('tabs.products') }}
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
});

export default MainTabs;
