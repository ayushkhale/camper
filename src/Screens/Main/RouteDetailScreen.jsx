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
import { LinearGradient } from 'react-native-linear-gradient';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  Trash2,
  Edit,
  User,
  UserPlus,
  Calendar,
  X,
  UserCheck,
  History,
  Check,
  ChevronRight,
  ListOrdered,
  MapPin,
  Map,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import CurvedHeader from '../../components/CurvedHeader';
import { useTranslation } from 'react-i18next';

const RouteDetailScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const routeParams = useRoute();
  const { userToken, user } = useContext(AuthContext);
  const routeId = routeParams?.params?.routeId || routeParams?.params?.route?.id || routeParams?.params?.id;
  const { showAlert } = useAlert();

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
        if (user?.role !== 'staff') {
          fetchAllStaff();
        }
      }
    }, [routeId, user])
  );

  const handleDeleteRoute = () => {
    showAlert(
      t('routes.deleteRoute'),
      t('routes.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.deleteRoute(userToken, routeId);
              if (res.success) {
                showAlert('Success', 'Route deleted successfully', 'success');
                navigation.goBack();
              } else {
                throw new Error(res.message || 'Failed to delete route');
              }
            } catch (err) {
              showAlert('Error', err.message || 'Could not delete route', 'error');
            }
          },
        },
      ]
    );
  };

  const handleEndAssignment = (staffRouteId, staffName) => {
    showAlert(
      t('routes.endAssignment'),
      t('routes.endAssignmentConfirm', { name: staffName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.endStaffAssignment(userToken, routeId, staffRouteId);
              if (res.success) {
                showAlert('Success', 'Staff assignment ended successfully', 'success');
                fetchRouteDetail();
              } else {
                throw new Error(res.message || 'Failed to end assignment');
              }
            } catch (err) {
              showAlert('Error', err.message || 'Could not end assignment', 'error');
            }
          },
        },
      ]
    );
  };

  const handleAssignStaff = async () => {
    if (!selectedStaff) {
      showAlert('Required', 'Please select a staff member', 'warning');
      return;
    }

    if (!effectiveFrom.trim()) {
      showAlert('Required', 'Start date is required (YYYY-MM-DD)', 'warning');
      return;
    }

    // Basic date format validation YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(effectiveFrom)) {
      showAlert('Required', 'Start date must be in YYYY-MM-DD format', 'warning');
      return;
    }

    if (!isPermanent && effectiveTo.trim() && !dateRegex.test(effectiveTo)) {
      showAlert('Required', 'End date must be in YYYY-MM-DD format', 'warning');
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
        showAlert('Success', 'Staff assigned to route successfully', 'success');
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
      showAlert('Error', err.message || 'Error assigning staff', 'error');
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('routeDetail.loadingRouteDetails')}</Text>
      </SafeAreaView>
    );
  }

  if (error || !routeData) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || t('routes.noRoutesFound')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>{t('common.goBack')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const staffRoutes = routeData.StaffRoutes || [];
  const activeAssignments = staffRoutes.filter((sr) => sr.effectiveTo === null);
  const pastAssignments = staffRoutes.filter((sr) => sr.effectiveTo !== null);

  return (
    <View style={styles.container}>
      <CurvedHeader
        title={t('routes.routeDetails')}
        leftIcon={<ArrowLeft size={24} color="#0B409C" />}
        onLeftPress={() => navigation.goBack()}
        rightIcon={
          user?.role !== 'staff' ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[styles.headerActionBtnDark, { backgroundColor: '#E0E7FF' }]}
                onPress={() => navigation.navigate('AddRoute', { route: routeData })}
                activeOpacity={0.7}
              >
                <Edit size={18} color="#0B409C" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerActionBtnDark, { backgroundColor: '#FEE2E2' }]}
                onPress={handleDeleteRoute}
                activeOpacity={0.7}
              >
                <Trash2 size={18} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ) : null
        }
        height={120}
        contentStyle={{ paddingTop: 10, paddingBottom: 25 }}
      />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 32 }]} showsVerticalScrollIndicator={false}>
        {/* Route Info Card (Premium Gradient) */}
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.premiumRouteCard}
        >
          {/* Decorative Background Icon */}
          <View style={{ position: 'absolute', right: -15, bottom: -25, opacity: 0.15, transform: [{ rotate: '-15deg' }] }}>
            <MapPin size={120} color="#FFFFFF" />
          </View>
          
          <View style={styles.premiumRouteIconBox}>
            <MapPin size={26} color="#FFFFFF" />
          </View>
          <View style={styles.premiumRouteInfo}>
            <Text style={styles.premiumRouteName} numberOfLines={1}>{routeData.name}</Text>
            {routeData.areaCode ? (
              <View style={styles.premiumRouteBadge}>
                <Text style={styles.premiumRouteBadgeText} numberOfLines={1}>{t('routes.areaCode')}: {routeData.areaCode}</Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>

        {/* Action Button: Assign Staff */}
        {user?.role !== 'staff' && (
          <TouchableOpacity
            style={styles.assignBtn}
            activeOpacity={0.8}
            onPress={() => setAssignModalVisible(true)}
          >
            <UserPlus size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.assignBtnText}>{t('routes.assignStaff')}</Text>
          </TouchableOpacity>
        )}

        {user?.role !== 'staff' && (
          <>
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
                  <View style={[styles.staffIconBox, { backgroundColor: '#E0E7FF' }]}>
                    <User size={20} color="#4F46E5" />
                  </View>
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
                  <View style={[styles.staffIconBox, { backgroundColor: '#F1F5F9' }]}>
                    <History size={20} color="#64748B" />
                  </View>
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
          </>
        )}
        
        {/* Metadata Section */}
        <View style={styles.metadataSection}>
          <Text style={styles.metadataLabel}>Last Modified By</Text>
          <View style={styles.metadataUserRow}>
            <User size={14} color="#64748B" />
            <Text style={styles.metadataValue}>
              {routeData.updatedBy?.name || 'System'} ({routeData.updatedBy?.role || 'admin'})
            </Text>
          </View>
          {routeData.updatedAt && (
            <Text style={styles.metadataTime}>
              {new Date(routeData.updatedAt).toLocaleString()}
            </Text>
          )}
        </View>
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
        <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('routes.assignStaff')}</Text>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <View style={{ zIndex: 10 }}>
              <Text style={styles.inputLabel}>{t('routes.selectStaffMember')}</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                activeOpacity={0.8}
                onPress={() => setStaffDropdownVisible(!staffDropdownVisible)}
              >
                <Text style={selectedStaff ? styles.selectedStaffText : styles.placeholderText}>
                  {selectedStaff ? `${selectedStaff.name} (${selectedStaff.phone})` : t('routes.chooseStaffMember')}
                </Text>
                <ChevronRight size={16} color={COLORS.textPlaceholder} style={{ transform: [{ rotate: staffDropdownVisible ? '270deg' : '90deg' }] }} />
              </TouchableOpacity>

              {/* Scrollable dropdown items */}
              {staffDropdownVisible && (
                <View style={styles.dropdownContainer}>
                  <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 180 }}>
                    {allStaff.length === 0 ? (
                      <View style={styles.dropdownEmpty}>
                        <Text style={styles.dropdownEmptyText}>{t('routes.noActiveStaffMembers')}</Text>
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
              <Text style={styles.inputLabel}>{t('routes.effectiveFrom')}</Text>
              <TouchableOpacity
                style={styles.inputBox}
                onPress={() => setActiveDatePicker('effectiveFrom')}
              >
                <Text style={{ color: COLORS.textPrimary, fontFamily: 'Rubik-SemiBold', fontSize: 14 }}>
                  {effectiveFrom}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Toggle permanent */}
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>{t('routes.permanentAssignment')}</Text>
              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  style={styles.checkboxOption}
                  onPress={() => setIsPermanent(true)}
                >
                  <Text style={styles.checkboxLabel}>{t('common.yes')}</Text>
                  <View style={[styles.checkboxSquare, isPermanent && styles.checkboxSquareChecked]}>
                    {isPermanent && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.checkboxOption, { marginLeft: 16 }]}
                  onPress={() => setIsPermanent(false)}
                >
                  <Text style={styles.checkboxLabel}>{t('routes.temporary')}</Text>
                  <View style={[styles.checkboxSquare, !isPermanent && styles.checkboxSquareChecked]}>
                    {!isPermanent && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Conditional effectiveTo Date */}
            {!isPermanent && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.inputLabel}>{t('routes.effectiveTo')}</Text>
                <TouchableOpacity
                  style={styles.inputBox}
                  onPress={() => setActiveDatePicker('effectiveTo')}
                >
                  <Text style={{ color: effectiveTo ? COLORS.textPrimary : COLORS.textPlaceholder, fontFamily: 'Rubik-SemiBold', fontSize: 14 }}>
                    {effectiveTo || t('common.dateOptional')}
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
                <Text style={styles.modalSaveText}>{t('routes.assignStaffBtn')}</Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
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
    </View>
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
    fontFamily: 'Rubik-Bold',
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
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionBtnDark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 120,
  },
  premiumRouteCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  premiumRouteIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  premiumRouteInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  premiumRouteName: {
    fontSize: 22,
    fontFamily: 'Rubik-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  premiumRouteBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  premiumRouteBadgeText: {
    fontSize: 12,
    fontFamily: 'Rubik-Medium',
    color: '#FFFFFF',
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
    fontFamily: 'Rubik-Bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textSecondary,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  historyCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  staffIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
  },
  staffPhone: {
    fontSize: 12.5,
    fontFamily: 'Rubik-SemiBold',
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
    fontFamily: 'Rubik-SemiBold',
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
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-SemiBold',
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
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Rubik-SemiBold',
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
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-Bold',
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  inputLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontFamily: 'Rubik-SemiBold',
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
    fontFamily: 'Rubik-SemiBold',
    fontWeight: '600',
  },
  placeholderText: {
    color: COLORS.textPlaceholder,
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
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
    fontFamily: 'Rubik-Bold',
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  dropdownItemPhone: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    fontFamily: 'Rubik-Medium',
  },
  dropdownEmpty: {
    padding: 16,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    color: COLORS.textPlaceholder,
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
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
    fontFamily: 'Rubik-SemiBold',
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
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-SemiBold',
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
    fontFamily: 'Rubik-Bold',
    fontWeight: '600',
  },
  metadataSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metadataLabel: {
    fontSize: 12,
    fontFamily: 'Rubik-Bold',
    color: '#64748B',
    marginBottom: 8,
  },
  metadataUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 13,
    fontFamily: 'Rubik-SemiBold',
    color: '#334155',
    marginLeft: 6,
  },
  metadataTime: {
    fontSize: 11,
    fontFamily: 'Rubik-Medium',
    color: '#94A3B8',
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
    fontFamily: 'Rubik-SemiBold',
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default RouteDetailScreen;
