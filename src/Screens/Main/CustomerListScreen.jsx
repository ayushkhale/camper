import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Plus, Search, User, ChevronRight, AlertCircle, RefreshCw, MapPin, Phone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

const CustomerListScreen = () => {
  const navigation = useNavigation();
  const { userToken } = useContext(AuthContext);
  const { t } = useTranslation();

  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const pulseAnim = React.useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (loading) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.75,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.35,
            duration: 750,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [loading]);

  const renderCustomerSkeleton = () => (
    <View style={{ paddingHorizontal: 20, paddingTop: 10, gap: 12 }}>
      {[1, 2, 3, 4, 5].map((key) => (
        <Animated.View key={key} style={[styles.skeletonCustomerCard, { opacity: pulseAnim }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.skeletonAvatar} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={[styles.skeletonBar, { width: '55%', height: 16, marginBottom: 8 }]} />
              <View style={[styles.skeletonBar, { width: '35%', height: 12 }]} />
            </View>
            <View style={[styles.skeletonBar, { width: 18, height: 18, borderRadius: 9 }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );

  const fetchCustomers = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await api.listCustomers(userToken);
      if (res.success) {
        setCustomers(res.data || []);
      } else {
        throw new Error(res.message || 'Failed to fetch customers');
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchCustomers(true);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers(false);
  };

  const filteredCustomers = customers.filter((item) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = item.name?.toLowerCase().includes(query);
    const phoneMatch = item.phone?.toLowerCase().includes(query);
    return nameMatch || phoneMatch;
  });

  const renderCustomerCard = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <User size={22} color={COLORS.primary} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.phone ? (
              <View style={styles.row}>
                <Phone size={12} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                <Text style={styles.subText}>{item.phone}</Text>
              </View>
            ) : null}
          </View>
          <ChevronRight size={18} color={COLORS.textPlaceholder} />
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.routeContainer}>
            <MapPin size={14} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.routeText} numberOfLines={1} ellipsizeMode="tail">
              {item.Route ? item.Route.name : 'No Route'}
            </Text>
          </View>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: item.status === 'active' ? '#16A34A' : '#94A3B8' }]} />
              <Text style={[styles.statusText, { color: item.status === 'active' ? '#15803D' : '#64748B' }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.contentWrapper}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>{t('customers.title')}</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color={COLORS.textPlaceholder} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('customers.searchPlaceholder')}
              placeholderTextColor={COLORS.textPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {loading ? (
          renderCustomerSkeleton()
        ) : error ? (
          <View style={styles.centerContainer}>
            <AlertCircle size={40} color={COLORS.primary} style={{ marginBottom: 12 }} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchCustomers(true)}>
              <RefreshCw size={16} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredCustomers}
            keyExtractor={(item) => item.id || Math.random().toString()}
            renderItem={renderCustomerCard}
            contentContainerStyle={
              filteredCustomers.length === 0 ? styles.emptyListContent : styles.listContent
            }
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <User size={48} color={COLORS.textPlaceholder} style={{ marginBottom: 16 }} />
                <Text style={styles.emptyTitle}>{t('customers.noCustomersTitle')}</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? t('customers.noCustomersSearch')
                    : t('customers.noCustomersSub')}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity
                    style={styles.emptyAddBtn}
                    onPress={() => navigation.navigate('AddCustomer')}
                  >
                    <Plus size={18} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.emptyAddBtnText}>{t('customers.addNew')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </View>

      {!loading && !error && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AddCustomer')}
        >
          <Plus size={26} color="#FFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentWrapper: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 24 : 16,
  },
  headerRow: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Geologica-Bold',
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontFamily: 'Geologica-Medium',
    fontSize: 15,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 90,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  titleContainer: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontFamily: 'Geologica-Bold',
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  subText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Geologica-Medium',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  routeText: {
    fontSize: 12,
    fontFamily: 'Geologica-Bold',
    fontWeight: 'bold',
    color: COLORS.primary,
    flexShrink: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Geologica-Bold',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPlaceholder,
  },
  errorText: {
    fontSize: 15,
    fontFamily: 'Geologica-Medium',
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: 'Geologica-SemiBold',
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Geologica-SemiBold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textPlaceholder,
    textAlign: 'center',
    fontFamily: 'Geologica-Medium',
    marginBottom: 24,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Geologica-SemiBold',
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonCustomerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
  },
  skeletonBar: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
});

export default CustomerListScreen;
