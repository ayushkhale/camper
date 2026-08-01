import React, { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import MainDrawer from './MainDrawer';
import CompleteRegistrationScreen from '../Screens/Auth/CompleteRegistrationScreen';
import StaffManagementScreen from '../Screens/Main/StaffManagementScreen';
import PastDeliveriesScreen from '../Screens/Main/PastDeliveriesScreen';
import AddStaffScreen from '../Screens/Main/AddStaffScreen';
import ProductCatalogScreen from '../Screens/Main/ProductCatalogScreen';
import AddProductScreen from '../Screens/Main/AddProductScreen';
import ProductDetailScreen from '../Screens/Main/ProductDetailScreen';
import RouteListScreen from '../Screens/Main/RouteListScreen';
import AddRouteScreen from '../Screens/Main/AddRouteScreen';
import RouteDetailScreen from '../Screens/Main/RouteDetailScreen';
import RouteBuilderScreen from '../Screens/Main/RouteBuilderScreen';
import CustomerListScreen from '../Screens/Main/CustomerListScreen';
import AddCustomerScreen from '../Screens/Main/AddCustomerScreen';
import CustomerDetailScreen from '../Screens/Main/CustomerDetailScreen';
import CustomerHistoryScreen from '../Screens/Main/CustomerHistoryScreen';
import SubscriptionListScreen from '../Screens/Main/SubscriptionListScreen';
import AddSubscriptionScreen from '../Screens/Main/AddSubscriptionScreen';
import SubscriptionDetailScreen from '../Screens/Main/SubscriptionDetailScreen';
import OneTimeOrderListScreen from '../Screens/Main/OneTimeOrderListScreen';
import AddOneTimeOrderScreen from '../Screens/Main/AddOneTimeOrderScreen';
import InvoiceListScreen from '../Screens/Main/InvoiceListScreen';
import InvoiceDetailScreen from '../Screens/Main/InvoiceDetailScreen';
import GenerateInvoiceScreen from '../Screens/Main/GenerateInvoiceScreen';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import { COLORS } from '../constants/colors';

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
  },
};

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
          <Stack.Screen name="ProductCatalog" component={ProductCatalogScreen} />
          <Stack.Screen name="AddProduct" component={AddProductScreen} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
          <Stack.Screen name="EditProduct" component={AddProductScreen} />
          <Stack.Screen name="RouteList" component={RouteListScreen} />
          <Stack.Screen name="AddRoute" component={AddRouteScreen} />
          <Stack.Screen name="RouteDetail" component={RouteDetailScreen} />
          <Stack.Screen name="RouteBuilder" component={RouteBuilderScreen} />
          <Stack.Screen name="CustomerList" component={CustomerListScreen} />
          <Stack.Screen name="AddCustomer" component={AddCustomerScreen} />
          <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
          <Stack.Screen name="CustomerHistory" component={CustomerHistoryScreen} />
          <Stack.Screen name="SubscriptionList" component={SubscriptionListScreen} />
          <Stack.Screen name="AddSubscription" component={AddSubscriptionScreen} />
          <Stack.Screen name="SubscriptionDetail" component={SubscriptionDetailScreen} />
          <Stack.Screen name="OneTimeOrderList" component={OneTimeOrderListScreen} />
          <Stack.Screen name="AddOneTimeOrder" component={AddOneTimeOrderScreen} />
          <Stack.Screen name="InvoiceList" component={InvoiceListScreen} />
          <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
          <Stack.Screen name="GenerateInvoice" component={GenerateInvoiceScreen} />
          <Stack.Screen name="PastDeliveries" component={PastDeliveriesScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

const RootNavigator = () => {
  return (
    <AuthProvider>
      <NavigationContainer theme={MyTheme}>
        <RootNavigatorContent />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default RootNavigator;
