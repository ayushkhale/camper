import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import MainTabs from './MainTabs';
import SettingsScreen from '../Screens/Main/SettingsScreen';
import CustomDrawerContent from './CustomDrawerContent';
import { Home, Settings } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

const Drawer = createDrawerNavigator();

const MainDrawer = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerTintColor: COLORS.primary,
        drawerActiveBackgroundColor: COLORS.primary,
        drawerActiveTintColor: COLORS.background,
        drawerInactiveTintColor: COLORS.textPrimary,
        drawerLabelStyle: {
          fontFamily: 'Poppins-Medium',
          fontSize: 13.5,
          marginLeft: -10,
        },
        drawerItemStyle: {
          borderRadius: 8,
          marginBottom: 5,
        }
      }}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={MainTabs} 
        options={{ 
          title: 'Home', 
          headerShown: false,
          drawerIcon: ({ color }) => <Home color={color} size={22} />
        }} 
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ 
          title: 'Settings',
          drawerIcon: ({ color }) => <Settings color={color} size={22} /> 
        }} 
      />
    </Drawer.Navigator>
  );
};

export default MainDrawer;
