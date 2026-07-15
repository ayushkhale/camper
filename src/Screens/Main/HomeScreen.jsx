import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Truck, UserPlus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';

const HomeScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Overview Section */}
        <Text style={styles.sectionTitle}>{t('home.overviewTitle')}</Text>
        <View style={styles.grid}>
          <View style={[styles.card, styles.cardOne]}>
            <Text style={styles.cardSubtitle}>{t('home.totalDelivery')}</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardValue}>18</Text>
              <Truck color={COLORS.primary} size={26} strokeWidth={2} />
            </View>
          </View>

          <View style={[styles.card, styles.cardTwo]}>
            <Text style={styles.cardSubtitle}>{t('home.totalLiter')}</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardValue}>8,500 <Text style={styles.cardUnit}>Ltr</Text></Text>
            </View>
          </View>

          <View style={[styles.card, styles.cardThree]}>
            <Text style={styles.cardSubtitle}>{t('home.todayEarnings')}</Text>
            <Text style={styles.cardValue}>₹ 12,450</Text>
          </View>

          <View style={[styles.card, styles.cardFour]}>
            <Text style={styles.cardSubtitle}>{t('home.outstandingAmount')}</Text>
            <Text style={styles.cardValue}>₹ 45,600</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('home.quickActionsTitle')}</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => navigation.navigate('StaffManagement')}
          >
            <View style={styles.actionIconContainer}>
              <UserPlus color={COLORS.primary} size={28} strokeWidth={1.5} />
            </View>
            <Text style={styles.actionText}>{t('home.actionAddStaff')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    padding: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: COLORS.primary,
    marginBottom: 15,
    marginTop: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  card: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardOne: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  cardTwo: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  cardThree: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  cardFour: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: COLORS.primary,
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: COLORS.primary,
  },
  cardUnit: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: COLORS.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  actionItem: {
    width: '28%',
    alignItems: 'center',
    marginBottom: 20
  },
  actionIconContainer: {
    width: 65,
    height: 65,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  actionText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textPrimary,
    textAlign: 'center'
  }
});

export default HomeScreen;
