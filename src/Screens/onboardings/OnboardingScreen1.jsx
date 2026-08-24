import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

const OnboardingScreen1 = ({ navigation }) => {
  const { t, i18n } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Header with Logo and Skip */}
      <View style={styles.header}>
        <Image
          source={require('../../../assets/logo1.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.skipButton}>
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
          <ChevronRight size={18} color={COLORS.primary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {/* Illustration Area */}
      <View style={styles.illustrationContainer}>
        <Image
          source={require('../../../assets/onboarding1.png')}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      {/* Content Card */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{t('onboarding.title1')}</Text>
        
        <Text style={styles.subtitle}>
          {t('onboarding.subtitle1')}
        </Text>

        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.nextButton} onPress={() => navigation.navigate('Onboarding2')}>
          <Text style={styles.nextButtonText}>{t('onboarding.next')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  logo: {
    width: 100,
    height: 40,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  skipText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  illustration: {
    width: width * 0.85,
    height: height * 0.4,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textPlaceholder,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
    marginBottom: 30,
  },
  paginationContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: COLORS.textPlaceholder,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  nextButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen1;
