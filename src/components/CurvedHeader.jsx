import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

const CurvedHeader = ({
  title,
  leftIcon,
  onLeftPress,
  rightIcon,
  onRightPress,
  children,
  height = 160,
  contentStyle,
  startColor = '#063A8F', // Deep premium blue
}) => {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const isHome = route.name === 'Home';

  // Inner screens only need enough room for the status bar and title row.
  // Home retains its taller artwork-led header.
  const headerHeight = isHome ? height : Math.min(height, 55);
  const totalHeight = headerHeight + insets.top;
  const curveDepth = 14;

  return (
    <View style={[
      styles.container,
      { height: totalHeight, backgroundColor: isHome ? startColor : 'transparent' },
    ]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      {isHome ? (
        <FastImage
          source={require('../../assets/header_bg9.png')}
          style={StyleSheet.absoluteFill}
          resizeMode="stretch"
        />
      ) : (
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="headerGradient" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#9DCFFD" />
              <Stop offset="25%" stopColor="#BEDDFE" />
              <Stop offset="50%" stopColor="#D6E9FC" />
              <Stop offset="75%" stopColor="#C1DFFE" />
              <Stop offset="100%" stopColor="#A1D0FD" />
            </LinearGradient>
          </Defs>
          <Path
            d={`M0 0 H${width} V${totalHeight - curveDepth} Q${width / 2} ${totalHeight + curveDepth} 0 ${totalHeight - curveDepth} Z`}
            fill="url(#headerGradient)"
          />
        </Svg>
      )}

      {/* Header Content */}
      <View style={[styles.content, contentStyle]}>
        <View style={styles.topRow}>
          {leftIcon && (
            <TouchableOpacity onPress={onLeftPress} style={styles.iconButton} activeOpacity={0.7}>
              {leftIcon}
            </TouchableOpacity>
          )}

          {title && (
            typeof title === 'string' ? (
              <Text style={[styles.title, !leftIcon && { marginLeft: 16 }]} numberOfLines={2}>{title}</Text>
            ) : (
              <View style={styles.titleContainerNode}>{title}</View>
            )
          )}

          <View style={{ flex: 1 }} />

          {rightIcon && (
            onRightPress ? (
              <TouchableOpacity onPress={onRightPress} style={styles.iconButton} activeOpacity={0.7}>
                {rightIcon}
              </TouchableOpacity>
            ) : (
              <View style={styles.rightIconContainer}>
                {rightIcon}
              </View>
            )
          )}
        </View>

        {children && (
          <View style={styles.childrenContainer}>
            {children}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
  },
  title: {
    color: '#0B409C',
    fontSize: 22,
    fontFamily: 'Rubik-Bold',
    marginLeft: 8,
    flexShrink: 1,
  },
  titleContainerNode: {
    flexShrink: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginLeft: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  rightIconContainer: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 8,
  },
  iconPlaceholder: {
    width: 44,
    height: 44,
  },
  childrenContainer: {
    flex: 1,
    paddingHorizontal: 8,
  }
});

export default CurvedHeader;
