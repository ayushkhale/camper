import React, { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import MainDrawer from './MainDrawer';
import CompleteRegistrationScreen from '../Screens/Auth/CompleteRegistrationScreen';
import StaffManagementScreen from '../Screens/Main/StaffManagementScreen';
import AddStaffScreen from '../Screens/Main/AddStaffScreen';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import { COLORS } from '../constants/colors';

const Stack = createNativeStackNavigator();

const RootNavigatorContent = () => {
  const { isLoading, userToken, user } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userToken === null ? (
        <Stack.Screen name="AuthStack" component={AuthStack} />
      ) : user?.vendorAccountId === null ? (
        <Stack.Screen name="CompleteRegistration" component={CompleteRegistrationScreen} />
      ) : (
        <>
          <Stack.Screen name="MainDrawer" component={MainDrawer} />
          <Stack.Screen name="StaffManagement" component={StaffManagementScreen} />
          <Stack.Screen name="AddStaff" component={AddStaffScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

const RootNavigator = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigatorContent />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default RootNavigator;
