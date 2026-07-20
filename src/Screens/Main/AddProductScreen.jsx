import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Trash2,
  Check,
  X,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const AddProductScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { userToken } = useContext(AuthContext);

  const productToEdit = route.params?.product;
  const isEditing = !!productToEdit;

  // Form State
  const [name, setName] = useState(productToEdit?.name || '');
  const [price, setPrice] = useState(
    productToEdit?.price !== undefined ? String(productToEdit.price) : ''
  );
  const [unit, setUnit] = useState(productToEdit?.unit || 'can');
  const [isReturnableContainer, setIsReturnableContainer] = useState(
    productToEdit?.isReturnableContainer !== undefined
      ? !!productToEdit.isReturnableContainer
      : false
  );
  const [depositAmount, setDepositAmount] = useState(
    productToEdit?.depositAmount !== undefined
      ? String(productToEdit.depositAmount)
      : ''
  );

  // Image State
  const [selectedImage, setSelectedImage] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(
    productToEdit?.imageUrl || null
  );
  const [photoModalVisible, setPhotoModalVisible] = useState(false);

  // Loading & Toast State
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

  const triggerToast = (message, type = 'error') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type });
    }, 4000);
  };

  const handleSelectFromGallery = async () => {
    setPhotoModalVisible(false);
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.didCancel || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setSelectedImage({
        uri: asset.uri,
        name: asset.fileName || `product_${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
      });
      setExistingImageUrl(null);
    } catch (err) {
      console.error('Image library error:', err);
      triggerToast('Could not open photo gallery', 'error');
    }
  };

  const handleTakePhoto = async () => {
    setPhotoModalVisible(false);
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: true,
      });

      if (result.didCancel || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setSelectedImage({
        uri: asset.uri,
        name: asset.fileName || `camera_${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
      });
      setExistingImageUrl(null);
    } catch (err) {
      console.error('Camera error:', err);
      triggerToast('Could not open camera', 'error');
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setExistingImageUrl(null);
  };

  const validateForm = () => {
    if (!name.trim() || !price.trim()) {
      triggerToast('Product name and price are required', 'error');
      return false;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      triggerToast('Please enter a valid price', 'error');
      return false;
    }
    if (isReturnableContainer && depositAmount.trim()) {
      const depNum = parseFloat(depositAmount);
      if (isNaN(depNum) || depNum < 0) {
        triggerToast('Please enter a valid deposit amount', 'error');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isEditing) {
        if (selectedImage) {
          const formData = new FormData();
          formData.append('name', name.trim());
          formData.append('price', price.trim());
          if (unit.trim()) formData.append('unit', unit.trim());
          formData.append('isReturnableContainer', String(isReturnableContainer));
          if (isReturnableContainer && depositAmount.trim()) {
            formData.append('depositAmount', depositAmount.trim());
          } else {
            formData.append('depositAmount', '0');
          }
          formData.append('image', {
            uri: selectedImage.uri,
            name: selectedImage.name || 'product.jpg',
            type: selectedImage.type || 'image/jpeg',
          });

          const res = await api.updateProduct(userToken, productToEdit.id, formData, true);
          if (res.success) {
            Alert.alert('Success', t('products.updateSuccess'));
            navigation.goBack();
          } else {
            throw new Error(res.message || 'Failed to update product');
          }
        } else {
          const jsonBody = {
            name: name.trim(),
            price: parseFloat(price.trim()),
            unit: unit.trim() || 'can',
            isReturnableContainer,
            depositAmount:
              isReturnableContainer && depositAmount.trim()
                ? parseFloat(depositAmount.trim())
                : 0,
          };

          const res = await api.updateProduct(userToken, productToEdit.id, jsonBody, false);
          if (res.success) {
            Alert.alert('Success', t('products.updateSuccess'));
            navigation.goBack();
          } else {
            throw new Error(res.message || 'Failed to update product');
          }
        }
      } else {
        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('price', price.trim());
        if (unit.trim()) formData.append('unit', unit.trim());
        formData.append('isReturnableContainer', String(isReturnableContainer));
        if (isReturnableContainer && depositAmount.trim()) {
          formData.append('depositAmount', depositAmount.trim());
        } else {
          formData.append('depositAmount', '0');
        }
        if (selectedImage) {
          formData.append('image', {
            uri: selectedImage.uri,
            name: selectedImage.name || 'product.jpg',
            type: selectedImage.type || 'image/jpeg',
          });
        }

        const res = await api.createProduct(userToken, formData);
        if (res.success) {
          Alert.alert('Success', t('products.addSuccess'));
          navigation.goBack();
        } else {
          throw new Error(res.message || 'Failed to create product');
        }
      }
    } catch (err) {
      console.error('Submit product error:', err);
      triggerToast(err.message || 'Error saving product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const displayImageUri = selectedImage?.uri || existingImageUrl;

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Custom Toast Notification */}
      {toast.visible && (
        <View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Product' : 'Add Product'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form Content Wrapper with Crisp Border & White Background */}
          <View style={styles.cardContainer}>
            {/* Select Image Box */}
            <View style={styles.imageBoxContainer}>
              {displayImageUri ? (
                <View style={styles.selectedImageContainer}>
                  <Image
                    source={{ uri: displayImageUri }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={handleRemoveImage}
                  >
                    <Trash2 size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.selectImageBox}
                  activeOpacity={0.8}
                  onPress={() => setPhotoModalVisible(true)}
                >
                  <Text style={styles.selectImageText}>Select image</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Product Name */}
            <Text style={styles.inputLabel}>Product name *</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                placeholder="Product name"
                placeholderTextColor={COLORS.textPlaceholder}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Price & Unit Side by Side */}
            <View style={styles.row}>
              <View style={[styles.col, { marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Price (₹) *</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.input}
                    placeholder="Price"
                    placeholderTextColor={COLORS.textPlaceholder}
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
              </View>

              <View style={[styles.col, { marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Unit</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.input}
                    placeholder="can"
                    placeholderTextColor={COLORS.textPlaceholder}
                    value={unit}
                    onChangeText={setUnit}
                  />
                </View>
              </View>
            </View>

            {/* Returnable Container Checkbox Row */}
            <Text style={styles.sectionTitle}>Returnable Container :</Text>
            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={styles.checkboxOption}
                activeOpacity={0.7}
                onPress={() => setIsReturnableContainer(true)}
              >
                <Text style={styles.checkboxLabel}>Yes</Text>
                <View style={[styles.checkboxSquare, isReturnableContainer && styles.checkboxSquareChecked]}>
                  {isReturnableContainer && <Check size={12} color={COLORS.primary} strokeWidth={3} />}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.checkboxOption, { marginLeft: 20 }]}
                activeOpacity={0.7}
                onPress={() => setIsReturnableContainer(false)}
              >
                <Text style={styles.checkboxLabel}>No</Text>
                <View style={[styles.checkboxSquare, !isReturnableContainer && styles.checkboxSquareChecked]}>
                  {!isReturnableContainer && <Check size={12} color={COLORS.primary} strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            </View>

            {/* Deposit Amount Input (Conditional) */}
            {isReturnableContainer && (
              <View style={{ marginTop: 14 }}>
                <Text style={styles.inputLabel}>Deposit amount (₹)</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.input}
                    placeholder="Deposit amount"
                    placeholderTextColor={COLORS.textPlaceholder}
                    keyboardType="numeric"
                    value={depositAmount}
                    onChangeText={setDepositAmount}
                  />
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Floating Card / Button Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.addButton, loading && styles.addButtonDisabled]}
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Text style={styles.addButtonText}>
                {isEditing ? 'Save Changes' : 'Add'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Photo Picker Modal */}
      <Modal
        visible={photoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPhotoModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select photo option</Text>
              <TouchableOpacity onPress={() => setPhotoModalVisible(false)}>
                <X size={20} color={COLORS.textPlaceholder} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalOptionBtn}
              onPress={handleSelectFromGallery}
            >
              <ImageIcon size={20} color={COLORS.primary} style={{ marginRight: 12 }} />
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOptionBtn, { borderBottomWidth: 0 }]}
              onPress={handleTakePhoto}
            >
              <Camera size={20} color={COLORS.primary} style={{ marginRight: 12 }} />
              <Text style={styles.modalOptionText}>Take Photo with Camera</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textPlaceholder,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  cardContainer: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    borderRadius: 20,
    padding: 20,
  },
  imageBoxContainer: {
    marginBottom: 20,
  },
  selectImageBox: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    borderStyle: 'dashed',
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectImageText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins-Medium',
  },
  selectedImageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    color: COLORS.textPlaceholder,
    marginBottom: 6,
    fontFamily: 'Poppins-Medium',
  },
  inputBox: {
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    borderRadius: 16,
    height: 48,
    paddingHorizontal: 12,
    justifyContent: 'center',
    marginBottom: 16,
  },
  input: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    height: '100%',
  },
  row: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
    marginTop: 6,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 18,
    marginBottom: 10,
  },
  checkboxLabel: {
    fontSize: 13.5,
    color: COLORS.textPlaceholder,
    marginRight: 8,
    fontFamily: 'Poppins-Medium',
  },
  checkboxSquare: {
    width: 18,
    height: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.textPlaceholder,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  checkboxSquareChecked: {
    backgroundColor: COLORS.textPlaceholder,
    borderColor: COLORS.primary,
  },
  bottomBar: {
    backgroundColor: COLORS.primaryLight,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.textPlaceholder,
  },
  addButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
  },
  // Photo Picker Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.primaryLight,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
  },
  modalOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
  },
  modalOptionText: {
    fontSize: 14,
    color: COLORS.textPlaceholder,
    fontFamily: 'Poppins-Medium',
  },
  // Custom Toast Styles
  toast: {
    position: 'absolute',
    top: 16,
    left: 24,
    right: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastError: {
    backgroundColor: COLORS.surface,
  },
  toastSuccess: {
    backgroundColor: COLORS.surface,
  },
  toastText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
});

export default AddProductScreen;
