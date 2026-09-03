import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { Check, ClipboardCheck } from 'lucide-react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from 'react-native-svg';

const initialWindow = Dimensions.get('window');

const PARTICLES = Array.from({ length: 8 }).map((_, i) => {
  const angle = (i * (Math.PI * 2)) / 8;
  return {
    x: Math.cos(angle) * 160, // Spread distance
    y: Math.sin(angle) * 160,
    size: Math.random() * 8 + 6,
  };
});

const SplashScreen = ({ onFinish }) => {
  const onFinishRef = useRef(onFinish);
  const [viewport, setViewport] = useState({
    width: initialWindow.width,
    height: initialWindow.height,
  });

  // Animation values
  const tabletOpacity = useRef(new Animated.Value(0)).current;
  const tabletScale = useRef(new Animated.Value(0.8)).current;
  const tabletTranslateY = useRef(new Animated.Value(20)).current;

  const checkTranslateY = useRef(new Animated.Value(-400)).current;
  const checkScale = useRef(new Animated.Value(1)).current;
  const checkOpacity = useRef(new Animated.Value(1)).current;

  const particleProgress = useRef(new Animated.Value(0)).current;
  const particleOpacity = useRef(new Animated.Value(0)).current;

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoTranslateY = useRef(new Animated.Value(20)).current;

  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(15)).current;

  const contentExitOpacity = useRef(new Animated.Value(1)).current;
  const exitWaveTranslateY = useRef(new Animated.Value(initialWindow.height + 180)).current;

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    // 1. Tablet floats in
    const tabletIn = Animated.parallel([
      Animated.timing(tabletOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(tabletScale, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(tabletTranslateY, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    // 2. Checkmark drops and violently hits the tablet
    const checkDrop = Animated.sequence([
      Animated.delay(200),
      Animated.timing(checkTranslateY, {
        toValue: 0,
        duration: 350,
        easing: Easing.in(Easing.poly(4)), // Fast drop
        useNativeDriver: true,
      }),
      // Impact squash
      Animated.timing(checkScale, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
    ]);

    // 3. The shatter impact
    const shatter = Animated.parallel([
      // Tablet instantly shrinks
      Animated.timing(tabletScale, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.back(2)),
        useNativeDriver: true,
      }),
      Animated.timing(tabletOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      // Checkmark disappears
      Animated.timing(checkOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(checkScale, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      // Particles explode outwards
      Animated.timing(particleOpacity, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(particleProgress, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(200),
        Animated.timing(particleOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]);

    // 4. Logo and Tagline Reveal
    const logoReveal = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(taglineTranslateY, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);

    // 5. Exit Transition
    const exitSequence = Animated.sequence([
      Animated.delay(1000), // Hold logo on screen
      Animated.parallel([
        Animated.timing(contentExitOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(exitWaveTranslateY, {
          toValue: -200,
          duration: 750,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);

    // Orchestrate everything
    Animated.sequence([
      Animated.delay(300),
      tabletIn,
      Animated.delay(200),
      checkDrop,
      shatter,
      logoReveal,
      exitSequence,
    ]).start(() => {
      if (onFinishRef.current) {
        onFinishRef.current();
      }
    });
  }, []);

  const logoWidth = viewport.width * 0.65;
  const logoHeight = logoWidth * 0.35;
  const waveCanvasHeight = viewport.height + 400;

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        setViewport({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        });
      }}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Deep Blue Background Gradient */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#063A8F" />
            <Stop offset="20%" stopColor="#073996" />
            <Stop offset="45%" stopColor="#043997" />
            <Stop offset="70%" stopColor="#063A99" />
            <Stop offset="100%" stopColor="#043B97" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#bgGrad)" />
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.animationLayer,
          {
            width: viewport.width,
            height: viewport.height,
            opacity: contentExitOpacity,
          },
        ]}
      >
        <View style={styles.centerStage}>
          {/* Particles Layer */}
          <View style={StyleSheet.absoluteFill}>
            {PARTICLES.map((particle, idx) => {
              const translateX = particleProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, particle.x],
              });
              const translateY = particleProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, particle.y],
              });

              return (
                <Animated.View
                  key={`particle-${idx}`}
                  style={[
                    styles.particle,
                    {
                      width: particle.size,
                      height: particle.size,
                      borderRadius: particle.size / 2,
                      opacity: particleOpacity,
                      transform: [
                        { translateX },
                        { translateY },
                        { scale: particleOpacity },
                      ],
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* The Digital Tablet */}
          <Animated.View
            style={[
              styles.tablet,
              {
                opacity: tabletOpacity,
                transform: [{ translateY: tabletTranslateY }, { scale: tabletScale }],
              },
            ]}
          >
            <View style={styles.tabletLineGroup}>
              <View style={[styles.tabletLine, { width: '80%' }]} />
              <View style={[styles.tabletLine, { width: '60%' }]} />
              <View style={[styles.tabletLine, { width: '90%' }]} />
              <View style={[styles.tabletLine, { width: '40%' }]} />
            </View>
          </Animated.View>

          {/* The Checkmark Stamp */}
          <Animated.View
            style={[
              styles.checkmarkWrapper,
              {
                opacity: checkOpacity,
                transform: [
                  { translateY: checkTranslateY },
                  { scale: checkScale },
                ],
              },
            ]}
          >
            <View style={styles.checkmarkGlow}>
              <Check size={80} color="#043994" strokeWidth={3} />
            </View>
          </Animated.View>

          {/* Final Logo Reveal */}
          <Animated.View
            style={[
              styles.logoWrapper,
              {
                opacity: logoOpacity,
                transform: [{ translateY: logoTranslateY }, { scale: logoScale }],
              },
            ]}
          >
            <FastImage
              source={require('../../assets/logo2.png')}
              style={{ width: logoWidth, height: logoHeight }}
              resizeMode={FastImage.resizeMode.contain}
            />
          </Animated.View>
        </View>

        {/* Tagline */}
        <View style={[styles.taglinePosition, { width: viewport.width }]}>
          <Animated.View
            style={[
              styles.taglinePill,
              { opacity: taglineOpacity, transform: [{ translateY: taglineTranslateY }] },
            ]}
          >
            <ClipboardCheck size={16} color="#FFFFFF" style={styles.taglineIcon} />
            <Text style={styles.tagline}>Get the Job Done</Text>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Exit Transition Wave */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.exitWave,
          {
            width: viewport.width,
            height: waveCanvasHeight,
            transform: [{ translateY: exitWaveTranslateY }],
          },
        ]}
      >
        <Svg width={viewport.width} height={waveCanvasHeight}>
          <Path
            d={`M0 105 Q${viewport.width * 0.52} 18 ${viewport.width} 88 L${viewport.width} ${waveCanvasHeight} L0 ${waveCanvasHeight} Z`}
            fill="#FFFFFF"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#043994', // Base fallback
  },
  animationLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  centerStage: {
    position: 'absolute',
    left: 0,
    top: '32%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tablet: {
    position: 'absolute',
    width: 120,
    height: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 16,
    zIndex: 1,
  },
  tabletLineGroup: {
    flex: 1,
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  tabletLine: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 2,
  },
  checkmarkWrapper: {
    position: 'absolute',
    zIndex: 3,
  },
  checkmarkGlow: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 10,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    zIndex: 2,
    left: '50%',
    top: '50%',
    marginLeft: -4,
    marginTop: -4,
  },
  logoWrapper: {
    position: 'absolute',
    zIndex: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taglinePosition: {
    position: 'absolute',
    left: 0,
    bottom: '15%',
    alignItems: 'center',
  },
  taglinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  taglineIcon: {
    marginRight: 8,
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Rubik-SemiBold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  exitWave: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
});

export default SplashScreen;
