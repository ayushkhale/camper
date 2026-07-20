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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Route Details</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => navigation.navigate('AddRoute', { route: routeData })}
          >
            <Edit size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerActionBtn, { marginLeft: 12 }]}
            onPress={handleDeleteRoute}
          >
            <Trash2 size={18} color={COLORS.primary} />
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
          <UserPlus size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.assignBtnText}>Assign Staff Member</Text>
        </TouchableOpacity>

        {/* Active Staff Assignments */}
        <View style={styles.sectionHeader}>
          <UserCheck size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
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
                  <Calendar size={12} color={COLORS.textPlaceholder} style={{ marginRight: 4 }} />
                  <Text style={styles.dateText}>From: {assignment.effectiveFrom}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.endAssignBtn}
                onPress={() => handleEndAssignment(assignment.id, assignment.staffUser?.name)}
              >
                <Text style={styles.endAssignText}>End</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Past Assignments History */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <History size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
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
                  <Calendar size={12} color={COLORS.textPlaceholder} style={{ marginRight: 4 }} />
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
                <X size={20} color={COLORS.textPlaceholder} />
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
                <Text style={{ color: COLORS.textPrimary, fontFamily: 'Poppins-Medium', fontSize: 14 }}>
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
                    {isPermanent && <Check size={12} color={COLORS.primary} strokeWidth={3} />}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.checkboxOption, { marginLeft: 16 }]}
                  onPress={() => setIsPermanent(false)}
                >
                  <Text style={styles.checkboxLabel}>Temporary</Text>
                  <View style={[styles.checkboxSquare, !isPermanent && styles.checkboxSquareChecked]}>
                    {!isPermanent && <Check size={12} color={COLORS.primary} strokeWidth={3} />}
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
                  <Text style={{ color: effectiveTo ? COLORS.textPrimary : COLORS.textPlaceholder, fontFamily: 'Poppins-Medium', fontSize: 14 }}>
                    {effectiveTo || 'Select End Date'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.modalSaveButton, assignLoading && styles.modalSaveButtonDisabled]}
              activeOpacity={0.85}
              onPress={handleAssignStaff}
              disabled={assignLoading}
            >
              {assignLoading ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <Text style={styles.modalSaveText}>Confirm Assignment</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {activeDatePicker && (
        <DateTimePicker
          value={
            activeDatePicker === 'effectiveFrom' ? parseDateString(effectiveFrom) :
            parseDateString(effectiveTo)
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
    backgroundColor: COLORS.background,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: COLORS.primaryLight,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    marginBottom: 16,
  },
  routeNameText: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
  },
  areaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  areaLabel: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textPlaceholder,
    marginRight: 6,
  },
  areaValue: {
    fontSize: 13.5,
    fontFamily: 'Poppins-Bold',
    color: COLORS.primary,
  },
  assignBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  assignBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontFamily: 'Poppins-Bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
  },
  emptyCard: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textPlaceholder,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  historyCard: {
    backgroundColor: COLORS.primaryLight,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 14.5,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
  },
  staffPhone: {
    fontSize: 12.5,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textPlaceholder,
    marginTop: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  dateText: {
    fontSize: 11.5,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textPlaceholder,
  },
  endAssignBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
  },
  endAssignText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
  },
  historyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: COLORS.textPlaceholder,
    borderRadius: 12,
  },
  historyBadgeText: {
    color: COLORS.textPlaceholder,
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: COLORS.surface,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textPlaceholder,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    padding: 20,
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
  inputLabel: {
    fontSize: 12,
    color: COLORS.textPlaceholder,
    marginBottom: 6,
    fontFamily: 'Poppins-Medium',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    borderRadius: 16,
    height: 48,
    paddingHorizontal: 12,
  },
  selectedStaffText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  placeholderText: {
    color: COLORS.textPlaceholder,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  dropdownContainer: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    borderRadius: 16,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
  },
  dropdownItemText: {
    fontSize: 13.5,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  dropdownItemPhone: {
    fontSize: 12.5,
    color: COLORS.textPlaceholder,
    fontFamily: 'Poppins-Regular',
  },
  dropdownEmpty: {
    padding: 16,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    color: COLORS.textPlaceholder,
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
  },
  inputBox: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    borderRadius: 16,
    height: 48,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  input: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
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
    fontFamily: 'Poppins-Bold',
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
    color: COLORS.textPlaceholder,
    marginRight: 6,
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
  modalSaveButton: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  modalSaveButtonDisabled: {
    opacity: 0.7,
  },
  modalSaveText: {
    color: COLORS.textPrimary,
    fontSize: 14.5,
    fontFamily: 'Poppins-Bold',
  },
  // Toast
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

export default RouteDetailScreen;
