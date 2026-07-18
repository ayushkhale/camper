import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Truck, UserPlus, Package, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';

const HomeScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('home.quickActionsTitle')}</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => navigation.navigate('StaffManagement')}
          >
            <View style={styles.actionIconContainer}>
              <UserPlus color={COLORS.primary} size={24} strokeWidth={2} />
            </View>
            <Text style={styles.actionText}>{t('home.actionAddStaff')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => navigation.navigate('ProductCatalog')}
          >
            <View style={styles.actionIconContainer}>
              <Package color={COLORS.primary} size={24} strokeWidth={2} />
            </View>
            <Text style={styles.actionText}>{t('products.title')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => navigation.navigate('RouteList')}
          >
            <View style={styles.actionIconContainer}>
              <MapPin color={COLORS.primary} size={24} strokeWidth={2} />
            </View>
            <Text style={styles.actionText}>Delivery Routes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: '48%',
    borderRadius: 6,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  cardOne: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  cardTwo: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
  },
  cardThree: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  cardFour: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.danger,
  },
  cardSubtitle: {
    fontSize: 11.5,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
  },
  cardUnit: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 16,
    justifyContent: 'flex-start',
  },
  actionItem: {
    width: '25%',
    alignItems: 'center',
    marginRight: 12,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 11.5,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
});

export default HomeScreen;
