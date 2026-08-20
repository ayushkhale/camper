import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
  Dimensions,
} from 'react-native';
import Svg, { Defs, ClipPath, Rect, Path, Text as SvgText, G } from 'react-native-svg';

const { height } = Dimensions.get('window');

const AnimatedG = Animated.createAnimatedComponent(G);

const SplashScreen = ({ onFinish }) => {
  // Animation values
  const fillProgress = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const bgOpacity = useRef(new Animated.Value(1)).current; // For final fade out
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start continuous wave animation
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: -350,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.sequence([
      // Delay before filling starts
      Animated.delay(400),
      // Liquid fill animation (bottom to top)
      Animated.timing(fillProgress, {
        toValue: 1,
        duration: 1600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      // Show subtitle
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Hold for a cinematic moment
      Animated.delay(1000),
      // Fade out everything to transition to app
      Animated.timing(bgOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start(() => {
      if (onFinish) {
        onFinish();
      }
    });
  }, [onFinish]);

  // Interpolate fill progress into Y position
  // The SVG is 120px high. We animate the Rect's Y from 120 down to 0 to "fill" it.
  const rectY = fillProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [120, -40],
  });

  return (
    <Animated.View style={[styles.container, { opacity: bgOpacity }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Brand Primary Background */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#0B409C' }]} />

      {/* Liquid Fill Logo */}
      <View style={styles.svgContainer}>
        <Svg width="350" height="120" viewBox="0 0 350 120">
          <Defs>
            <ClipPath id="textClip">
              <SvgText
                x="175"
                y="65"
                textAnchor="middle"
                alignmentBaseline="middle"
                fontSize="54"
                fontFamily="Geologica-Bold"
                fontWeight="900"
                letterSpacing="12"
              >
                CAMPER
              </SvgText>
            </ClipPath>
          </Defs>

          {/* 1. Outline of the text (starts visible) */}
          <SvgText
            x="175"
            y="65"
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize="54"
            fontFamily="Geologica-Bold"
            fontWeight="900"
            letterSpacing="12"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1.5"
            fill="none"
          >
            CAMPER
          </SvgText>

          {/* 2. The Liquid fill clipped by the text */}
          <G clipPath="url(#textClip)">
            <AnimatedG style={{ transform: [{ translateX: waveAnim }, { translateY: rectY }] }}>
              {/* A wave path that is 700px wide (two cycles of 350px). 
                  When it translates left by 350px, it loops perfectly. */}
              <Path
                d="M 0 30 Q 87.5 10, 175 30 T 350 30 T 525 30 T 700 30 L 700 150 L 0 150 Z"
                fill="#FFFFFF"
              />
            </AnimatedG>
          </G>
        </Svg>
      </View>

      <Animated.View
        style={{
          position: 'absolute',
          bottom: height * 0.38,
          opacity: subtitleOpacity,
          alignItems: 'center',
        }}
      >
        <View style={styles.subtitleBadge}>
          <Text style={styles.subtitle}>DAILY WATER SUPPLY</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B409C', // Brand primary blue base
  },
  svgContainer: {
    width: 350,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // White transparent
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 6,
  },
});

export default SplashScreen;
