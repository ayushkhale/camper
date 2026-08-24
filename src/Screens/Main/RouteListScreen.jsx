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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'react-native-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MapPin, Plus, Search, ChevronRight, AlertCircle, RefreshCw, ChevronLeft , ArrowLeft} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import CurvedHeader from '../../components/CurvedHeader';

const RouteListScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { userToken, user } = useContext(AuthContext);

  const [routes, setRoutes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchRoutes = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const getFn = api.getRoutes || api.listRoutes;
      const res = getFn ? await getFn(userToken) : { success: false };
      if (res && res.success && Array.isArray(res.data)) {
        setRoutes(res.data);
      } else {
        setRoutes([]);
      }
    } catch (err) {
      console.error('Fetch routes error:', err);
      setError(err.message || 'Failed to load routes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchRoutes();
    }, [userToken])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoutes(false);
  };

  const filteredRoutes = routes.filter((route) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = route.name?.toLowerCase().includes(q);
    const codeMatch = route.areaCode?.toLowerCase().includes(q);
    return nameMatch || codeMatch;
  });

  const renderRouteCard = ({ item }) => {
    const staffCount = item.StaffRoutes?.length || 0;

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#D97706' }]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('RouteDetail', { route: item })}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardInner}
        >
          {/* Decorative Background Circles (Route Theme) */}
          <View style={StyleSheet.absoluteFillObject}>
            <Svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
              {/* Big backdrop circles */}
              <Circle cx="-5%" cy="-20%" r="45" fill="#FEF3C7" opacity="0.8" />
              <Circle cx="105%" cy="120%" r="55" fill="#FDE68A" opacity="0.6" />
              
              {/* Route Nodes & Path */}
              {/* Fake dashed path connecting the nodes */}
              <Circle cx="75%" cy="25%" r="6" fill="#F59E0B" opacity="0.4" />
              <Circle cx="90%" cy="50%" r="8" fill="#F59E0B" opacity="0.3" />
              <Circle cx="70%" cy="80%" r="5" fill="#F59E0B" opacity="0.4" />
            </Svg>
          </View>

          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
              <MapPin size={22} color="#D97706" />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.routeName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.areaCode ? (
                <Text style={styles.areaCode}>Code: {item.areaCode}</Text>
              ) : null}
            </View>
            <ChevronRight size={20} color={COLORS.textPlaceholder} />
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {staffCount} {staffCount === 1 ? 'Staff Member' : 'Staff Members'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <CurvedHeader 
        title={t('home.routes')}
        leftIcon={<ArrowLeft size={24} color="#0B409C" />}
        onLeftPress={() => navigation.goBack()}
        height={120}
        contentStyle={{ paddingTop: 10, paddingBottom: 25 }}
      />

      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('customers.searchPlaceholder')}
            placeholderTextColor={COLORS.textPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Body List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={40} color={COLORS.danger} style={{ marginBottom: 12 }} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchRoutes(true)}>
            <RefreshCw size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredRoutes}
          keyExtractor={(item) => item.id || Math.random().toString()}
          renderItem={renderRouteCard}
          contentContainerStyle={
            filteredRoutes.length === 0 ? styles.emptyListContent : styles.listContent
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
              <View style={styles.emptyIconCircle}>
                <MapPin size={28} color={COLORS.textPlaceholder} />
              </View>
              <Text style={styles.emptyTitle}>{t('customers.noRouteAssigned')}</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? t('customers.noCustomersSearch')
                  : t('customers.noCustomersSub')}
              </Text>
              {!searchQuery && user?.role !== 'staff' && (
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => navigation.navigate('AddRoute')}
                >
                  <Plus size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.emptyAddBtnText}>{t('common.addNewRoute')}</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      {!loading && !error && user?.role !== 'staff' && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AddRoute')}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchHeader: {
    paddingHorizontal: 24,
    paddingTop: 8,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: 'Rubik-SemiBold',
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  card: {
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  cardInner: {
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  titleContainer: {
    flex: 1,
  },
  routeName: {
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  areaCode: {
    fontSize: 13,
    fontFamily: 'Rubik-SemiBold',
    color: '#94A3B8',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 1,
  },
  badge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Rubik-Bold',
    color: '#0284C7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textPlaceholder,
  },
  errorText: {
    fontSize: 14,
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
    paddingVertical: 10,
    borderRadius: 14,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: 'Rubik-Bold',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Rubik-Bold',
    fontSize: 14.5,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 50,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
});

export default RouteListScreen;

