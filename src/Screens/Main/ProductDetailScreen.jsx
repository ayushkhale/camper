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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Package,
  AlertCircle,
  RefreshCw,
  RefreshCcw,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

const ProductDetailScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { userToken } = useContext(AuthContext);

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

  // Always fetch fresh on load/focus because imageUrl expires in 15 mins
  useFocusEffect(
    useCallback(() => {
      fetchProductDetail();
    }, [userToken, productId])
  );

  const handleToggleStatus = async (value) => {
    if (!product || statusUpdating) return;
    setStatusUpdating(true);

    try {
      // PATCH /:id with application/json
      const res = await api.updateProduct(
        userToken,
        product.id,
        { isActive: value },
        false
      );
      if (res.success && res.data) {
        setProduct({ ...product, isActive: value, ...res.data });
      } else {
        Alert.alert('Error', res.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Toggle status error:', err);
      Alert.alert('Error', err.message || 'Failed to update product status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDeleteConfirm = () => {
    Alert.alert(
      t('products.deleteBtn'),
      t('products.deleteConfirm'),
      [
        { text: t('products.cancel'), style: 'cancel' },
        {
          text: t('products.deleteBtn'),
          style: 'destructive',
          onPress: handleDeleteProduct,
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteProduct = async () => {
    if (deleting || !product) return;
    setDeleting(true);

    try {
      const res = await api.deleteProduct(userToken, product.id);
      if (res.success) {
        Alert.alert('Success', t('products.deleteSuccess'));
        navigation.goBack();
      } else {
        throw new Error(res.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Delete product error:', err);
      Alert.alert('Error', err.message || 'Could not delete product');
      setDeleting(false);
    }
  };

  const isActive = product?.isActive !== false;

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('products.title')}</Text>
        {product && !loading && !error ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProduct', { product })}
          >
            <Edit3 size={20} color={COLORS.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading product info...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={48} color={COLORS.primary} style={{ marginBottom: 14 }} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProductDetail}>
            <RefreshCw size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : product ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Image Header Card */}
          <View style={styles.imageCard}>
            {product.imageUrl ? (
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Package size={56} color={COLORS.textPlaceholder} />
                <Text style={styles.noImageText}>No image uploaded</Text>
              </View>
            )}

            {/* Status Floating Tag */}
            <View
              style={[
                styles.statusTag,
                isActive ? styles.statusTagActive : styles.statusTagInactive,
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

          {/* Product Details Section */}
          <View style={styles.infoCard}>
            <Text style={styles.productName}>{product.name}</Text>
            
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>{t('products.price')}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceValue}>
                  ₹ {parseFloat(product.price || 0).toLocaleString()}
                </Text>
                {product.unit ? (
                  <Text style={styles.unitBadge}>{product.unit}</Text>
                ) : null}
              </View>
            </View>

            {/* Returnable Container Details */}
            {product.isReturnableContainer && (
              <View style={styles.returnableBox}>
                <View style={styles.returnableHeader}>
                  <RefreshCcw size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.returnableTitle}>{t('products.returnable')}</Text>
                </View>
                <View style={styles.returnableRow}>
                  <Text style={styles.returnableLabel}>{t('products.depositAmount')}:</Text>
                  <Text style={styles.returnableValue}>
                    ₹ {parseFloat(product.depositAmount || 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Active / Inactive Status Toggle Card */}
          <View style={styles.statusCard}>
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
                trackColor={{ false: COLORS.textPlaceholder, true: '#B3D7F8' }}
                thumbColor={isActive ? COLORS.primary : '#f4f3f4'}
              />
            )}
          </View>

          {/* Actions Section */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.editFullButton}
              onPress={() => navigation.navigate('EditProduct', { product })}
            >
              <Edit3 size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.editFullText}>{t('products.editProduct')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteButton, deleting && { opacity: 0.6 }]}
              onPress={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : (
                <>
                  <Trash2 size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.deleteButtonText}>{t('products.deleteBtn')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textPlaceholder,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
  },
  editButton: {
    padding: 6,
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
    fontFamily: 'Inter-Medium',
    color: COLORS.textPlaceholder,
  },
  errorText: {
    fontSize: 14.5,
    fontFamily: 'Inter-Medium',
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  imageCard: {
    width: '100%',
    height: 230,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    marginBottom: 20,
    position: 'relative',
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
  noImageText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: COLORS.textPlaceholder,
    marginTop: 10,
  },
  statusTag: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11.5,
    fontFamily: 'Inter-Bold',
  },
  infoCard: {
    backgroundColor: COLORS.primaryLight,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    marginBottom: 16,
  },
  productName: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
    marginBottom: 14,
  },
  priceContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.textPlaceholder,
    paddingTop: 14,
  },
  priceLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: COLORS.textPlaceholder,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceValue: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    color: COLORS.primary,
  },
  unitBadge: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    marginLeft: 10,
  },
  returnableBox: {
    marginTop: 16,
    backgroundColor: COLORS.textPlaceholder,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
  },
  returnableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  returnableTitle: {
    fontSize: 13.5,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
  },
  returnableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  returnableLabel: {
    fontSize: 12.5,
    fontFamily: 'Inter-Medium',
    color: COLORS.textPrimary,
  },
  returnableValue: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: COLORS.primary,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryLight,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    marginBottom: 24,
  },
  statusCardLeft: {
    flex: 1,
    paddingRight: 14,
  },
  statusCardTitle: {
    fontSize: 14.5,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  statusCardSub: {
    fontSize: 11.5,
    fontFamily: 'Inter-Regular',
    color: COLORS.textPlaceholder,
  },
  actionsContainer: {
    marginTop: 6,
  },
  editFullButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  editFullText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter-Bold',
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontSize: 15,
    fontFamily: 'Inter-Bold',
  },
});

export default ProductDetailScreen;
