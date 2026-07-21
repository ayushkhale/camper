import React, { useState, useEffect, useContext } from 'react';
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
import { ArrowLeft } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

const AddRouteScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userToken } = useContext(AuthContext);

  const routeToEdit = route.params?.route;
  const isEditing = !!routeToEdit;

  const [name, setName] = useState(routeToEdit?.name || '');
  const [areaCode, setAreaCode] = useState(routeToEdit?.areaCode || '');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

  const triggerToast = (message, type = 'error') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type });
    }, 4000);
  };

  const validateForm = () => {
    if (!name.trim()) {
      triggerToast('Route name is required', 'error');
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
          Alert.alert('Success', 'Route updated successfully');
          navigation.goBack();
        } else {
          throw new Error(res.message || 'Failed to update route');
        }
      } else {
        const res = await api.createRoute(userToken, body);
        if (res.success) {
          Alert.alert('Success', 'Route created successfully');
          navigation.goBack();
        } else {
          throw new Error(res.message || 'Failed to create route');
        }
      }
    } catch (err) {
      console.error('Submit route error:', err);
      triggerToast(err.message || 'Error saving route', 'error');
    } finally {
      setLoading(false);
    }
  };

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
          {isEditing ? 'Edit Route' : 'Create Route'}
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
          <View style={styles.cardContainer}>
            {/* Route Name Input */}
            <Text style={styles.inputLabel}>Route Name *</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Satellite Area Route"
                placeholderTextColor={COLORS.textPlaceholder}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Area Code Input */}
            <Text style={styles.inputLabel}>Area Code (Optional)</Text>
            <View style={styles.inputBox}>
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
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Text style={styles.saveButtonText}>
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
    fontFamily: 'Inter-Bold',
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
  inputLabel: {
    fontSize: 12,
    color: COLORS.textPlaceholder,
    marginBottom: 6,
    fontFamily: 'Inter-Medium',
  },
  inputBox: {
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    borderRadius: 16,
    height: 48,
    paddingHorizontal: 12,
    justifyContent: 'center',
    marginBottom: 20,
  },
  input: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    height: '100%',
  },
  bottomBar: {
    backgroundColor: COLORS.primaryLight,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.textPlaceholder,
  },
  saveButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter-Bold',
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
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});

export default AddRouteScreen;
