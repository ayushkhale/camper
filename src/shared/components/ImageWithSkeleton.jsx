import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';

const ImageWithSkeleton = ({ source, style, resizeMode = FastImage.resizeMode.contain }) => {
  const [isLoading, setIsLoading] = useState(true);
  const skeletonOpacity = useRef(new Animated.Value(0.45)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading) return undefined;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonOpacity, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(skeletonOpacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, [isLoading, skeletonOpacity]);

  const revealImage = () => {
    Animated.timing(imageOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setIsLoading(false));
  };

  const stopSkeletonOnError = () => {
    imageOpacity.setValue(1);
    setIsLoading(false);
  };

  return (
    <View style={style}>
      {isLoading && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.skeleton, { opacity: skeletonOpacity }]}
        >
          <View style={styles.skeletonArtwork} />
          <View style={styles.skeletonLineWide} />
          <View style={styles.skeletonLineShort} />
        </Animated.View>
      )}

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: imageOpacity }]}>
        <FastImage
          source={source}
          style={StyleSheet.absoluteFill}
          resizeMode={resizeMode}
          onLoad={revealImage}
          onError={stopSkeletonOnError}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#F8FBFF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonArtwork: {
    width: '64%',
    height: '55%',
    borderRadius: 100,
    backgroundColor: '#DBEAFE',
    marginBottom: 18,
  },
  skeletonLineWide: {
    width: '48%',
    height: 11,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    marginBottom: 9,
  },
  skeletonLineShort: {
    width: '30%',
    height: 9,
    borderRadius: 5,
    backgroundColor: '#E8EEF6',
  },
});

export default ImageWithSkeleton;
