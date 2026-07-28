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
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, MapPin, Hash } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useAlert } from '../../context/AlertContext';

const AddRouteScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userToken } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const routeToEdit = route.params?.route;
  const isEditing = !!routeToEdit;

  const [name, setName] = useState(routeToEdit?.name || '');
  const [areaCode, setAreaCode] = useState(routeToEdit?.areaCode || '');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!name.trim()) {
      showAlert('Route Name Required', 'Route name is required', 'warning');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const body = {
      name: name.trim(),
      areaCode: areaCode.trim() || null,
    };

    try {
      if (isEditing) {
        const res = await api.updateRoute(userToken, routeToEdit.id, body);
        if (res.success) {
          showAlert('Success', 'Route updated successfully', 'success');
          navigation.goBack();
        } else {
          throw new Error(res.message || 'Failed to update route');
        }
      } else {
        const res = await api.createRoute(userToken, body);
        if (res.success) {
          showAlert('Success', 'Route created successfully', 'success');
          navigation.goBack();
        } else {
          throw new Error(res.message || 'Failed to create route');
        }
      }
    } catch (err) {
      console.error('Submit route error:', err);
      showAlert('Error', err.message || 'Error saving route', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>

      {/* Header Row - Matches AddCustomer Header Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerRightSpacing} />
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
          {/* Title Container (Matches AddCustomerScreen) */}
          <View style={styles.titleContainer}>
            <Text style={styles.pageTitle}>
              {isEditing ? 'Edit Route' : 'Create Route'}
            </Text>
            <Text style={styles.pageSubtitle}>
              {isEditing ? 'Update route distribution area' : 'Set up a new delivery route'}
            </Text>
          </View>

          {/* Form Area - flat direct inputs */}
          <View style={styles.form}>
            {/* Route Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Route Name *</Text>
              <View style={styles.inputContainer}>
                <MapPin size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Satellite Area Route"
                  placeholderTextColor={COLORS.textPlaceholder}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Area Code Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Area Code (Optional)</Text>
              <View style={styles.inputContainer}>
                <Hash size={20} color={COLORS.textPlaceholder} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. SAT-01"
                  placeholderTextColor={COLORS.textPlaceholder}
                  value={areaCode}
                  onChangeText={setAreaCode}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Actions Bar (Matches AddCustomerScreen) */}
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
                {isEditing ? 'Save Changes' : 'Create Route'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 14,
    paddingBottom: 4,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerRightSpacing: {
    width: 32,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  titleContainer: {
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: 'Geologica-Bold',
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 15,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPlaceholder,
  },
  form: {
    marginBottom: 0,
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

export default AddRouteScreen;
