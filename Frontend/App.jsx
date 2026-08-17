import React, { useEffect } from 'react';
import { StatusBar, useColorScheme, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import SpInAppUpdates, { IAUUpdateKind } from 'sp-react-native-in-app-updates';
import RootNavigator from './src/navigation/RootNavigator';
import { AlertProvider } from './src/context/AlertContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import './src/i18n';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

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
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0B409C' }} edges={['top']}>
          <AlertProvider>
            <RootNavigator />
          </AlertProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;