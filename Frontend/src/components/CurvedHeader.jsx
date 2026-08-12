import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

const CurvedHeader = ({ 
  title, 
  leftIcon, 
  onLeftPress, 
  rightIcon, 
  onRightPress,
  children,
  height = 140,
  contentStyle
}) => {
  const insets = useSafeAreaInsets();
  
  // Since App.jsx handles the top notch with SafeAreaView, we don't add insets here to avoid double spacing
  const totalHeight = height;

  // Wave setup
  const waveBase = totalHeight - 40;

  return (
    <View style={[styles.container, { height: totalHeight }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      {/* Background SVG Waves */}
      <Svg width={width} height={totalHeight} style={StyleSheet.absoluteFill}>
        <Defs>
        </Defs>

        {/* Background base */}
        <Path 
          d={`M0,0 L0,${waveBase + 10} C${width * 0.4},${waveBase + 50} ${width * 0.7},${waveBase - 20} ${width},${waveBase + 10} L${width},0 Z`} 
          fill="#0B409C" 
        />

        {/* Highlight wave 1 (subtle overlap) */}
        <Path 
          d={`M0,${waveBase + 10} C${width * 0.4},${waveBase + 50} ${width * 0.7},${waveBase - 20} ${width},${waveBase + 10} L${width},${waveBase + 30} C${width * 0.8},${waveBase - 10} ${width * 0.3},${waveBase + 60} 0,${waveBase + 25} Z`} 
          fill="#FFFFFF" 
          opacity="0.1"
        />

        {/* Highlight wave 2 (higher overlap) */}
        <Path 
          d={`M0,${waveBase - 10} C${width * 0.3},${waveBase + 40} ${width * 0.6},${waveBase - 30} ${width},${waveBase - 5} L${width},${waveBase + 10} C${width * 0.7},${waveBase - 20} ${width * 0.4},${waveBase + 50} 0,${waveBase + 10} Z`} 
          fill="#FFFFFF" 
          opacity="0.15"
        />
      </Svg>

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
              <Text style={[styles.title, !leftIcon && { marginLeft: 16 }]} numberOfLines={1}>{title}</Text>
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
    height: 56,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Geologica-Bold',
    marginLeft: 8,
  },
  titleContainerNode: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
