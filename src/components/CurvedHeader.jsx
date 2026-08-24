import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

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

  const bgImage = isHome
    ? require('../../assets/header_bg9.png')
    : require('../../assets/header_bg9.png');

  const totalHeight = height + insets.top;

  // Wave setup
  const waveBase = totalHeight - 40;

  return (
    <View style={[styles.container, { height: totalHeight, backgroundColor: startColor }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      {/* Background Image - Set to stretch to perfectly fit the full curve into the header bounds without cropping */}
      <Image
        source={bgImage}
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
        resizeMode="stretch"
      />



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
