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
  ChevronLeft,
  Camera,
  Image as ImageIcon,
  Trash2,
  Check,
  X,
  Package,
  IndianRupee,
  Info,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useAlert } from '../../context/AlertContext';
import CurvedHeader from '../../components/CurvedHeader';

const AddProductScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { userToken } = useContext(AuthContext);
  const { showAlert } = useAlert();

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
      showAlert('Error', 'Could not open photo gallery', 'error');
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
      showAlert('Error', 'Could not open camera', 'error');
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setExistingImageUrl(null);
  };

  const validateForm = () => {
    if (!name.trim()) {
      showAlert('Required', t('products.nameRequired'), 'warning');
      return false;
    }
    if (!price.trim()) {
      showAlert('Required', t('products.priceRequired'), 'warning');
      return false;
    }
    if (isNaN(price) || parseFloat(price) < 0) {
      showAlert('Invalid Price', t('products.invalidPrice'), 'warning');
      return false;
    }
    if (
      isReturnableContainer &&
      depositAmount.trim() &&
      (isNaN(depositAmount) || parseFloat(depositAmount) < 0)
    ) {
      showAlert('Invalid Deposit', t('products.invalidDeposit'), 'warning');
      return false;
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
            showAlert('Success', t('products.updateSuccess'), 'success');
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
            showAlert('Success', t('products.updateSuccess'), 'success');
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
          showAlert('Success', t('products.addSuccess'), 'success');
          navigation.goBack();
        } else {
          throw new Error(res.message || 'Failed to create product');
        }
      }
    } catch (err) {
      console.error('Submit product error:', err);
      showAlert('Error', err.message || 'Error saving product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const displayImageUri = selectedImage?.uri || existingImageUrl;

  return (
    <View style={styles.container}>
      <CurvedHeader
        title={
          <View>
            <Text style={{ color: '#FFF', fontSize: 20, fontFamily: 'Geologica-Bold' }}>
              {isEditing ? 'Edit Product' : 'Add Product'}
            </Text>
          </View>
        }
        leftIcon={<ChevronLeft size={28} color="#FFF" />}
        onLeftPress={() => navigation.goBack()}
        height={140}
        contentStyle={{ paddingTop: Platform.OS === 'ios' ? 40 : 20, paddingBottom: 25 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Form Area - flat direct inputs */}
          <View style={styles.form}>
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
                    <Trash2 size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.selectImageBox}
                  activeOpacity={0.8}
                  onPress={() => setPhotoModalVisible(true)}
                >
                  <Camera size={26} color={COLORS.textPlaceholder} style={{ marginBottom: 8 }} />
                  <Text style={styles.selectImageText}>Select product image</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Product Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Product name *</Text>
              <View style={styles.inputContainer}>
                <Package size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 20L Water Jar"
                  placeholderTextColor={COLORS.textPlaceholder}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Price & Unit Side by Side */}
            <View style={styles.row}>
              <View style={[styles.col, { marginRight: 8 }]}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Price (₹) *</Text>
                  <View style={styles.inputContainer}>
                    <IndianRupee size={18} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 150"
                      placeholderTextColor={COLORS.textPlaceholder}
                      keyboardType="numeric"
                      value={price}
                      onChangeText={setPrice}
                    />
                  </View>
                </View>
              </View>

              <View style={[styles.col, { marginLeft: 8 }]}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Unit</Text>
                  <View style={styles.inputContainer}>
                    <Info size={18} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. jar"
                      placeholderTextColor={COLORS.textPlaceholder}
                      value={unit}
                      onChangeText={setUnit}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Returnable Container Checkbox Row */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Returnable Container</Text>
              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  style={[styles.checkboxOption, isReturnableContainer && styles.checkboxOptionActive]}
                  activeOpacity={0.7}
                  onPress={() => setIsReturnableContainer(true)}
                >
                  <Text style={[styles.checkboxLabel, isReturnableContainer && styles.checkboxLabelActive]}>Yes</Text>
                  <View style={[styles.checkboxSquare, isReturnableContainer && styles.checkboxSquareChecked]}>
                    {isReturnableContainer && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.checkboxOption, !isReturnableContainer && styles.checkboxOptionActive]}
                  activeOpacity={0.7}
                  onPress={() => setIsReturnableContainer(false)}
                >
                  <Text style={[styles.checkboxLabel, !isReturnableContainer && styles.checkboxLabelActive]}>No</Text>
                  <View style={[styles.checkboxSquare, !isReturnableContainer && styles.checkboxSquareChecked]}>
                    {!isReturnableContainer && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Deposit Amount Input (Conditional) */}
            {isReturnableContainer && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Deposit amount (₹)</Text>
                <View style={styles.inputContainer}>
                  <IndianRupee size={18} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 200"
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

        {/* Bottom Floating Button Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, loading && styles.btnDisabled]}
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.btnTextPrimary}>
                {isEditing ? 'Save Changes' : 'Add Product'}
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
              <Text style={styles.modalTitle}>Select product photo</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  form: {
    marginBottom: 0,
  },
  imageBoxContainer: {
    marginBottom: 24,
  },
  selectImageBox: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectImageText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Geologica-Bold',
  },
  selectedImageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    width: 32,
    height: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.textPrimary,
    fontFamily: 'Geologica-Medium',
    fontSize: 15,
    padding: 0,
  },
  row: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  checkboxOptionActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.border,
  },
  checkboxLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Geologica-Medium',
  },
  checkboxLabelActive: {
    color: COLORS.primary,
    fontFamily: 'Geologica-Bold',
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSquareChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 60,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  btn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnTextPrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Geologica-Bold',
  },
  // Photo Picker Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },
  modalOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalOptionText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontFamily: 'Geologica-Medium',
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
  toastError: { backgroundColor: COLORS.danger },
  toastSuccess: { backgroundColor: COLORS.success },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    textAlign: 'center',
  },
});

export default AddProductScreen;
