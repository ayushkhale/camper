import React, { useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  Edit,
  Trash2,
  Package,
  AlertCircle,
  RefreshCw,
  RefreshCcw,
  IndianRupee,
  Info,
  Calendar,
  ArrowLeft,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import CurvedHeader from '../../components/CurvedHeader';

const ProductDetailScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { userToken, user } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const productId = route.params?.productId;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchProductDetail = async () => {
    if (!userToken || !productId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.getProduct(userToken, productId);
      if (res.success && res.data) {
        setProduct(res.data);
      } else {
        throw new Error(res.message || 'Product not found');
      }
    } catch (err) {
      console.error('Error fetching product detail:', err);
      setError(err.message || 'Could not load product details');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProductDetail();
    }, [userToken, productId])
  );

  const handleToggleStatus = async (value) => {
    if (!product || statusUpdating) return;
    setStatusUpdating(true);

    try {
      const res = await api.updateProduct(
        userToken,
        product.id,
        { isActive: value },
        false
      );
      if (res.success && res.data) {
        setProduct({ ...product, isActive: value, ...res.data });
        showAlert('Success', `Product ${value ? 'activated' : 'deactivated'} successfully`, 'success');
      } else {
        showAlert('Error', res.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      console.error('Toggle status error:', err);
      showAlert('Error', err.message || 'Failed to update product status', 'error');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDeleteConfirm = () => {
    showAlert(
      t('products.deleteBtn'),
      t('products.deleteConfirm'),
      [
        { text: t('products.cancel'), style: 'cancel' },
        {
          text: t('products.deleteBtn'),
          style: 'destructive',
          onPress: handleDeleteProduct,
        },
      ]
    );
  };

  const handleDeleteProduct = async () => {
    if (deleting || !product) return;
    setDeleting(true);

    try {
      const res = await api.deleteProduct(userToken, product.id);
      if (res.success) {
        showAlert('Success', t('products.deleteSuccess'), 'success');
        navigation.goBack();
      } else {
        throw new Error(res.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Delete product error:', err);
      showAlert('Error', err.message || 'Could not delete product', 'error');
      setDeleting(false);
    }
  };

  const isActive = product?.isActive !== false;

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Product not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>{t('common.goBack')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CurvedHeader
        title={t('products.editProduct')}
        leftIcon={<ArrowLeft size={24} color="#0B409C" />}
        onLeftPress={() => navigation.goBack()}
        rightIcon={
          user?.role !== 'staff' ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[styles.headerActionBtnDark, { backgroundColor: '#E0E7FF' }]}
                onPress={() => navigation.navigate('EditProduct', { product })}
              >
                <Edit size={18} color="#0B409C" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerActionBtnDark, { backgroundColor: '#FEE2E2' }]}
                onPress={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <Trash2 size={18} color="#DC2626" />
                )}
              </TouchableOpacity>
            </View>
          ) : null
        }
        height={120}
        contentStyle={{ paddingTop: 10, paddingBottom: 25 }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ── Profile Hero Section ── */}
        <View style={styles.profileHeroCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarContainer}>
              {product.imageUrl ? (
                <FastImage source={{ uri: product.imageUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Package size={38} color="#0B409C" />
                </View>
              )}
            </View>
            <View style={[styles.avatarStatusDot, { backgroundColor: isActive ? '#16A34A' : '#94A3B8' }]} />
          </View>

          <View style={styles.heroRight}>
            <Text style={styles.productNameHero}>{product.name}</Text>
            
            <View style={[styles.heroStatusPill, { backgroundColor: isActive ? '#DCFCE7' : '#F1F5F9' }]}>
              <View style={[styles.heroStatusDot, { backgroundColor: isActive ? '#16A34A' : '#94A3B8' }]} />
              <Text style={[styles.heroStatusText, { color: isActive ? '#16A34A' : '#64748B' }]}>
                {isActive ? t('products.active').toUpperCase() : t('products.inactive').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Product Info Card ── */}
        <Text style={styles.sectionTitle}>{t('products.image')}</Text>
        <View style={styles.detailsCard}>
          {/* Price */}
          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <IndianRupee size={18} color={COLORS.textSecondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('products.price')}</Text>
              <Text style={styles.detailValue}>
                ₹ {parseFloat(product.price || 0).toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Unit */}
          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Info size={18} color={COLORS.textSecondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('products.unit')}</Text>
              <Text style={styles.detailValue}>{product.unit || '—'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Returnable */}
          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <RefreshCcw size={18} color={COLORS.textSecondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('products.returnable')}</Text>
              <Text style={styles.detailValue}>{product.isReturnableContainer ? t('common.yes') : t('common.no')}</Text>
            </View>
          </View>

          {/* Conditional Deposit */}
          {product.isReturnableContainer && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <View style={[styles.detailIconBox, { backgroundColor: COLORS.primaryLight, borderColor: COLORS.border }]}>
                  <IndianRupee size={18} color={COLORS.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>{t('products.depositAmount')}</Text>
                  <Text style={styles.detailValue}>
                    ₹ {parseFloat(product.depositAmount || 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ── Status Controls Toggle Card ── */}
        <Text style={styles.sectionTitle}>{t('products.status')}</Text>
        <View style={styles.statusToggleCard}>
          <View style={styles.statusCardLeft}>
            <Text style={styles.statusCardTitle}>{t('products.status')}</Text>
            <Text style={styles.statusCardSub}>
              {isActive
                ? 'Product is visible and active for orders'
                : 'Product is currently hidden/inactive'}
            </Text>
          </View>
          {statusUpdating ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Switch
              value={isActive}
              onValueChange={handleToggleStatus}
              disabled={user?.role === 'staff'}
              trackColor={{ false: COLORS.border, true: COLORS.success }}
              thumbColor={COLORS.background}
              ios_backgroundColor={COLORS.border}
            />
          )}
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerActionBtnDark: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 10,
    borderRadius: 14,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Geologica-Medium',
  },
  errorText: {
    fontSize: 14,
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Geologica-Medium',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 14,
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },

  // Profile Hero
  profileHeroCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 36,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0B409C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 20,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F8FAFC',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarStatusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  heroRight: {
    flex: 1,
    alignItems: 'flex-start',
  },
  productNameHero: {
    fontSize: 22,
    fontFamily: 'Geologica-Bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  heroStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  heroStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  heroStatusText: {
    fontSize: 11,
    fontFamily: 'Geologica-Bold',

  },

  // Section details card
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  detailsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },

  // Status Switch Card
  statusToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  statusCardLeft: {
    flex: 1,
    paddingRight: 14,
  },
  statusCardTitle: {
    fontSize: 15,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  statusCardSub: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
  },
});

export default ProductDetailScreen;
