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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Plus, Search, MapPin, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

const RouteListScreen = () => {
  const navigation = useNavigation();
  const { userToken } = useContext(AuthContext);

  const [routes, setRoutes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchRoutes = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await api.listRoutes(userToken);
      if (res.success) {
        setRoutes(res.data || []);
      } else {
        throw new Error(res.message || 'Failed to fetch routes');
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchRoutes(true);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoutes(false);
  };

  const filteredRoutes = routes.filter((item) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = item.name?.toLowerCase().includes(query);
    const areaMatch = item.areaCode?.toLowerCase().includes(query);
    return nameMatch || areaMatch;
  });

  const renderRouteCard = ({ item }) => {
    // Active staff count where effectiveTo is null (currently assigned)
    const activeStaffCount = (item.StaffRoutes || []).filter(
      (sr) => sr.effectiveTo === null
    ).length;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('RouteDetail', { routeId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <MapPin size={20} color={COLORS.primary} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.routeName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.areaCode ? (
              <Text style={styles.areaCode}>{item.areaCode}</Text>
            ) : null}
          </View>
          <ChevronRight size={18} color={COLORS.textPlaceholder} />
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <Text style={styles.staffCountText}>
            Active Staff: <Text style={styles.staffCountValue}>{activeStaffCount}</Text>
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Delivery Routes</Text>
      </View>

      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textPlaceholder} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search routes..."
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
          <Text style={styles.loadingText}>Loading routes...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={40} color={COLORS.primary} style={{ marginBottom: 12 }} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchRoutes(true)}>
            <RefreshCw size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.retryText}>Retry</Text>
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
              <MapPin size={48} color={COLORS.textPlaceholder} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyTitle}>No routes found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try adjusting your search criteria'
                  : 'Start by creating your first delivery route zone'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => navigation.navigate('AddRoute')}
                >
                  <Plus size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.emptyAddBtnText}>Add Route</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Boxy FAB (Add Route) */}
      {!loading && !error && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AddRoute')}
        >
          <Plus size={24} color={COLORS.primary} />
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
  header: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textPlaceholder,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textPlaceholder,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 90,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  card: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.textPlaceholder,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  routeName: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
  },
  areaCode: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textPlaceholder,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.textPlaceholder,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  staffCountText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textPlaceholder,
  },
  staffCountValue: {
    fontFamily: 'Poppins-Bold',
    color: COLORS.primary,
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
    fontFamily: 'Poppins-Medium',
    color: COLORS.textPlaceholder,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
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
    borderRadius: 16,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textPlaceholder,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
    fontSize: 14.5,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 22,
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RouteListScreen;
