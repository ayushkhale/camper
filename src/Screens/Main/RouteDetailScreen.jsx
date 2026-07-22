import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  Trash2,
  Edit,
  UserPlus,
  Calendar,
  X,
  UserCheck,
  History,
  Check,
  ChevronRight,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

const RouteDetailScreen = () => {
  const navigation = useNavigation();
  const routeParams = useRoute();
  const { userToken } = useContext(AuthContext);
  const routeId = routeParams.params?.routeId;

  // State
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Staff list & assign state
  const [allStaff, setAllStaff] = useState([]);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffDropdownVisible, setStaffDropdownVisible] = useState(false);
  const [isPermanent, setIsPermanent] = useState(true);
  
  // Date states (formatted YYYY-MM-DD)
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [effectiveFrom, setEffectiveFrom] = useState(getTodayString());
  const [effectiveTo, setEffectiveTo] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

  const [activeDatePicker, setActiveDatePicker] = useState(null); // 'effectiveFrom' | 'effectiveTo' | null

  const formatDateString = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const parseDateString = (str) => {
    if (!str) return new Date();
    const parts = str.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date();
  };

  const onDatePickerChange = (event, selectedDate) => {
    const pickerType = activeDatePicker;
    setActiveDatePicker(null);
    if (selectedDate) {
      const formatted = formatDateString(selectedDate);
      if (pickerType === 'effectiveFrom') setEffectiveFrom(formatted);
      if (pickerType === 'effectiveTo') setEffectiveTo(formatted);
    }
  };

  const triggerToast = (message, type = 'error') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type });
    }, 4000);
  };

  const fetchRouteDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getRoute(userToken, routeId);
      if (res.success) {
        setRouteData(res.data);
      } else {
        throw new Error(res.message || 'Route not found');
      }
    } catch (err) {
      console.error('Error fetching route details:', err);
      setError(err.message || 'Failed to load route details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStaff = async () => {
    try {
      const res = await api.listStaff(userToken);
      if (res.success) {
        // filter active staff
        const activeStaffList = (res.data || []).filter((s) => s.status === 'active');
        setAllStaff(activeStaffList);
      }
    } catch (err) {
      console.error('Error fetching staff list for routes:', err);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (routeId) {
        fetchRouteDetail();
        fetchAllStaff();
      }
    }, [routeId])
  );

  const handleDeleteRoute = () => {
    Alert.alert(
      'Delete Route',
      'Are you sure you want to delete this route? Historical delivery records will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.deleteRoute(userToken, routeId);
              if (res.success) {
                Alert.alert('Success', 'Route deleted successfully');
                navigation.goBack();
              } else {
                throw new Error(res.message || 'Failed to delete route');
              }
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not delete route');
            }
          },
        },
      ]
    );
  };

  const handleEndAssignment = (staffRouteId, staffName) => {
    Alert.alert(
      'End Assignment',
      `Are you sure you want to remove ${staffName} from this route?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.endStaffAssignment(userToken, routeId, staffRouteId);
              if (res.success) {
                Alert.alert('Success', 'Staff assignment ended successfully');
                fetchRouteDetail();
              } else {
                throw new Error(res.message || 'Failed to end assignment');
              }
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not end assignment');
            }
          },
        },
      ]
    );
  };

  const handleAssignStaff = async () => {
    if (!selectedStaff) {
      triggerToast('Please select a staff member', 'error');
      return;
    }

    if (!effectiveFrom.trim()) {
      triggerToast('Start date is required (YYYY-MM-DD)', 'error');
      return;
    }

    // Basic date format validation YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(effectiveFrom)) {
      triggerToast('Start date must be in YYYY-MM-DD format', 'error');
      return;
    }

    if (!isPermanent && effectiveTo.trim() && !dateRegex.test(effectiveTo)) {
      triggerToast('End date must be in YYYY-MM-DD format', 'error');
      return;
    }

    setAssignLoading(true);
    const body = {
      userId: selectedStaff.id,
      effectiveFrom: effectiveFrom.trim(),
      effectiveTo: isPermanent ? null : (effectiveTo.trim() || null),
    };

    try {
      const res = await api.assignStaff(userToken, routeId, body);
      if (res.success) {
        Alert.alert('Success', 'Staff assigned to route successfully');
        setAssignModalVisible(false);
        // Reset states
        setSelectedStaff(null);
        setEffectiveFrom(getTodayString());
        setEffectiveTo('');
        setIsPermanent(true);
        fetchRouteDetail();
      } else {
        throw new Error(res.message || 'Failed to assign staff');
      }
    } catch (err) {
      console.error('Assign staff error:', err);
      triggerToast(err.message || 'Error assigning staff', 'error');
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading route details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !routeData) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Route not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const staffRoutes = routeData.StaffRoutes || [];
  const activeAssignments = staffRoutes.filter((sr) => sr.effectiveTo === null);
  const pastAssignments = staffRoutes.filter((sr) => sr.effectiveTo !== null);

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Toast */}
      {toast.visible && (
        <View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ArrowLeft size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Route Details</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => navigation.navigate('AddRoute', { route: routeData })}
            activeOpacity={0.7}
          >
            <Edit size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerActionBtn, { marginLeft: 8 }]}
            onPress={handleDeleteRoute}
            activeOpacity={0.7}
          >
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.routeNameText}>{routeData.name}</Text>
          {routeData.areaCode ? (
            <View style={styles.areaContainer}>
              <Text style={styles.areaLabel}>Area Code:</Text>
              <Text style={styles.areaValue}>{routeData.areaCode}</Text>
            </View>
          ) : null}
        </View>

        {/* Action Button: Assign Staff */}
        <TouchableOpacity
          style={styles.assignBtn}
          activeOpacity={0.8}
          onPress={() => setAssignModalVisible(true)}
        >
          <UserPlus size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.assignBtnText}>Assign Staff Member</Text>
        </TouchableOpacity>

        {/* Active Staff Assignments */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Currently Active Staff ({activeAssignments.length})</Text>
        </View>

        {activeAssignments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>No active staff assigned to this route.</Text>
          </View>
        ) : (
          activeAssignments.map((assignment) => (
            <View key={assignment.id} style={styles.staffCard}>
              <View style={styles.staffInfo}>
                <Text style={styles.staffName}>{assignment.staffUser?.name}</Text>
                <Text style={styles.staffPhone}>{assignment.staffUser?.phone}</Text>
                <View style={styles.dateRow}>
                  <Calendar size={12} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={styles.dateText}>From: {assignment.effectiveFrom}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.endAssignBtn}
                onPress={() => handleEndAssignment(assignment.id, assignment.staffUser?.name)}
                activeOpacity={0.7}
              >
                <Text style={styles.endAssignText}>End</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Past Assignments History */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Assignment History ({pastAssignments.length})</Text>
        </View>

        {pastAssignments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>No past history logs.</Text>
          </View>
        ) : (
          pastAssignments.map((assignment) => (
            <View key={assignment.id} style={[styles.staffCard, styles.historyCard]}>
              <View style={styles.staffInfo}>
                <Text style={styles.staffName}>{assignment.staffUser?.name}</Text>
                <Text style={styles.staffPhone}>{assignment.staffUser?.phone}</Text>
                <View style={styles.dateRow}>
                  <Calendar size={12} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={styles.dateText}>
                    {assignment.effectiveFrom} to {assignment.effectiveTo}
                  </Text>
                </View>
              </View>
              <View style={styles.historyBadge}>
                <Text style={styles.historyBadgeText}>Ended</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Assign Staff Modal Dialog */}
      <Modal
        visible={assignModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setStaffDropdownVisible(false);
            setAssignModalVisible(false);
          }}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Staff Member</Text>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <View style={{ zIndex: 10 }}>
              <Text style={styles.inputLabel}>Select Staff Member *</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                activeOpacity={0.8}
                onPress={() => setStaffDropdownVisible(!staffDropdownVisible)}
              >
                <Text style={selectedStaff ? styles.selectedStaffText : styles.placeholderText}>
                  {selectedStaff ? `${selectedStaff.name} (${selectedStaff.phone})` : 'Choose staff member...'}
                </Text>
                <ChevronRight size={16} color={COLORS.textPlaceholder} style={{ transform: [{ rotate: staffDropdownVisible ? '270deg' : '90deg' }] }} />
              </TouchableOpacity>

              {/* Scrollable dropdown items */}
              {staffDropdownVisible && (
                <View style={styles.dropdownContainer}>
                  <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 180 }}>
                    {allStaff.length === 0 ? (
                      <View style={styles.dropdownEmpty}>
                        <Text style={styles.dropdownEmptyText}>No active staff members found</Text>
                      </View>
                    ) : (
                      allStaff.map((staff) => (
                        <TouchableOpacity
                          key={staff.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedStaff(staff);
                            setStaffDropdownVisible(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{staff.name}</Text>
                          <Text style={styles.dropdownItemPhone}>{staff.phone}</Text>
                          {selectedStaff?.id === staff.id && (
                            <Check size={14} color={COLORS.primary} style={{ marginLeft: 'auto' }} />
                          )}
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Date Inputs */}
            <View style={{ marginTop: 16 }}>
              <Text style={styles.inputLabel}>Effective From *</Text>
              <TouchableOpacity
                style={styles.inputBox}
                onPress={() => setActiveDatePicker('effectiveFrom')}
              >
                <Text style={{ color: COLORS.textPrimary, fontFamily: 'Inter-Medium', fontSize: 14 }}>
                  {effectiveFrom}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Toggle permanent */}
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Permanent Assignment</Text>
              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  style={styles.checkboxOption}
                  onPress={() => setIsPermanent(true)}
                >
                  <Text style={styles.checkboxLabel}>Yes</Text>
                  <View style={[styles.checkboxSquare, isPermanent && styles.checkboxSquareChecked]}>
                    {isPermanent && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.checkboxOption, { marginLeft: 16 }]}
                  onPress={() => setIsPermanent(false)}
                >
                  <Text style={styles.checkboxLabel}>Temporary</Text>
                  <View style={[styles.checkboxSquare, !isPermanent && styles.checkboxSquareChecked]}>
                    {!isPermanent && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Conditional effectiveTo Date */}
            {!isPermanent && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.inputLabel}>Effective To</Text>
                <TouchableOpacity
                  style={styles.inputBox}
                  onPress={() => setActiveDatePicker('effectiveTo')}
                >
                  <Text style={{ color: effectiveTo ? COLORS.textPrimary : COLORS.textPlaceholder, fontFamily: 'Inter-Medium', fontSize: 14 }}>
                    {effectiveTo || 'YYYY-MM-DD (Optional)'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Modal Save CTA */}
            <TouchableOpacity
              style={[styles.modalSaveButton, assignLoading && styles.modalSaveButtonDisabled]}
              onPress={handleAssignStaff}
              disabled={assignLoading}
            >
              {assignLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSaveText}>Assign Staff</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Picker Component */}
      {activeDatePicker && (
        <DateTimePicker
          value={
            activeDatePicker === 'effectiveFrom'
              ? parseDateString(effectiveFrom)
              : parseDateString(effectiveTo)
          }
          mode="date"
          display="default"
          onChange={onDatePickerChange}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 16 : 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  routeNameText: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textPrimary,
  },
  areaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  areaLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
    marginRight: 6,
  },
  areaValue: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.primary,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  assignBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  assignBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontFamily: 'Inter-SemiBold',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textSecondary,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  historyCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textPrimary,
  },
  staffPhone: {
    fontSize: 12.5,
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
  },
  endAssignBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
  },
  endAssignText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  historyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  historyBadgeText: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: 'Inter-Medium',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    fontWeight: '700',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  inputLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
  },
  selectedStaffText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
  },
  placeholderText: {
    color: COLORS.textPlaceholder,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemText: {
    fontSize: 13.5,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  dropdownItemPhone: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  dropdownEmpty: {
    padding: 16,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    color: COLORS.textPlaceholder,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  inputBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  input: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    height: '100%',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  toggleLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginRight: 6,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  checkboxSquare: {
    width: 18,
    height: 18,
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
  modalSaveButton: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  modalSaveButtonDisabled: {
    opacity: 0.7,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
  },
  // Toast
  toast: {
    position: 'absolute',
    top: 16,
    left: 24,
    right: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastError: { backgroundColor: COLORS.danger },
  toastSuccess: { backgroundColor: COLORS.success },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default RouteDetailScreen;
