import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  View,
} from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import AuthStack from './AuthStack';
import MainDrawer from './MainDrawer';
import { CompleteRegistrationScreen } from '../../features/auth';
import { AddStaffScreen, StaffManagementScreen } from '../../features/staff';
import { PastDeliveriesScreen } from '../../features/deliveries';
import {
  AddProductScreen,
  ProductCatalogScreen,
  ProductDetailScreen,
} from '../../features/products';
import {
  AddRouteScreen,
  RouteBuilderScreen,
  RouteDetailScreen,
  RouteListScreen,
} from '../../features/routes';
import {
  AddCustomerScreen,
  CustomerDeliveryHistoryScreen,
  CustomerDetailScreen,
  CustomerHistoryScreen,
  CustomerListScreen,
} from '../../features/customers';
import {
  AddSubscriptionScreen,
  SubscriptionDetailScreen,
  SubscriptionListScreen,
} from '../../features/delivery-subscriptions';
import {
  AddOneTimeOrderScreen,
  OneTimeOrderListScreen,
} from '../../features/one-time-orders';
import {
  GenerateInvoiceScreen,
  InvoiceDetailScreen,
  InvoiceListScreen,
} from '../../features/invoices';
import { ReportsScreen } from '../../features/reports';
import { AuthProvider, AuthContext } from '../providers/AuthContext';
import { useAlert } from '../providers/AlertContext';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { setPlanLimitCallback } from '../../shared/services/api';
import { SubscriptionDashboardScreen } from '../../features/plan-billing';
import { COLORS } from '../../shared/constants/colors';
import { EntitlementProvider, useEntitlements } from '../providers/EntitlementContext';
import { ENTITLEMENT_TRANSLATION_KEYS } from '../../shared/constants/subscriptionEntitlements';

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
  const [showSplash, setShowSplash] = useState(true);
  const { showAlert } = useAlert();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const {
    markAllEntitlementsLocked,
    markEntitlementLocked,
  } = useEntitlements();

  React.useEffect(() => {
    setPlanLimitCallback((message, details = {}) => {
      const backendMessage = String(message || '');
      const featureMatch = backendMessage.match(/(?:feature|limit reached for)\s+['"]([^'"]+)['"]/i);
      const featureKey = details.featureKey || featureMatch?.[1]?.toLowerCase();
      const featureTranslationKey = featureKey
        ? ENTITLEMENT_TRANSLATION_KEYS[featureKey]
        : null;

      if (featureKey) {
        markEntitlementLocked(featureKey, backendMessage);
      } else if (
        details.status === 409 ||
        /subscription|trial.*expired|purchase a plan/i.test(backendMessage)
      ) {
        markAllEntitlementsLocked(backendMessage);
      }
      const featureName = featureTranslationKey ? t(featureTranslationKey) : null;
      const isUsageLimit = /limit reached|maximum|current usage/i.test(backendMessage);
      const localizedMessage = featureName
        ? isUsageLimit
          ? t('subscriptionBilling.limitReachedNamed', { feature: featureName })
          : t('subscriptionBilling.featureLockedNamed', { feature: featureName })
        : isUsageLimit
          ? t('subscriptionBilling.limitReachedMessage')
          : /feature.*locked|purchase a plan|trial expired|not included/i.test(backendMessage)
            ? t('subscriptionBilling.featureLockedMessage')
            : t('subscriptionBilling.limitDefaultMessage');

      showAlert(
        t('subscriptionBilling.limitTitle'),
        localizedMessage,
        [
          { 
            text: t('subscriptionBilling.viewPlans'),
            style: 'default',
            onPress: () => {
              if (navigation.isReady()) {
                navigation.navigate('SubscriptionDashboard', {
                  refreshCurrentPlanAt: Date.now(),
                });
              }
            }
          }
        ],
        'subscription',
      );
    });

    return () => setPlanLimitCallback(null);
  }, [markAllEntitlementsLocked, markEntitlementLocked, navigation, showAlert, t]);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

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
          <Stack.Screen name="CustomerDeliveryHistory" component={CustomerDeliveryHistoryScreen} />
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
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen name="SubscriptionDashboard" component={SubscriptionDashboardScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

const RootNavigator = ({ navRef, onRouteReady, onStateChange }) => {
  return (
    <AuthProvider>
      <EntitlementProvider>
        <NavigationContainer theme={MyTheme} ref={navRef} onReady={onRouteReady} onStateChange={onStateChange}>
          <RootNavigatorContent />
        </NavigationContainer>
      </EntitlementProvider>
    </AuthProvider>
  );
};

export default RootNavigator;
