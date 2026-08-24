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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'react-native-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useNavigation, useFocusEffect, DrawerActions } from '@react-navigation/native';
import { Plus, Search, User, ChevronRight, AlertCircle, RefreshCw, MapPin, Phone, Menu, Droplet } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import CurvedHeader from '../../components/CurvedHeader';

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
    const balance = parseFloat(item.currentBalance) || 0;
    const isPaused = item.status === 'inactive';
    const isDue = balance > 0;
    


    return (
      <TouchableOpacity
        style={[
          styles.card, 
          { borderLeftWidth: 4, borderLeftColor: isPaused ? '#EF4444' : '#0B409C' }
        ]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardInner}
        >
          {/* Decorative Background Circles */}
          <View style={StyleSheet.absoluteFillObject}>
            <Svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
              <Circle cx="-5%" cy="-20%" r="55" fill="#F1F5F9" />
              <Circle cx="105%" cy="120%" r="65" fill="#E2E8F0" opacity="0.5" />
            </Svg>
          </View>

          {/* Avatar Left */}
          <View style={styles.iconBox}>
            <User size={24} color="#0B409C" />
            <View style={[
              styles.avatarBadge,
              { backgroundColor: isPaused ? '#EF4444' : '#10B981' }
            ]} />
          </View>

          {/* Center Details */}
          <View style={styles.titleContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={[styles.customerName, { marginBottom: 0 }]} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <MapPin size={12} color="#64748B" style={{ marginRight: 4 }} />
              <Text style={styles.subText} numberOfLines={1}>
                {item.Route ? item.Route.name : 'No Route'}
              </Text>
            </View>
          </View>

          {/* Right Action & Status */}
          <View style={styles.rightActionContainer}>
            <View style={styles.statusCol}>
              {isDue ? (
                <>
                  <Text style={styles.dueAmount}>₹{balance.toFixed(2)}</Text>
                  <Text style={styles.statusSubtext}>Due</Text>
                </>
              ) : (
                <>
                  <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5' }]}>
                    <Text style={[styles.statusBadgeText, { color: '#10B981' }]}>Paid</Text>
                  </View>
                  <Text style={styles.statusSubtext}>Adv: ₹{Math.abs(balance).toFixed(2)}</Text>
                </>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.phoneButton, !item.phone && { opacity: 0.3 }]} 
              activeOpacity={0.7}
              disabled={!item.phone}
              onPress={() => {
                if (item.phone) {
                  Linking.openURL(`tel:${item.phone}`);
                }
              }}
            >
              <Phone size={18} color="#0B409C" />
            </TouchableOpacity>

            <ChevronRight size={18} color="#94A3B8" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <CurvedHeader 
        title={
          <View>
            <Text style={{ color: '#0B409C', fontSize: 20, fontFamily: 'Rubik-Bold' }}>{t('customers.title')}</Text>
          </View>
        }
        leftIcon={<Menu size={24} color="#0B409C" />}
        onLeftPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
        height={110}
        contentStyle={{ paddingTop: 10, paddingBottom: 25 }}
      />
      <View style={styles.contentWrapper}>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentWrapper: {
    flex: 1,
    paddingTop: 8,
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
    fontFamily: 'Rubik-SemiBold',
    fontSize: 15,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    backgroundColor: '#E0E7FF',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  titleContainer: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    color: '#1E293B',
    marginBottom: 6,
    flexShrink: 1,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  subText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'Rubik-Medium',
  },
  rightActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  statusCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: 8,
    minWidth: 50,
  },
  dueAmount: {
    fontSize: 13,
    fontFamily: 'Rubik-Bold',
    color: '#DC2626',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: 'Rubik-Bold',
  },
  statusSubtext: {
    fontSize: 10,
    fontFamily: 'Rubik-Medium',
    color: '#64748B',
  },
  phoneButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
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
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textPlaceholder,
  },
  errorText: {
    fontSize: 15,
    fontFamily: 'Rubik-SemiBold',
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
    fontFamily: 'Rubik-Bold',
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textPlaceholder,
    textAlign: 'center',
    fontFamily: 'Rubik-SemiBold',
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
    fontFamily: 'Rubik-Bold',
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 120 : 130,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
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
