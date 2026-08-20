import React, { useState, useContext, useCallback } from 'react';
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
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import {
  ChevronLeft,
  Trash2,
  Edit,
  User,
  Phone,
  Info,
  Repeat,
  Calendar,
  Package,
  Clock,
  X,
  Plus,
  Play,
  Pause,
  SkipForward,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import CurvedHeader from '../../components/CurvedHeader';

const SubscriptionDetailScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { userToken, user } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const subscriptionId = route.params?.subscriptionId;
  const initialSubscription = route.params?.subscription;

  const [subscription, setSubscription] = useState(initialSubscription || null);
  const [pauses, setPauses] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [timeline, setTimeline] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [pauseModalVisible, setPauseModalVisible] = useState(false);
  const [skipModalVisible, setSkipModalVisible] = useState(false);

  const [pauseFrom, setPauseFrom] = useState('');
  const [pauseTo, setPauseTo] = useState('');
  const [submittingPause, setSubmittingPause] = useState(false);

  const [overrideFrom, setOverrideFrom] = useState('');
  const [overrideTo, setOverrideTo] = useState('');
  const [overrideType, setOverrideType] = useState('skip');
  const [overrideQuantity, setOverrideQuantity] = useState('');
  const [submittingException, setSubmittingException] = useState(false);

  const [activeDatePicker, setActiveDatePicker] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

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
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return new Date();
  };

  const formatDisplayDate = (str) => {
    if (!str) return '—';
    const [y, m, d] = str.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d} ${months[parseInt(m) - 1]} ${y}`;
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

  const fetchSubscriptionData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      let subData = subscription;
      if (!subData || !subData.Customer) {
        const subRes = await api.getSubscription(userToken, subscriptionId);
        if (subRes.success) {
          subData = subRes.data;
          setSubscription(subData);
        } else {
          throw new Error(subRes.message || 'Failed to load subscription');
        }
      }

      const [pausesRes, overridesRes] = await Promise.all([
        api.listPauses(userToken, subscriptionId),
        api.listOverrides(userToken, subscriptionId),
      ]);

      let pausesList = [];
      let overridesList = [];

      if (pausesRes.success) { pausesList = pausesRes.data || []; setPauses(pausesList); }
      if (overridesRes.success) { overridesList = overridesRes.data || []; setOverrides(overridesList); }

      buildTimeline(pausesList, overridesList);
    } catch (err) {
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
      id: p.id, type: 'pause',
      from: p.pauseFrom, to: p.pauseTo,
      dateSort: p.pauseFrom, raw: p,
    }));
    const overrideEvents = overridesList.map(o => ({
      id: o.id, type: 'override',
      from: o.overrideFrom, to: o.overrideTo || o.overrideFrom,
      overrideType: o.overrideType, quantity: o.overrideQuantity,
      dateSort: o.overrideFrom, raw: o,
    }));
    const combined = [...pauseEvents, ...overrideEvents];
    combined.sort((a, b) => b.dateSort.localeCompare(a.dateSort));
    setTimeline(combined);
  };

  const handleRefresh = () => { setRefreshing(true); fetchSubscriptionData(false); };

  const handleAddPause = async () => {
    if (!pauseFrom) { showAlert('Required', 'Please select a start date.', 'warning'); return; }
    setSubmittingPause(true);
    try {
      const res = await api.addPause(userToken, subscriptionId, {
        pauseFrom,
        pauseTo: pauseTo || pauseFrom,
      });
      if (res.success) {
        showAlert('Success', 'Subscription paused successfully', 'success');
        setPauseModalVisible(false);
        setPauseFrom(''); setPauseTo('');
        fetchSubscriptionData(false);
      } else {
        showAlert('Error', res.message || 'Could not pause subscription.', 'error');
      }
    } catch (err) {
      showAlert('Error', err.message || 'An error occurred.', 'error');
    } finally {
      setSubmittingPause(false);
    }
  };

  const handleAddOverride = async () => {
    if (!overrideFrom) { showAlert('Required', 'Please select a start date.', 'warning'); return; }
    if (overrideType === 'extra' && (!overrideQuantity || isNaN(overrideQuantity))) {
      showAlert('Required', 'Enter a valid quantity.', 'warning');
      return;
    }
    setSubmittingException(true);
    try {
      const res = await api.addOverride(userToken, subscriptionId, {
        overrideFrom,
        overrideTo: overrideTo || overrideFrom,
        overrideType,
        overrideQuantity: overrideType === 'extra' ? parseInt(overrideQuantity) : undefined,
      });
      if (res.success) {
        showAlert('Success', 'Subscription exception saved successfully', 'success');
        setSkipModalVisible(false);
        setOverrideFrom(''); setOverrideTo('');
        setOverrideType('skip'); setOverrideQuantity('');
        fetchSubscriptionData(false);
      } else {
        showAlert('Error', res.message || 'Could not log exception.', 'error');
      }
    } catch (err) {
      showAlert('Error', err.message || 'An error occurred.', 'error');
    } finally {
      setSubmittingException(false);
    }
  };

  const handleDeleteException = (item) => {
    const isFuture = item.to >= todayStr;
    if (!isFuture) { showAlert('Cannot Delete', 'Past entries cannot be removed.', 'warning'); return; }
    showAlert(
      'Remove Entry',
      `Remove this ${item.type === 'pause' ? 'pause' : 'exception'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            try {
              const res = item.type === 'pause'
                ? await api.deletePause(userToken, subscriptionId, item.id)
                : await api.deleteOverride(userToken, subscriptionId, item.id);
              if (res.success) {
                showAlert('Success', 'Entry removed successfully', 'success');
                fetchSubscriptionData(false);
              } else {
                showAlert('Error', res.message || 'Failed to delete.', 'error');
              }
            } catch (err) {
              showAlert('Error', err.message, 'error');
            }
          },
        },
      ]
    );
  };

  const handleDeleteSubscription = () => {
    showAlert(
      'Delete Subscription',
      'Are you sure you want to delete this subscription?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.deleteSubscription(userToken, subscriptionId);
              if (res.success) {
                showAlert('Success', 'Subscription deleted successfully', 'success');
                navigation.goBack();
              } else {
                throw new Error(res.message || 'Failed to delete subscription');
              }
            } catch (err) {
              showAlert('Error', err.message || 'Could not delete subscription', 'error');
            }
          },
        },
      ]
    );
  };

  const getRecurrenceLabel = (pattern) => {
    switch (pattern) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'alternate': case 'alternate_days': return 'Alternate Days';
      default: return pattern || '—';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !subscription) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Subscription not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isActive = subscription.status === 'active';
  const isPaused = subscription.status === 'paused';

  return (
    <View style={styles.container}>
      <CurvedHeader
        title={
          <Text 
            numberOfLines={1} 
            adjustsFontSizeToFit 
            style={{ color: '#FFF', fontSize: 20, fontFamily: 'Geologica-Bold', flexShrink: 1 }}
          >
            {t('subscriptions.details', 'Subscription Details')}
          </Text>
        }
        leftIcon={<ChevronLeft size={28} color="#FFF" />}
        onLeftPress={() => navigation.goBack()}
        rightIcon={user?.role !== 'staff' ? (
          <View style={{ flexDirection: 'row', gap: 12, marginRight: 16 }}>
            <TouchableOpacity
              style={styles.headerActionBtnDark}
              onPress={() => navigation.navigate('AddSubscription', { subscription })}
            >
              <Edit size={18} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerActionBtnDark, { backgroundColor: 'rgba(229, 62, 62, 0.2)' }]}
              onPress={handleDeleteSubscription}
            >
              <Trash2 size={18} color="#FFD1D1" />
            </TouchableOpacity>
          </View>
        ) : null}
        height={130}
        contentStyle={{ paddingTop: Platform.OS === 'ios' ? 40 : 20, paddingBottom: 25 }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ── Profile Hero Section ── */}
        <View style={styles.profileHero}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarFallback}>
              <Package size={38} color={COLORS.primary} />
            </View>
          </View>
          <Text style={styles.productName}>{subscription.Product?.name || 'Subscription'}</Text>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: isActive ? '#16A34A' : isPaused ? '#D97706' : '#94A3B8' }]} />
            <Text style={[styles.statusText, { color: isActive ? '#15803D' : isPaused ? '#B45309' : '#64748B' }]}>
              {(subscription.status || 'ACTIVE').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* ── Subscription Details Card ── */}
        <Text style={styles.sectionTitle}>{t('subscriptions.edit')}</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <User size={18} color={COLORS.textSecondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('customers.name')}</Text>
              <Text style={styles.detailValue}>{subscription.Customer?.name || '—'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Phone size={18} color={COLORS.textSecondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('customers.phone_label')}</Text>
              <Text style={styles.detailValue}>{subscription.Customer?.phone || '—'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Info size={18} color={COLORS.textSecondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('subscriptions.quantityPerDelivery')}</Text>
              <Text style={styles.detailValue}>
                {subscription.baseQuantity} {subscription.baseQuantity === 1 ? 'unit' : 'units'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Repeat size={18} color={COLORS.textSecondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('subscriptions.frequency')}</Text>
              <Text style={styles.detailValue}>{getRecurrenceLabel(subscription.recurrencePattern)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={[styles.detailIconBox, { backgroundColor: COLORS.primaryLight, borderColor: COLORS.border }]}>
              <Calendar size={18} color={COLORS.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('subscriptions.startDate')}</Text>
              <Text style={styles.detailValue}>
                {subscription.startDate ? formatDisplayDate(subscription.startDate.split('T')[0]) : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Schedule Exceptions Log ── */}
        <Text style={styles.sectionTitle}>{t('subscriptions.scheduleLog')}</Text>
        <View style={styles.detailsCard}>
          {timeline.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Clock size={20} color={COLORS.textPlaceholder} style={{ marginRight: 8 }} />
              <Text style={styles.emptyHistoryText}>{t('subscriptions.noExceptionsLogged')}</Text>
            </View>
          ) : (
            timeline.map((item, index) => {
              const isFuture = item.to >= todayStr;
              const isPauseType = item.type === 'pause';
              const isSkipType = item.type === 'override' && item.overrideType === 'skip';

              const badgeBg = isPauseType ? COLORS.warningLight : isSkipType ? COLORS.dangerLight : COLORS.successLight;
              const badgeText = isPauseType ? COLORS.warning : isSkipType ? COLORS.danger : COLORS.success;
              const label = isPauseType ? 'Pause' : isSkipType ? 'Skip' : `Extra (+${item.quantity})`;
              const dateRange = item.from === item.to
                ? formatDisplayDate(item.from)
                : `${formatDisplayDate(item.from)} → ${formatDisplayDate(item.to)}`;

              return (
                <View key={`${item.type}-${item.id}`}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.logRow}>
                    <View style={[styles.logBadge, { backgroundColor: badgeBg, borderColor: badgeText }]}>
                      <Text style={[styles.logBadgeText, { color: badgeText }]}>{label}</Text>
                    </View>
                    <Text style={styles.logDates}>{dateRange}</Text>
                    {isFuture && user?.role !== 'staff' && (
                      <TouchableOpacity
                        onPress={() => handleDeleteException(item)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        activeOpacity={0.6}
                      >
                        <Trash2 size={16} color={COLORS.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Metadata Section */}
        <View style={styles.metadataSection}>
          <Text style={styles.metadataLabel}>Last Modified By</Text>
          <View style={styles.metadataUserRow}>
            <User size={14} color="#64748B" />
            <Text style={styles.metadataValue}>
              {subscription.updatedBy?.name || 'System'} ({subscription.updatedBy?.role || 'admin'})
            </Text>
          </View>
          {subscription.updatedAt && (
            <Text style={styles.metadataTime}>
              {new Date(subscription.updatedAt).toLocaleString()}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* ── Simple Pill Bottom Action Buttons ── */}
      <View style={styles.floatingBar}>
        <TouchableOpacity
          style={styles.pausePillBtn}
          activeOpacity={0.8}
          onPress={() => { setPauseFrom(todayStr); setPauseTo(todayStr); setPauseModalVisible(true); }}
        >
          <Pause size={16} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
          <Text style={styles.pausePillText}>Pause</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editQtyPillBtn}
          activeOpacity={0.8}
          onPress={() => { setOverrideFrom(todayStr); setOverrideTo(todayStr); setOverrideType('extra'); setOverrideQuantity(''); setSkipModalVisible(true); }}
        >
          <Package size={16} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
          <Text style={styles.editQtyPillText}>Edit Quantity</Text>
        </TouchableOpacity>
      </View>

      {/* Pause Modal */}
      <Modal visible={pauseModalVisible} transparent animationType="fade" onRequestClose={() => setPauseModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPauseModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pause Subscription</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setPauseModalVisible(false)}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Pause From</Text>
            <TouchableOpacity style={styles.dateSelector} onPress={() => setActiveDatePicker('pauseFrom')}>
              <Calendar size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
              <Text style={styles.dateSelectorText}>{pauseFrom ? formatDisplayDate(pauseFrom) : 'Select Date'}</Text>
            </TouchableOpacity>

            <Text style={[styles.modalLabel, { marginTop: 12 }]}>Pause To</Text>
            <TouchableOpacity style={styles.dateSelector} onPress={() => setActiveDatePicker('pauseTo')}>
              <Calendar size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
              <Text style={styles.dateSelectorText}>{pauseTo ? formatDisplayDate(pauseTo) : 'Select End Date (optional)'}</Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setPauseModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmPauseBtn]}
                onPress={handleAddPause}
                disabled={submittingPause}
              >
                {submittingPause ? (
                  <ActivityIndicator size="small" color={COLORS.background} />
                ) : (
                  <Text style={styles.confirmPauseBtnText}>Confirm Pause</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Skip / Change Qty Modal */}
      <Modal visible={skipModalVisible} transparent animationType="fade" onRequestClose={() => setSkipModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSkipModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Exception</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setSkipModalVisible(false)}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[styles.typeOption, overrideType === 'skip' && styles.typeOptionActive]}
                onPress={() => setOverrideType('skip')}
              >
                <Text style={[styles.typeOptionText, overrideType === 'skip' && styles.typeOptionTextActive]}>Skip Delivery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeOption, overrideType === 'extra' && styles.typeOptionActive]}
                onPress={() => setOverrideType('extra')}
              >
                <Text style={[styles.typeOptionText, overrideType === 'extra' && styles.typeOptionTextActive]}>Change Qty</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { marginTop: 12 }]}>From Date</Text>
            <TouchableOpacity style={styles.dateSelector} onPress={() => setActiveDatePicker('overrideFrom')}>
              <Calendar size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
              <Text style={styles.dateSelectorText}>{overrideFrom ? formatDisplayDate(overrideFrom) : 'Select Date'}</Text>
            </TouchableOpacity>

            <Text style={[styles.modalLabel, { marginTop: 12 }]}>To Date</Text>
            <TouchableOpacity style={styles.dateSelector} onPress={() => setActiveDatePicker('overrideTo')}>
              <Calendar size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
              <Text style={styles.dateSelectorText}>{overrideTo ? formatDisplayDate(overrideTo) : 'Select End Date (optional)'}</Text>
            </TouchableOpacity>

            {overrideType === 'extra' && (
              <>
                <Text style={[styles.modalLabel, { marginTop: 12 }]}>
                  New Quantity (Base: {subscription?.baseQuantity || 0})
                </Text>
                <TextInput
                  style={styles.reasonInput}
                  value={overrideQuantity}
                  onChangeText={setOverrideQuantity}
                  placeholder="e.g. 5"
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.textPlaceholder}
                />
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setSkipModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={handleAddOverride}
                disabled={submittingException}
              >
                {submittingException ? (
                  <ActivityIndicator size="small" color={COLORS.background} />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
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
          minimumDate={user?.role === 'staff' ? new Date() : undefined}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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

  // Header Actions (matches Customer Detail layout exactly)
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionBtn: {
    marginLeft: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    borderRadius: 14,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120, // space for floating bottom bar
  },

  // Profile Hero (matches Customer Detail layout exactly)
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
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    fontSize: 20,
    fontFamily: 'Geologica-SemiBold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Geologica-SemiBold',
  },

  // Section details card
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Geologica-SemiBold',
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  detailsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Geologica-SemiBold',
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },

  // Schedule exceptions log rows
  emptyHistory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: 'Geologica-Medium',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  logBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 12,
    borderWidth: 1,
  },
  logBadgeText: {
    fontSize: 11,
    fontFamily: 'Geologica-Medium',
  },
  logDates: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPrimary,
  },

  // Pill style floating bottom buttons
  floatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 80 : 85,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  pausePillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    height: 46,
  },
  pausePillText: {
    fontSize: 14,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
  },
  editQtyPillBtn: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    height: 46,
  },
  editQtyPillText: {
    fontSize: 14,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },
  modalClose: {
    padding: 5,
  },
  modalLabel: {
    fontSize: 14,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.surface,
    marginBottom: 8,
  },
  dateSelectorText: {
    fontSize: 14,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPrimary,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
  },
  cancelBtn: {
    backgroundColor: COLORS.borderLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textSecondary,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
  },
  confirmBtnText: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: COLORS.background,
  },
  confirmPauseBtn: {
    backgroundColor: COLORS.warning,
  },
  confirmPauseBtnText: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: COLORS.background,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.borderLight,
  },
  typeOptionActive: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primary,
  },
  typeOptionText: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
  },
  typeOptionTextActive: {
    color: COLORS.primary,
    fontFamily: 'Geologica-Bold',
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
    fontFamily: 'Geologica-Bold',
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
    fontFamily: 'Geologica-Medium',
    color: '#334155',
    marginLeft: 6,
  },
  metadataTime: {
    fontSize: 11,
    fontFamily: 'Geologica-Regular',
    color: '#94A3B8',
  },
});

export default SubscriptionDetailScreen;
