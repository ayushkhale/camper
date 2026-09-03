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
import FastImage from 'react-native-fast-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  Package,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  RefreshCw,
  RefreshCcw,
  ArrowLeft,
} from 'lucide-react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import CurvedHeader from '../../components/CurvedHeader';

const ProductCatalogScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { userToken, user } = useContext(AuthContext);

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
        const urisToPreload = response.data
          .filter(p => p.imageUrl)
          .map(p => ({ uri: p.imageUrl }));

        if (urisToPreload.length > 0) {
          FastImage.preload(urisToPreload);
        }

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
    const priceStr = `₹${parseFloat(item.price || 0).toLocaleString()}`;
    const returnableStr = item.isReturnableContainer ? ' • Returnable' : '';

    return (
      <TouchableOpacity
        style={[
          styles.card, 
          { borderLeftWidth: 4, borderLeftColor: isActive ? '#10B981' : '#EF4444' }
        ]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
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
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
            ) : (
              <Package size={22} color="#0B409C" />
            )}
            <View style={[
              styles.avatarBadge,
              { backgroundColor: isActive ? '#10B981' : '#EF4444' }
            ]} />
          </View>

          {/* Center Details */}
          <View style={styles.titleContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={styles.productName} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              {item.isReturnableContainer && (
                <RefreshCcw size={12} color="#64748B" style={{ marginRight: 4 }} />
              )}
              <Text style={styles.subText} numberOfLines={1}>
                {item.unit ? `Unit: ${item.unit}` : 'No Unit'}
              </Text>
            </View>
          </View>

          {/* Right Action & Status */}
          <View style={styles.rightActionContainer}>
            <View style={styles.statusCol}>
              <Text style={styles.priceAmount}>{priceStr}</Text>
              <Text style={styles.statusSubtext}>
                {isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>

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
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontFamily: 'Rubik-Bold' }}>{t('products.title')}</Text>
          </View>
        }
        leftIcon={<ArrowLeft size={24} color="#FFFFFF" />}
        onLeftPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.openDrawer?.()}
        height={140}
        contentStyle={{ paddingTop: Platform.OS === 'ios' ? 40 : 20, paddingBottom: 25 }}
      />
      
      <View style={styles.contentWrapper}>
        {/* Search Box */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color={COLORS.textPlaceholder} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('products.searchPlaceholder')}
              placeholderTextColor={COLORS.textPlaceholder}
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <AlertCircle size={40} color={COLORS.primary} style={{ marginBottom: 12 }} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchProducts()}>
              <RefreshCw size={16} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.retryText}>{t('common.retry')}</Text>
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
                <Package size={48} color={COLORS.textPlaceholder} style={{ marginBottom: 16 }} />
                <Text style={styles.emptyTitle}>{t('products.noProductsTitle')}</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? t('customers.noCustomersSearch')
                    : t('products.noProductsSub')}
                </Text>
                {!searchQuery && user?.role !== 'staff' && (
                  <TouchableOpacity
                    style={styles.emptyAddBtn}
                    onPress={() => navigation.navigate('AddProduct')}
                  >
                    <Plus size={18} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.emptyAddBtnText}>{t('products.addNew')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </View>

      {!loading && !error && user?.role !== 'staff' && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AddProduct')}
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
    backgroundColor: '#F8FAFC',
  },
  contentWrapper: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
    marginTop: 10,
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
    paddingTop: 8,
    paddingBottom: 90,
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
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
  },
  titleContainer: {
    flex: 1,
  },
  productName: {
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
  priceAmount: {
    fontSize: 13,
    fontFamily: 'Rubik-Bold',
    color: '#0B409C',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 10,
    fontFamily: 'Rubik-Medium',
    color: '#64748B',
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
    fontFamily: 'Geologica-Bold',
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textPlaceholder,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Geologica-Medium',
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
    fontFamily: 'Geologica-Bold',
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 50,
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
});

export default ProductCatalogScreen;
