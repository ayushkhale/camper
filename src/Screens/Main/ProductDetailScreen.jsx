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
  const { userToken } = useContext(AuthContext);
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
        <Text style={styles.loadingText}>Loading details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Product not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CurvedHeader
        title={<Text style={{ color: '#FFF', fontSize: 20, fontFamily: 'Geologica-Bold' }}>Product Details</Text>}
        leftIcon={<ChevronLeft size={28} color="#FFF" />}
        onLeftPress={() => navigation.goBack()}
        rightIcon={
          <View style={{ flexDirection: 'row', gap: 12, marginRight: 16 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('EditProduct', { product })}
              style={styles.headerActionBtnDark}
            >
              <Edit size={18} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteConfirm}
              disabled={deleting}
              style={[styles.headerActionBtnDark, { backgroundColor: 'rgba(229, 62, 62, 0.2)' }]}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#FFD1D1" />
              ) : (
                <Trash2 size={18} color="#FFD1D1" />
              )}
            </TouchableOpacity>
          </View>
        }
        height={140}
        contentStyle={{ paddingTop: Platform.OS === 'ios' ? 40 : 20, paddingBottom: 25 }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ── Profile Hero Section (Identical to Customer Detail Screen) ── */}
        <View style={styles.profileHero}>
          <View style={styles.avatarContainer}>
            {product.imageUrl ? (
              <Image source={{ uri: product.imageUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Package size={38} color={COLORS.primary} />
              </View>
            )}
          </View>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: isActive ? '#16A34A' : '#94A3B8' }]} />
            <Text style={[styles.statusText, { color: isActive ? '#15803D' : '#64748B' }]}>
              {isActive ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
        </View>

        {/* ── Product Info Card ── */}
        <Text style={styles.sectionTitle}>Product Info</Text>
        <View style={styles.detailsCard}>
          {/* Price */}
          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <IndianRupee size={18} color={COLORS.textSecondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Base Price</Text>
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
              <Text style={styles.detailLabel}>Billing Unit</Text>
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
              <Text style={styles.detailLabel}>Returnable Container</Text>
              <Text style={styles.detailValue}>{product.isReturnableContainer ? 'Yes' : 'No'}</Text>
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
                  <Text style={styles.detailLabel}>Deposit Amount</Text>
                  <Text style={styles.detailValue}>
                    ₹ {parseFloat(product.depositAmount || 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ── Status Controls Toggle Card ── */}
        <Text style={styles.sectionTitle}>Status Management</Text>
        <View style={styles.statusToggleCard}>
          <View style={styles.statusCardLeft}>
            <Text style={styles.statusCardTitle}>Active Status</Text>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  profileHero: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 36,
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    fontSize: 24,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Geologica-Bold',
    letterSpacing: 0.5,
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
