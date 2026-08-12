import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolateColor,
} from 'react-native-reanimated';
import { Check, X } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

const THUMB_SIZE = 36;
const TRACK_HEIGHT = 48;
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.5,
};

const DeliveryStatusSlider = ({ status, onStatusChange }) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (trackWidth > 0) {
      const maxTranslate = trackWidth - THUMB_SIZE - 8;
      const midTranslate = maxTranslate / 2;
      translateX.value = withSpring(midTranslate, SPRING_CONFIG);
    }
  }, [trackWidth, translateX]);

  const handleStatusUpdate = (newStatus) => {
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const maxTranslate = trackWidth - THUMB_SIZE - 8;
      const midTranslate = maxTranslate / 2;
      let newTranslation = midTranslate + event.translationX;

      if (newTranslation < 0) newTranslation = 0;
      if (newTranslation > maxTranslate) newTranslation = maxTranslate;

      translateX.value = newTranslation;
    })
    .onEnd(() => {
      const maxTranslate = trackWidth - THUMB_SIZE - 8;
      const midTranslate = maxTranslate / 2;

      if (translateX.value < maxTranslate * 0.25) {
        translateX.value = withSpring(0, SPRING_CONFIG);
        runOnJS(handleStatusUpdate)('skipped');
      } else if (translateX.value > maxTranslate * 0.75) {
        translateX.value = withSpring(maxTranslate, SPRING_CONFIG);
        runOnJS(handleStatusUpdate)('delivered');
      } else {
        translateX.value = withSpring(midTranslate, SPRING_CONFIG);
      }
    });

  const trackAnimatedStyle = useAnimatedStyle(() => {
    const maxTranslate = Math.max(trackWidth - THUMB_SIZE - 8, 1);
    const backgroundColor = interpolateColor(
      translateX.value,
      [0, maxTranslate / 2, maxTranslate],
      [COLORS.dangerLight || '#FEF2F2', '#F1F5F9', COLORS.successLight || '#D1FAE5']
    );
    return { backgroundColor };
  });

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const onLayout = (event) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  // Fixed DELIVERED Status Bar (Dark Green, White Text on Left, White Tick Circle on Right - Non-clickable)
  if (status === 'delivered') {
    return (
      <View style={styles.container}>
        <View style={[styles.fixedBar, { backgroundColor: COLORS.success }]}>
          <Text style={styles.fixedText}>Delivered</Text>
          <View style={styles.iconCircleWhite}>
            <Check size={18} color={COLORS.success} strokeWidth={3} />
          </View>
        </View>
      </View>
    );
  }

  // Fixed SKIPPED Status Bar (Dark Red, White X Circle on Left, White Text on Right - Non-clickable)
  if (status === 'skipped') {
    return (
      <View style={styles.container}>
        <View style={[styles.fixedBar, { backgroundColor: COLORS.danger }]}>
          <View style={styles.iconCircleWhite}>
            <X size={18} color={COLORS.danger} strokeWidth={3} />
          </View>
          <Text style={styles.fixedText}>Skipped</Text>
        </View>
      </View>
    );
  }

  // PENDING State -> Interactive Slider Track & Thumb
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.track, trackAnimatedStyle]} onLayout={onLayout}>
        <View style={styles.indicatorsContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16 }}>
            <X size={16} color={COLORS.danger} />
            <Text style={{ color: COLORS.danger, fontSize: 12, fontFamily: 'Geologica-Bold', marginLeft: 4 }}>Skip</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
            <Text style={{ color: COLORS.success, fontSize: 12, fontFamily: 'Geologica-Bold', marginRight: 4 }}>Deliver</Text>
            <Check size={16} color={COLORS.success} />
          </View>
        </View>

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.thumb, thumbAnimatedStyle]}>
            <View style={styles.thumbInner} />
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 4,
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  indicatorsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    left: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },

  // Fixed status bar styling
  fixedBar: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  fixedText: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: '#FFFFFF',
  },
  iconCircleWhite: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DeliveryStatusSlider;
