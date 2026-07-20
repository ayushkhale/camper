import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  Calendar,
  Repeat,
  Package,
  Clock,
  Trash2,
  Plus,
  AlertCircle,
  X,
  User,
  Info,
  Pause,
  Play,
  Settings,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

const SubscriptionDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userToken } = useContext(AuthContext);
  
  const subscriptionId = route.params?.subscriptionId;
  const initialSubscription = route.params?.subscription;

  const [subscription, setSubscription] = useState(initialSubscription || null);
  const [pauses, setPauses] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [timeline, setTimeline] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Modals state
  const [pauseModalVisible, setPauseModalVisible] = useState(false);
  const [exceptionModalVisible, setExceptionModalVisible] = useState(false);

  // Pause form state
  const [pauseFrom, setPauseFrom] = useState('');
  const [pauseTo, setPauseTo] = useState('');
  const [submittingPause, setSubmittingPause] = useState(false);

  // Exception form state
  const [overrideFrom, setOverrideFrom] = useState('');
  const [overrideTo, setOverrideTo] = useState('');
  const [overrideType, setOverrideType] = useState('skip'); // 'skip' | 'extra'
  const [overrideQuantity, setOverrideQuantity] = useState('');
  const [submittingException, setSubmittingException] = useState(false);

  const [activeDatePicker, setActiveDatePicker] = useState(null); // 'pauseFrom' | 'pauseTo' | 'overrideFrom' | 'overrideTo' | null

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
      if (pickerType === 'pauseFrom') setPauseFrom(formatted);
      if (pickerType === 'pauseTo') setPauseTo(formatted);
      if (pickerType === 'overrideFrom') setOverrideFrom(formatted);
      if (pickerType === 'overrideTo') setOverrideTo(formatted);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchSubscriptionData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      // 1. Fetch Subscription details if not fully present
      let subData = subscription;
      if (!subData || !subData.Customer) {
        const subRes = await api.getSubscription(userToken, subscriptionId);
        if (subRes.success) {
          subData = subRes.data;
          setSubscription(subData);
        } else {
          throw new Error(subRes.message || 'Failed to load subscription details');
        }
      }

      // 2. Fetch Pauses and Overrides in parallel
      const [pausesRes, overridesRes] = await Promise.all([
        api.listPauses(userToken, subscriptionId),
        api.listOverrides(userToken, subscriptionId)
      ]);

      let pausesList = [];
      let overridesList = [];

      if (pausesRes.success) {
        pausesList = pausesRes.data || [];
        setPauses(pausesList);
      }
      if (overridesRes.success) {
        overridesList = overridesRes.data || [];
        setOverrides(overridesList);
      }

      // 3. Build unified sorted timeline
      buildTimeline(pausesList, overridesList);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (subscriptionId) {
        fetchSubscriptionData(true);
      } else {
        setError('No subscription selected');
        setLoading(false);
      }
    }, [subscriptionId])
  );

  const buildTimeline = (pausesList, overridesList) => {
    const pauseEvents = pausesList.map(p => ({
      id: p.id,
      type: 'pause',
      label: 'Pause (Vacation)',
      from: p.pauseFrom,
      to: p.pauseTo,
      dateSort: p.pauseFrom,
      raw: p
    }));

    const overrideEvents = overridesList.map(o => ({
      id: o.id,
      type: 'override',
      label: `Override (${o.overrideType === 'skip' ? 'Skip' : 'Quantity Update'})`,
      from: o.overrideFrom,
      to: o.overrideTo || o.overrideFrom,
      overrideType: o.overrideType,
      quantity: o.overrideQuantity,
      dateSort: o.overrideFrom,
      raw: o
    }));

    const combined = [...pauseEvents, ...overrideEvents];
    // Sort descending by date (newest/future events first)
    combined.sort((a, b) => b.dateSort.localeCompare(a.dateSort));
    setTimeline(combined);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSubscriptionData(false);
  };

  // Pause actions
  const handleAddPause = async () => {
    if (!pauseFrom) {
      Alert.alert('Validation Error', 'Start Date (Pause From) is required.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(pauseFrom)) {
      Alert.alert('Validation Error', 'Start Date must be in YYYY-MM-DD format.');
      return;
    }
    if (pauseTo && !/^\d{4}-\d{2}-\d{2}$/.test(pauseTo)) {
      Alert.alert('Validation Error', 'End Date must be in YYYY-MM-DD format.');
      return;
    }

    setSubmittingPause(true);
    try {
      const res = await api.addPause(userToken, subscriptionId, {
        pauseFrom,
        pauseTo: pauseTo || pauseFrom
      });

      if (res.success) {
        Alert.alert('Success', 'Subscription paused successfully.');
        setPauseModalVisible(false);
        // Clear inputs
        setPauseFrom('');
        setPauseTo('');
        fetchSubscriptionData(false);
      } else {
        Alert.alert('Error', res.message || 'Could not pause subscription.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'An error occurred.');
    } finally {
      setSubmittingPause(false);
    }
  };

  // Override actions
  const handleAddOverride = async () => {
    if (!overrideFrom) {
      Alert.alert('Validation Error', 'Start Date is required.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(overrideFrom)) {
      Alert.alert('Validation Error', 'Start Date must be in YYYY-MM-DD format.');
      return;
    }
    if (overrideTo && !/^\d{4}-\d{2}-\d{2}$/.test(overrideTo)) {
      Alert.alert('Validation Error', 'End Date must be in YYYY-MM-DD format.');
      return;
    }
    if (overrideType === 'extra') {
      if (!overrideQuantity || isNaN(overrideQuantity) || parseInt(overrideQuantity) < 0) {
        Alert.alert('Validation Error', 'Please enter a valid override quantity.');
        return;
      }
    }

    setSubmittingException(true);
    try {
      const res = await api.addOverride(userToken, subscriptionId, {
        overrideFrom,
        overrideTo: overrideTo || overrideFrom,
        overrideType,
        overrideQuantity: overrideType === 'extra' ? parseInt(overrideQuantity) : undefined
      });

      if (res.success) {
        Alert.alert('Success', 'Exception added successfully.');
        setExceptionModalVisible(false);
        // Clear inputs
        setOverrideFrom('');
        setOverrideTo('');
        setOverrideType('skip');
        setOverrideQuantity('');
        fetchSubscriptionData(false);
      } else {
        Alert.alert('Error', res.message || 'Could not log exception.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'An error occurred.');
    } finally {
      setSubmittingException(false);
    }
  };

  // Delete Action
  const handleDeleteException = (item) => {
    const isFuture = item.to >= todayStr;
    if (!isFuture) {
      Alert.alert('Invalid Action', 'Cannot delete past exceptions.');
      return;
    }

    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to remove this ${item.type === 'pause' ? 'pause' : 'exception'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              let res;
              if (item.type === 'pause') {
                res = await api.deletePause(userToken, subscriptionId, item.id);
              } else {
                res = await api.deleteOverride(userToken, subscriptionId, item.id);
              }

              if (res.success) {
                Alert.alert('Success', 'Exception removed successfully.');
                fetchSubscriptionData(false);
              } else {
                Alert.alert('Error', res.message || 'Failed to delete.');
              }
            } catch (err) {
              Alert.alert('Error', err.message || 'An error occurred.');
            }
          }
        }
      ]
    );
  };

  const getRecurrenceLabel = (pattern) => {
    switch (pattern) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'alternate': return 'Alternate Days';
      default: return pattern;
    }
  };

  const getExceptionColor = (item) => {
    if (item.type === 'pause') {
      return { bg: COLORS.warningLight, text: COLORS.warning, border: COLORS.warning };
    }
    if (item.overrideType === 'skip') {
      return { bg: COLORS.dangerLight, text: COLORS.danger, border: COLORS.danger };
    }
    return { bg: COLORS.successLight, text: COLORS.success, border: COLORS.success };
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right', 'top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Details</Text>
        <TouchableOpacity
          style={styles.editHeaderButton}
          onPress={() => navigation.navigate('AddSubscription', { subscription })}
        >
          <Settings size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={40} color={COLORS.danger} style={{ marginBottom: 12 }} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchSubscriptionData(true)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Card: Master Details */}
          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <View style={styles.avatarContainer}>
                <User size={24} color={COLORS.primary} />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.customerName}>{subscription.Customer?.name}</Text>
                <Text style={styles.customerPhone}>{subscription.Customer?.phone || 'No phone number'}</Text>
              </View>
              <View style={[styles.statusBadge, {
                backgroundColor: subscription.status === 'active' ? COLORS.successLight : COLORS.dangerLight
              }]}>
                <Text style={{
                  fontSize: 11,
                  fontFamily: 'Poppins-Bold',
                  color: subscription.status === 'active' ? COLORS.success : COLORS.danger
                }}>
                  {subscription.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Product & Qty */}
            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <View style={styles.labelRow}>
                  <Package size={16} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={styles.infoLabel}>Product</Text>
                </View>
                <Text style={styles.infoValue}>{subscription.Product?.name}</Text>
              </View>

              <View style={styles.infoCol}>
                <View style={styles.labelRow}>
                  <Info size={16} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={styles.infoLabel}>Base Quantity</Text>
                </View>
                <Text style={styles.infoValue}>{subscription.baseQuantity} units</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <View style={styles.labelRow}>
                  <Repeat size={16} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={styles.infoLabel}>Recurrence</Text>
                </View>
                <Text style={styles.infoValue}>{getRecurrenceLabel(subscription.recurrencePattern)}</Text>
              </View>

              <View style={styles.infoCol}>
                <View style={styles.labelRow}>
                  <Calendar size={16} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={styles.infoLabel}>Start Date</Text>
                </View>
                <Text style={styles.infoValue}>
                  {subscription.startDate ? subscription.startDate.split('T')[0] : 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Action CTAs */}
          <Text style={styles.sectionTitle}>Manage Deliveries</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.warningLight }]}
              activeOpacity={0.8}
              onPress={() => {
                setPauseFrom(todayStr);
                setPauseTo(todayStr);
                setPauseModalVisible(true);
              }}
            >
              <Pause size={20} color={COLORS.warning} style={{ marginBottom: 6 }} />
              <Text style={[styles.actionBtnText, { color: COLORS.warning }]}>Vacation Mode</Text>
              <Text style={styles.actionBtnSub}>Pause deliveries</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.successLight }]}
              activeOpacity={0.8}
              onPress={() => {
                setOverrideFrom(todayStr);
                setOverrideTo(todayStr);
                setOverrideType('skip');
                setOverrideQuantity('');
                setExceptionModalVisible(true);
              }}
            >
              <Plus size={20} color={COLORS.success} style={{ marginBottom: 6 }} />
              <Text style={[styles.actionBtnText, { color: COLORS.success }]}>Log Exception</Text>
              <Text style={styles.actionBtnSub}>Skip or modify delivery</Text>
            </TouchableOpacity>
          </View>

          {/* Exception History Unified Timeline */}
          <Text style={styles.sectionTitle}>Exceptions & Pauses History</Text>
          <View style={styles.timelineCard}>
            {timeline.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Clock size={32} color={COLORS.textPlaceholder} style={{ marginBottom: 8 }} />
                <Text style={styles.emptyHistoryTitle}>No Exceptions Logged</Text>
                <Text style={styles.emptyHistorySubtitle}>Tapping any action above will create scheduling adjustments.</Text>
              </View>
            ) : (
              timeline.map((item, index) => {
                const color = getExceptionColor(item);
                const isFuture = item.to >= todayStr;
                return (
                  <View key={`${item.type}-${item.id}`} style={styles.timelineItem}>
                    {/* Circle marker */}
                    <View style={styles.timelineLineContainer}>
                      <View style={[styles.timelineMarker, { backgroundColor: color.text }]} />
                      {index !== timeline.length - 1 && <View style={styles.timelineLine} />}
                    </View>

                    {/* Timeline content */}
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineContentHeader}>
                        <View style={[styles.exceptionBadge, { backgroundColor: color.bg, borderColor: color.text }]}>
                          <Text style={[styles.exceptionBadgeText, { color: color.text }]}>
                            {item.label}
                          </Text>
                        </View>
                        {isFuture && (
                          <TouchableOpacity
                            style={styles.deleteIconButton}
                            onPress={() => handleDeleteException(item)}
                          >
                            <Trash2 size={16} color={COLORS.danger} />
                          </TouchableOpacity>
                        )}
                      </View>

                      <Text style={styles.timelineDates}>
                        {item.from === item.to ? item.from : `${item.from} to ${item.to}`}
                      </Text>

                      {item.type === 'override' && item.overrideType === 'extra' && (
                        <Text style={styles.timelineDetails}>
                          Modified Qty: {item.quantity} (Base subscription: {subscription.baseQuantity})
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* Pause Modal */}
      <Modal
        visible={pauseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPauseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pause Subscription</Text>
              <TouchableOpacity onPress={() => setPauseModalVisible(false)}>
                <X size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Suspends all deliveries during the chosen timeframe.</Text>

            <Text style={styles.inputLabel}>Pause From</Text>
            <TouchableOpacity
              style={styles.textInputBtn}
              onPress={() => setActiveDatePicker('pauseFrom')}
            >
              <Text style={[styles.textInputBtnText, !pauseFrom && { color: COLORS.textPlaceholder }]}>
                {pauseFrom || 'Select Date'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Pause To</Text>
            <TouchableOpacity
              style={styles.textInputBtn}
              onPress={() => setActiveDatePicker('pauseTo')}
            >
              <Text style={[styles.textInputBtnText, !pauseTo && { color: COLORS.textPlaceholder }]}>
                {pauseTo || 'Select Date'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleAddPause}
              disabled={submittingPause}
            >
              {submittingPause ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Confirm Pause</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Exception Modal */}
      <Modal
        visible={exceptionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExceptionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Exception / Event</Text>
              <TouchableOpacity onPress={() => setExceptionModalVisible(false)}>
                <X size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Applies a schedule override for specific dates.</Text>

            <Text style={styles.inputLabel}>Start Date</Text>
            <TouchableOpacity
              style={styles.textInputBtn}
              onPress={() => setActiveDatePicker('overrideFrom')}
            >
              <Text style={[styles.textInputBtnText, !overrideFrom && { color: COLORS.textPlaceholder }]}>
                {overrideFrom || 'Select Date'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>End Date (Optional)</Text>
            <TouchableOpacity
              style={styles.textInputBtn}
              onPress={() => setActiveDatePicker('overrideTo')}
            >
              <Text style={[styles.textInputBtnText, !overrideTo && { color: COLORS.textPlaceholder }]}>
                {overrideTo || 'Select End Date (defaults to Start Date)'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Exception Type</Text>
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[styles.typeOption, overrideType === 'skip' && styles.typeOptionActive]}
                onPress={() => setOverrideType('skip')}
              >
                <Text style={[styles.typeOptionText, overrideType === 'skip' && styles.typeOptionTextActive]}>
                  Skip Delivery
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeOption, overrideType === 'extra' && styles.typeOptionActive]}
                onPress={() => setOverrideType('extra')}
              >
                <Text style={[styles.typeOptionText, overrideType === 'extra' && styles.typeOptionTextActive]}>
                  Modify Qty
                </Text>
              </TouchableOpacity>
            </View>

            {overrideType === 'extra' && (
              <View>
                <Text style={styles.inputLabel}>Total Quantity Required</Text>
                <TextInput
                  style={styles.textInput}
                  value={overrideQuantity}
                  onChangeText={setOverrideQuantity}
                  placeholder="e.g. 5"
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.textPlaceholder}
                />
                <Text style={styles.helperText}>
                  Normal quantity is {subscription?.baseQuantity || 0}. Any difference will adjust the generation.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleAddOverride}
              disabled={submittingException}
            >
              {submittingException ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Exception</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {activeDatePicker && (
        <DateTimePicker
          value={
            activeDatePicker === 'pauseFrom' ? parseDateString(pauseFrom) :
            activeDatePicker === 'pauseTo' ? parseDateString(pauseTo) :
            activeDatePicker === 'overrideFrom' ? parseDateString(overrideFrom) :
            parseDateString(overrideTo)
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
  },
  editHeaderButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
  },
  customerPhone: {
    fontSize: 12.5,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoCol: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
    marginLeft: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionBtn: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtnText: {
    fontSize: 13.5,
    fontFamily: 'Poppins-Bold',
  },
  actionBtnSub: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyHistoryTitle: {
    fontSize: 14.5,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  emptyHistorySubtitle: {
    fontSize: 11.5,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLineContainer: {
    alignItems: 'center',
    marginRight: 12,
    width: 14,
  },
  timelineMarker: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineContentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  exceptionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  exceptionBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
  },
  deleteIconButton: {
    padding: 4,
  },
  timelineDates: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
  },
  timelineDetails: {
    fontSize: 11.5,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12.5,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  textInputBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    justifyContent: 'center',
    height: 48,
    backgroundColor: '#FFFFFF',
  },
  textInputBtnText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textPrimary,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  typeOptionActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  typeOptionText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textSecondary,
  },
  typeOptionTextActive: {
    color: COLORS.primary,
    fontFamily: 'Poppins-Bold',
  },
  helperText: {
    fontSize: 11.5,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSecondary,
    marginBottom: 16,
    marginTop: -8,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
  },
});

export default SubscriptionDetailScreen;
