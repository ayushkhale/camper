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
import { Droplet } from 'lucide-react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

const initialWindow = Dimensions.get('window');
const IMPACT_STAGE_HEIGHT = 170;
const TAGLINE_OFFSET = 105;
const BACKGROUND_BUBBLES = [
  { x: 0.07, y: 0.12, size: 58, outline: false, reverse: false },
  { x: 0.82, y: 0.18, size: 30, outline: true, reverse: true },
  { x: 0.89, y: 0.43, size: 64, outline: false, reverse: false },
  { x: 0.05, y: 0.64, size: 34, outline: true, reverse: true },
  { x: 0.72, y: 0.74, size: 46, outline: true, reverse: false },
  { x: 0.24, y: 0.86, size: 22, outline: false, reverse: true },
];

const SplashScreen = ({ onFinish }) => {
  const onFinishRef = useRef(onFinish);
  const [viewport, setViewport] = useState({
    width: initialWindow.width,
    height: initialWindow.height,
  });

  const dropProgress = useRef(new Animated.Value(0)).current;
  const dropOpacity = useRef(new Animated.Value(0)).current;
  const dropScaleX = useRef(new Animated.Value(1)).current;
  const dropScaleY = useRef(new Animated.Value(1)).current;
  const impactGlow = useRef(new Animated.Value(0)).current;
  const firstRipple = useRef(new Animated.Value(0)).current;
  const secondRipple = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.58)).current;
  const logoTranslateY = useRef(new Animated.Value(18)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(12)).current;
  const contentExitOpacity = useRef(new Animated.Value(1)).current;
  const exitWaveTranslateY = useRef(new Animated.Value(initialWindow.height + 180)).current;
  const bubbleMotion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    const bubbleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(bubbleMotion, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bubbleMotion, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const animation = Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.timing(dropOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(dropProgress, {
          toValue: 1,
          duration: 850,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.sequence([
          Animated.parallel([
            Animated.timing(dropScaleX, {
              toValue: 1.28,
              duration: 110,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(dropScaleY, {
              toValue: 0.58,
              duration: 110,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(dropOpacity, {
            toValue: 0,
            duration: 190,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(impactGlow, {
            toValue: 1,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.timing(impactGlow, {
            toValue: 0,
            duration: 440,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(firstRipple, {
          toValue: 1,
          duration: 760,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(130),
          Animated.timing(secondRipple, {
            toValue: 1,
            duration: 720,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(170),
          Animated.parallel([
            Animated.timing(logoOpacity, {
              toValue: 1,
              duration: 420,
              useNativeDriver: true,
            }),
            Animated.spring(logoScale, {
              toValue: 1,
              speed: 8,
              bounciness: 4,
              useNativeDriver: true,
            }),
            Animated.timing(logoTranslateY, {
              toValue: 0,
              duration: 520,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);

    let exitAnimation;
    const exitTimer = setTimeout(() => {
      exitAnimation = Animated.parallel([
        Animated.timing(contentExitOpacity, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(exitWaveTranslateY, {
          toValue: -120,
          duration: 650,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);
      exitAnimation.start();
    }, 3000);

    const finishTimer = setTimeout(() => {
      onFinishRef.current?.();
    }, 3800);

    bubbleAnimation.start();
    animation.start();

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
      bubbleAnimation.stop();
      animation.stop();
      exitAnimation?.stop();
    };
  }, [
    bubbleMotion,
    contentExitOpacity,
    dropOpacity,
    dropProgress,
    dropScaleX,
    dropScaleY,
    exitWaveTranslateY,
    firstRipple,
    impactGlow,
    logoOpacity,
    logoScale,
    logoTranslateY,
    secondRipple,
    taglineOpacity,
    taglineTranslateY,
  ]);

  const handleLayout = ({ nativeEvent }) => {
    const measured = nativeEvent.layout;
    if (measured.width <= 0 || measured.height <= 0) return;

    setViewport((current) => (
      current.width === measured.width && current.height === measured.height
        ? current
        : { width: measured.width, height: measured.height }
    ));
  };

  const centerY = viewport.height / 2;
  const impactTop = centerY - IMPACT_STAGE_HEIGHT / 2;
  const taglineTop = centerY + TAGLINE_OFFSET;
  const waveCanvasHeight = viewport.height + 220;
  const logoWidth = Math.min(viewport.width * 0.92, 390);
  const logoHeight = Math.min(viewport.width * 0.31, 132);

  const dropTranslateY = dropProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-(centerY - 42), 0],
  });
  const firstRippleScale = firstRipple.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 3.2],
  });
  const firstRippleOpacity = firstRipple.interpolate({
    inputRange: [0, 0.12, 1],
    outputRange: [0, 0.48, 0],
  });
  const secondRippleScale = secondRipple.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 2.75],
  });
  const secondRippleOpacity = secondRipple.interpolate({
    inputRange: [0, 0.14, 1],
    outputRange: [0, 0.34, 0],
  });
  const impactGlowScale = impactGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 1.25],
  });
  const bubbleTranslateY = bubbleMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [9, -9],
  });
  const reverseBubbleTranslateY = bubbleMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [-7, 7],
  });
  const bubbleScale = bubbleMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1.04],
  });

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <Svg
        width={viewport.width}
        height={viewport.height}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient id="splashGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#9DCFFD" />
            <Stop offset="25%" stopColor="#BEDDFE" />
            <Stop offset="50%" stopColor="#D6E9FC" />
            <Stop offset="75%" stopColor="#C1DFFE" />
            <Stop offset="100%" stopColor="#A1D0FD" />
          </LinearGradient>
        </Defs>
        <Rect width={viewport.width} height={viewport.height} fill="url(#splashGradient)" />
        <Path
          d={`M0 ${viewport.height * 0.82} Q${viewport.width * 0.48} ${viewport.height * 0.75} ${viewport.width} ${viewport.height * 0.84} L${viewport.width} ${viewport.height} L0 ${viewport.height} Z`}
          fill="rgba(255,255,255,0.16)"
        />
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={[styles.bubbleLayer, { opacity: contentExitOpacity }]}
      >
        {BACKGROUND_BUBBLES.map((bubble, index) => (
          <Animated.View
            key={`${bubble.x}-${bubble.y}-${index}`}
            style={[
              styles.backgroundBubble,
              bubble.outline ? styles.outlineBubble : styles.filledBubble,
              {
                left: viewport.width * bubble.x,
                top: viewport.height * bubble.y,
                width: bubble.size,
                height: bubble.size,
                borderRadius: bubble.size / 2,
                transform: [
                  {
                    translateY: bubble.reverse
                      ? reverseBubbleTranslateY
                      : bubbleTranslateY,
                  },
                  { scale: bubbleScale },
                ],
              },
            ]}
          />
        ))}
      </Animated.View>

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
        <View
          style={[
            styles.impactStage,
            {
              top: impactTop,
              width: viewport.width,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.impactGlow,
              { opacity: impactGlow, transform: [{ scale: impactGlowScale }] },
            ]}
          />
          <Animated.View
            style={[
              styles.ripple,
              {
                opacity: firstRippleOpacity,
                transform: [{ scale: firstRippleScale }, { scaleY: 0.34 }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ripple,
              styles.rippleSecondary,
              {
                opacity: secondRippleOpacity,
                transform: [{ scale: secondRippleScale }, { scaleY: 0.34 }],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.fallingDrop,
              {
                opacity: dropOpacity,
                transform: [
                  { translateY: dropTranslateY },
                  { scaleX: dropScaleX },
                  { scaleY: dropScaleY },
                ],
              },
            ]}
          >
            <Droplet size={58} color="#0B409C" fill="#3B82F6" strokeWidth={1.8} />
          </Animated.View>

          <Animated.View
            style={[
              styles.logoWrapper,
              {
                opacity: logoOpacity,
                transform: [{ translateY: logoTranslateY }, { scale: logoScale }],
              },
            ]}
          >
            <View style={{ width: logoWidth, height: logoHeight }}>
              <View
                style={[
                  styles.logoCrop,
                  {
                    width: logoWidth * 0.355,
                    height: logoHeight,
                  },
                ]}
              >
                <FastImage
                  source={require('../../assets/logo1.png')}
                  style={{ width: logoWidth, height: logoHeight }}
                  resizeMode={FastImage.resizeMode.contain}
                />
              </View>

              <View
                style={[
                  styles.logoCrop,
                  {
                    left: logoWidth * 0.35,
                    top: logoHeight * 0.36,
                    width: logoWidth * 0.65,
                    height: logoHeight * 0.36,
                  },
                ]}
              >
                <FastImage
                  source={require('../../assets/logo1.png')}
                  style={{
                    position: 'absolute',
                    left: -logoWidth * 0.35,
                    top: -logoHeight * 0.36,
                    width: logoWidth,
                    height: logoHeight,
                  }}
                  resizeMode={FastImage.resizeMode.contain}
                />
              </View>
            </View>
          </Animated.View>
        </View>

        <View
          style={[
            styles.taglinePosition,
            {
              top: taglineTop,
              width: viewport.width,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.taglinePill,
              { opacity: taglineOpacity, transform: [{ translateY: taglineTranslateY }] },
            ]}
          >
            <Droplet size={15} color="#0B409C" fill="#DBEAFE" style={styles.taglineIcon} />
            <Text style={styles.tagline}>Pure Water, Better Life</Text>
          </Animated.View>
        </View>
      </Animated.View>

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
    backgroundColor: '#D6E9FC',
    overflow: 'hidden',
  },
  animationLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  bubbleLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundBubble: {
    position: 'absolute',
  },
  filledBubble: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 7,
  },
  outlineBubble: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.25,
    borderColor: 'rgba(255,255,255,0.30)',
  },
  impactStage: {
    position: 'absolute',
    left: 0,
    height: IMPACT_STAGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallingDrop: {
    position: 'absolute',
    zIndex: 3,
    shadowColor: '#0B409C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  impactGlow: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.78)',
  },
  ripple: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  rippleSecondary: {
    borderColor: '#60A5FA',
    borderWidth: 1.5,
  },
  logoWrapper: {
    position: 'absolute',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCrop: {
    position: 'absolute',
    left: 0,
    top: 0,
    overflow: 'hidden',
  },
  taglinePosition: {
    position: 'absolute',
    left: 0,
    alignItems: 'center',
  },
  taglinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.74)',
    shadowColor: '#0B409C',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  taglineIcon: {
    marginRight: 7,
  },
  tagline: {
    color: '#0B409C',
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
    textAlign: 'center',
  },
  exitWave: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
});

export default SplashScreen;
