import React, { useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  Package,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  RefreshCcw,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

const ProductCatalogScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { userToken } = useContext(AuthContext);

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = async (isRefresh = false) => {
    if (!userToken) return;
    if (!isRefresh && products.length === 0) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await api.listProducts(userToken);
      if (response.success && Array.isArray(response.data)) {
        setProducts(response.data);
        filterList(response.data, searchQuery);
      } else {
        throw new Error(response.message || 'Failed to fetch catalog');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Could not load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch fresh data every time screen comes into focus because imageUrl expires in 15 mins
  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [userToken])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts(true);
  };

  const filterList = (list, query) => {
    if (!query || query.trim() === '') {
      setFilteredProducts(list);
    } else {
      const q = query.toLowerCase();
      const filtered = list.filter(
        (item) =>
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.unit && item.unit.toLowerCase().includes(q))
      );
      setFilteredProducts(filtered);
    }
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    filterList(products, text);
  };

  const renderProductCard = ({ item }) => {
    const isActive = item.isActive !== false;

    return (
      <TouchableOpacity
        style={[styles.productCard, !isActive && styles.productCardInactive]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      >
        <View style={styles.imageWrapper}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Package size={28} color={COLORS.textPlaceholder} />
            </View>
          )}
          <View
            style={[
              styles.statusBadge,
              isActive ? styles.statusBadgeActive : styles.statusBadgeInactive,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isActive ? COLORS.primary : COLORS.textPlaceholder },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isActive ? COLORS.primary : COLORS.textPlaceholder },
              ]}
            >
              {isActive ? t('products.active') : t('products.inactive')}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.name}
            </Text>
            <ChevronRight size={18} color={COLORS.textPlaceholder} />
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceText}>
              ₹ {parseFloat(item.price || 0).toLocaleString()}
            </Text>
            {item.unit ? (
              <Text style={styles.unitText}>/ {item.unit}</Text>
            ) : null}
          </View>

          {item.isReturnableContainer && (
            <View style={styles.returnableBadge}>
              <RefreshCcw size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
              <Text style={styles.returnableText}>
                {t('products.returnable')}
                {item.depositAmount && parseFloat(item.depositAmount) > 0
                  ? ` (₹${parseFloat(item.depositAmount)} dep)`
                  : ''}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Search and Header Banner */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textPlaceholder} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('products.searchPlaceholder')}
            placeholderTextColor={COLORS.textPlaceholder}
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange('')}>
              <XCircle size={18} color={COLORS.textPlaceholder} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Catalog List or States */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading catalog...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={44} color={COLORS.primary} style={{ marginBottom: 12 }} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchProducts()}>
            <RefreshCw size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id || Math.random().toString()}
          renderItem={renderProductCard}
          contentContainerStyle={
            filteredProducts.length === 0 ? styles.emptyListContent : styles.listContent
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
                <Package size={48} color={COLORS.textPlaceholder} />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery
                  ? `No products found matching "${searchQuery}"`
                  : t('products.noProductsTitle')}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try a different search term' : t('products.noProductsSub')}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => navigation.navigate('AddProduct')}
                >
                  <Plus size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.emptyAddBtnText}>{t('products.addNew')}</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Floating Action Button (Add Product) */}
      {!loading && !error && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Plus size={26} color={COLORS.primary} />
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
  searchHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
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
  productCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  productCardInactive: {
    opacity: 0.75,
    backgroundColor: COLORS.surfaceMuted,
  },
  imageWrapper: {
    width: 100,
    height: 105,
    backgroundColor: COLORS.surfaceMuted,
    position: 'relative',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  productName: {
    flex: 1,
    fontSize: 15.5,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
    marginRight: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  priceText: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: COLORS.primary,
  },
  unitText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  returnableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  returnableText: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
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
    color: COLORS.textSecondary,
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
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13.5,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSecondary,
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

export default ProductCatalogScreen;
