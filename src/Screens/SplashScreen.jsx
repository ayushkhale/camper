import React, { useEffect } from 'react';
import {
  StyleSheet,
  StatusBar,
  ImageBackground,
  View
} from 'react-native';

const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    // Show splash for 3 seconds then instantly unmount to prevent underlying background bleed
    const timer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <ImageBackground
        source={require('../../assets/splash.png')}
        style={styles.backgroundImage}
        resizeMode="stretch"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default SplashScreen;
