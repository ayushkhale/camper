import React, { useEffect, useRef, useState } from 'react';
import { AppState, Linking, StatusBar, useColorScheme, Platform, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import SpInAppUpdates, {
  IAUAvailabilityStatus,
  IAUInstallStatus,
  IAUUpdateKind,
} from 'sp-react-native-in-app-updates';
import { createNavigationContainerRef } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { AlertProvider } from './src/context/AlertContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import './src/i18n';

export const navigationRef = createNavigationContainerRef();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isAuthScreen, setIsAuthScreen] = useState(true);
  const inAppUpdatesRef = useRef(null);
  const updateCheckInProgressRef = useRef(false);
  const lastUpdateCheckAtRef = useRef(0);

  if (!inAppUpdatesRef.current) {
    inAppUpdatesRef.current = new SpInAppUpdates(false);
  }

  const updateRoute = () => {
    if (navigationRef.isReady()) {
      const route = navigationRef.getCurrentRoute();
      if (route) {
        setIsAuthScreen(['Login', 'Register', 'OtpVerification'].includes(route.name));
      }
    }
    // Force the status bar to remain dark-content regardless of navigation stack cache
    StatusBar.setBarStyle('dark-content', true);
  };

  useEffect(() => {
    const inAppUpdates = inAppUpdatesRef.current;
    let isMounted = true;

    const openPlayStore = async (packageName) => {
      const appId = packageName || 'com.camper.dailybudgetapp';
      try {
        await Linking.openURL(`market://details?id=${appId}`);
      } catch {
        await Linking.openURL(`https://play.google.com/store/apps/details?id=${appId}`);
      }
    };

    const checkUpdates = async (forceCheck = false) => {
      const now = Date.now();
      if (
        !isMounted ||
        updateCheckInProgressRef.current ||
        (!forceCheck && now - lastUpdateCheckAtRef.current < 30000)
      ) {
        return;
      }

      updateCheckInProgressRef.current = true;
      lastUpdateCheckAtRef.current = now;

      try {
        const result = await inAppUpdates.checkNeedsUpdate();
        console.log('In-app update check result:', result);

        if (Platform.OS !== 'android') {
          if (result.shouldUpdate) {
            await inAppUpdates.startUpdate({});
          }
          return;
        }

        const updateInfo = result.other || {};
        const updateAvailable = result.shouldUpdate ||
          updateInfo.updateAvailability === IAUAvailabilityStatus.AVAILABLE;

        if (!updateAvailable) return;

        if (updateInfo.isImmediateUpdateAllowed) {
          await inAppUpdates.startUpdate({ updateType: IAUUpdateKind.IMMEDIATE });
        } else if (updateInfo.isFlexibleUpdateAllowed) {
          await inAppUpdates.startUpdate({ updateType: IAUUpdateKind.FLEXIBLE });
        } else {
          console.warn('Play Store update is available, but an in-app update flow is not allowed.');
          await openPlayStore(updateInfo.packageName);
        }
      } catch (e) {
        console.warn('In-app update check failed:', e);
      } finally {
        updateCheckInProgressRef.current = false;
      }
    };

    checkUpdates();

    const retryTimer = setTimeout(() => {
      checkUpdates(true);
    }, 5000);

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkUpdates();
      }
    });

    const handleUpdateStatus = ({ status }) => {
      if (status === IAUInstallStatus.DOWNLOADED) {
        inAppUpdates.installUpdate();
      }
    };

    if (Platform.OS === 'android') {
      inAppUpdates.addStatusUpdateListener(handleUpdateStatus);
    }

    return () => {
      isMounted = false;
      clearTimeout(retryTimer);
      appStateSubscription.remove();
      if (Platform.OS === 'android') {
        inAppUpdates.removeStatusUpdateListener(handleUpdateStatus);
      }
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />
        <SafeAreaView
          style={{ flex: 1, backgroundColor: 'transparent' }}
          edges={['top']}
        >
          {/* Add the Linear Gradient as an absolute background layer */}
          <View style={StyleSheet.absoluteFill}>
            <Svg height="100%" width="100%">
              <Defs>
                <LinearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%" stopColor="#9DCFFD" />
                  <Stop offset="25%" stopColor="#BEDDFE" />
                  <Stop offset="50%" stopColor="#D6E9FC" />
                  <Stop offset="75%" stopColor="#C1DFFE" />
                  <Stop offset="100%" stopColor="#A1D0FD" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#bgGrad)" />
            </Svg>
          </View>
          <AlertProvider>
            <RootNavigator
              navRef={navigationRef}
              onRouteReady={updateRoute}
              onStateChange={updateRoute}
            />
          </AlertProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
