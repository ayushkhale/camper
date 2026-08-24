import React, { useEffect, useState } from 'react';
import { StatusBar, useColorScheme, Platform, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import SpInAppUpdates, { IAUUpdateKind } from 'sp-react-native-in-app-updates';
import { createNavigationContainerRef } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { AlertProvider } from './src/context/AlertContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import './src/i18n';

export const navigationRef = createNavigationContainerRef();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isAuthScreen, setIsAuthScreen] = useState(true);

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
    const checkUpdates = async () => {
      try {
        const inAppUpdates = new SpInAppUpdates(
          false // isDebug
        );
        const result = await inAppUpdates.checkNeedsUpdate();
        if (result.shouldUpdate) {
          let updateOptions = {};
          if (Platform.OS === 'android') {
            // Force immediate update on Android
            updateOptions = {
              updateType: IAUUpdateKind.IMMEDIATE,
            };
          }
          inAppUpdates.startUpdate(updateOptions);
        }
      } catch (e) {
        console.log('In-app update check failed:', e);
      }
    };

    checkUpdates();
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
