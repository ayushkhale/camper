import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Calendar as CalendarIcon,
  Search,
  Filter,
  MapPin,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Package,
  Truck,
  Phone,
  CheckCircle2,
  Clock,
  Eye,
  X,
  Check,
  CheckSquare,
  Edit2,
  ChevronUp,
  Save,
  ArrowLeft
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { api } from '../../services/api';
import CurvedHeader from '../../components/CurvedHeader';
import DeliveryStatusSlider from '../../components/DeliveryStatusSlider';
import { TextInput } from 'react-native';

const DeliveryCard = ({ delivery, index, onUpdateStatus, getStatusColor, isViewOnly }) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedEditStatus, setSelectedEditStatus] = useState(delivery.status || 'pending');

  useEffect(() => {
    setSelectedEditStatus(delivery.status || 'pending');
  }, [delivery.status]);

  const expectedTotal = (delivery.expectedSubscriptionUnits || 0) + (delivery.expectedAddonUnits || 0);

  let defaultFull;
  if (isViewOnly && delivery.status === 'pending') {
    defaultFull = '0';
  } else if (delivery.status === 'pending' && (!delivery.fullUnitsDelivered || delivery.fullUnitsDelivered === 0)) {
    defaultFull = (expectedTotal > 0 ? expectedTotal.toString() : (delivery.Subscription?.baseQuantity?.toString() || '0'));
  } else {
    defaultFull = (delivery.fullUnitsDelivered?.toString() || '0');
  }

  let defaultEmpty;
  if (isViewOnly && delivery.status === 'pending') {
    defaultEmpty = '0';
  } else if (delivery.status === 'pending' && (!delivery.emptyUnitsCollected || delivery.emptyUnitsCollected === 0)) {
    defaultEmpty = (delivery.expectedEmptyCollections?.toString() || '0');
  } else {
    defaultEmpty = (delivery.emptyUnitsCollected?.toString() || '0');
  }

  const [fullUnits, setFullUnits] = useState(defaultFull);
  const [emptyUnits, setEmptyUnits] = useState(defaultEmpty);
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async (status, full, empty) => {
    setUpdating(true);
    await onUpdateStatus(delivery.id, {
      status,
      fullUnitsDelivered: parseInt(full) || 0,
      emptyUnitsCollected: parseInt(empty) || 0,
    });
    setUpdating(false);
    setIsEditing(false);
    if (status !== 'pending') {
      setIsExpanded(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    setSelectedEditStatus(newStatus);
    handleUpdate(newStatus, fullUnits, emptyUnits);
  };

  return (
    <View style={[styles.deliveryCardWrapperOptionC, isExpanded && styles.deliveryCardExpandedOptionC, { borderLeftWidth: 4, borderLeftColor: getStatusColor ? (getStatusColor(delivery.status)?.dot || getStatusColor(delivery.status)) : '#EAB308', borderStyle: 'solid' }]}>
      {updating && isExpanded && (
        <View style={styles.cardUpdatingOverlay}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}

      <TouchableOpacity
        style={styles.cardHeaderOptionC}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.iconBoxOptionC}>
          <Text style={styles.iconBoxTextOptionC}>{index}</Text>
        </View>
        <View style={styles.titleContainerOptionC}>
          <Text style={styles.customerNameOptionC} numberOfLines={1}>
            {delivery.Customer?.name || 'Unknown Customer'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Package size={12} color="#64748B" style={{ marginRight: 4 }} />
            <Text style={styles.subTextOptionC} numberOfLines={1}>
              {delivery.Subscription?.Product?.name || 'Water Camper 20Ltr'} • Qty: {delivery.Subscription?.baseQuantity || 1}
            </Text>
          </View>
        </View>

        <View style={styles.headerActionsOptionC}>
          {!isViewOnly && !isEditing && (
            <TouchableOpacity
              style={[styles.quickDeliverIconBtnOptionC, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5', marginRight: 6 }]}
              onPress={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
                setIsEditing(true);
              }}
              activeOpacity={0.7}
            >
              <Edit2 size={18} color="#EA580C" />
            </TouchableOpacity>
          )}

          {!isViewOnly && delivery.status === 'pending' && !isExpanded && (
            <TouchableOpacity
              style={styles.quickDeliverIconBtnOptionC}
              onPress={(e) => {
                e.stopPropagation();
                handleStatusChange('delivered');
              }}
              activeOpacity={0.7}
              disabled={updating}
            >
              {updating ? <ActivityIndicator size="small" color="#10B981" /> : <CheckSquare size={22} color="#10B981" />}
            </TouchableOpacity>
          )}
          {!isViewOnly && delivery.status === 'delivered' && !isExpanded && (
            <TouchableOpacity
              style={[styles.quickDeliverIconBtnOptionC, { backgroundColor: '#ECFDF5', borderColor: '#10B981' }]}
              onPress={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              activeOpacity={0.7}
              disabled={updating}
            >
              {updating ? <ActivityIndicator size="small" color="#10B981" /> : <CheckSquare size={22} color="#10B981" />}
            </TouchableOpacity>
          )}
          {!isViewOnly && delivery.status === 'skipped' && !isExpanded && (
            <TouchableOpacity
              style={[styles.quickDeliverIconBtnOptionC, { backgroundColor: '#FEF2F2', borderColor: '#EF4444' }]}
              onPress={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              activeOpacity={0.7}
              disabled={updating}
            >
              {updating ? <ActivityIndicator size="small" color="#EF4444" /> : <XCircle size={22} color="#EF4444" />}
            </TouchableOpacity>
          )}

          {isViewOnly && (
            <View style={[styles.statusBadgePill,
            delivery.status === 'delivered' ? { backgroundColor: '#ECFDF5', borderColor: '#10B981' } :
              (delivery.status === 'skipped' || delivery.status === 'pending') ? { backgroundColor: '#FEF2F2', borderColor: '#EF4444' } :
                { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }
            ]}>
              <Text style={[styles.statusBadgeText,
              delivery.status === 'delivered' ? { color: '#10B981' } :
                (delivery.status === 'skipped' || delivery.status === 'pending') ? { color: '#EF4444' } :
                  { color: '#B45309' }
              ]}>
                {delivery.status === 'pending' ? 'UNDELIVERED' : delivery.status.toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.expandIconContainerOptionC}>
            {isExpanded ? (
              <ChevronUp size={20} color="#334155" />
            ) : (
              <ChevronDown size={20} color="#334155" />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContentOptionC}>
          {isViewOnly ? (
            <View style={styles.viewOnlyDetailsContainer}>
              {!!delivery.Customer?.phone && (
                <View style={styles.detailRow}>
                  <Phone size={14} color="#64748B" />
                  <Text style={styles.detailText}>{delivery.Customer.phone}</Text>
                </View>
              )}
              {!!delivery.Customer?.address && (
                <View style={styles.detailRow}>
                  <MapPin size={14} color="#64748B" />
                  <Text style={styles.detailText}>{delivery.Customer.address}</Text>
                </View>
              )}
              <View style={[styles.sliderUnitsRowOptionC, { marginTop: 12, marginBottom: 0 }]}>
                <View style={styles.sliderUnitOptionC}>
                  <Text style={styles.sliderUnitLabelOptionC}>{t('deliveries.emptyRetrieved')}</Text>
                  <Text style={styles.sliderUnitValueOptionC}>{emptyUnits}</Text>
                </View>
                <View style={[styles.sliderUnitOptionC, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                  <Text style={[styles.sliderUnitLabelOptionC, { color: '#0B409C' }]}>{t('deliveries.delivered')}</Text>
                  <Text style={[styles.sliderUnitValueOptionC, { color: '#0B409C' }]}>{fullUnits}</Text>
                </View>
              </View>
            </View>
          ) : !isEditing ? (
            <View style={styles.sliderSectionOptionC}>
              <View style={styles.sliderUnitsRowOptionC}>
                <View style={styles.sliderUnitOptionC}>
                  <Text style={styles.sliderUnitLabelOptionC}>{t('deliveries.emptyJars')}</Text>
                  <Text style={styles.sliderUnitValueOptionC}>{emptyUnits}</Text>
                </View>
                <View style={[styles.sliderUnitOptionC, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                  <Text style={[styles.sliderUnitLabelOptionC, { color: '#0B409C' }]}>{t('deliveries.delivered')}</Text>
                  <Text style={[styles.sliderUnitValueOptionC, { color: '#0B409C' }]}>{fullUnits}</Text>
                </View>
              </View>
              <DeliveryStatusSlider
                status={delivery.status}
                onStatusChange={handleStatusChange}
              />
            </View>
          ) : (
            <View style={styles.inlineEditContainerOptionC}>
              <View style={styles.inlineInputWrapperOptionC}>
                <View style={styles.inlineInputGroupOptionC}>
                  <Text style={styles.inlineInputLabelOptionC}>{t('deliveries.emptyJars')}</Text>
                  <TextInput
                    style={styles.inlineInputOptionC}
                    value={emptyUnits}
                    onChangeText={setEmptyUnits}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={styles.inlineInputGroupOptionC}>
                  <Text style={styles.inlineInputLabelOptionC}>{t('deliveries.delivered')}</Text>
                  <TextInput
                    style={[styles.inlineInputOptionC, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#0B409C' }]}
                    value={fullUnits}
                    onChangeText={setFullUnits}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              </View>

              {/* Status Pills Selector */}
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginTop: 10, marginBottom: 6 }}>
                Change Delivery Status:
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <TouchableOpacity
                  style={[{ flex: 1, paddingVertical: 7, borderRadius: 8, borderWidth: 1, alignItems: 'center', backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' },
                    selectedEditStatus === 'skipped' && { backgroundColor: '#FEF2F2', borderColor: '#EF4444' }
                  ]}
                  onPress={() => setSelectedEditStatus('skipped')}
                  activeOpacity={0.7}
                >
                  <Text style={[{ fontSize: 11, fontWeight: '700', color: '#64748B' }, selectedEditStatus === 'skipped' && { color: '#B91C1C' }]}>
                    {t('deliveries.skipped').toUpperCase()}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[{ flex: 1, paddingVertical: 7, borderRadius: 8, borderWidth: 1, alignItems: 'center', backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' },
                    selectedEditStatus === 'pending' && { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }
                  ]}
                  onPress={() => setSelectedEditStatus('pending')}
                  activeOpacity={0.7}
                >
                  <Text style={[{ fontSize: 11, fontWeight: '700', color: '#64748B' }, selectedEditStatus === 'pending' && { color: '#B45309' }]}>
                    {t('deliveries.pending').toUpperCase()}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[{ flex: 1, paddingVertical: 7, borderRadius: 8, borderWidth: 1, alignItems: 'center', backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' },
                    selectedEditStatus === 'delivered' && { backgroundColor: '#ECFDF5', borderColor: '#10B981' }
                  ]}
                  onPress={() => setSelectedEditStatus('delivered')}
                  activeOpacity={0.7}
                >
                  <Text style={[{ fontSize: 11, fontWeight: '700', color: '#64748B' }, selectedEditStatus === 'delivered' && { color: '#15803D' }]}>
                    {t('deliveries.delivered').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <TouchableOpacity
                  style={[styles.inlineSaveBtnOptionC, { flex: 1, backgroundColor: '#F1F5F9', marginTop: 0 }]}
                  onPress={() => setIsEditing(false)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.inlineSaveBtnTextOptionC, { color: '#64748B' }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inlineSaveBtnOptionC, { flex: 1, marginTop: 0 }]}
                  onPress={() => handleUpdate(selectedEditStatus, fullUnits, emptyUnits)}
                  activeOpacity={0.8}
                >
                  <Save size={16} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={styles.inlineSaveBtnTextOptionC}>{t('common.saveChanges')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};


const PastDeliveriesScreen = () => {
  const navigation = useNavigation();
  const { userToken, user } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const { t } = useTranslation();

  // Helper date functions
  const formatDateString = (dateObj) => {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  // State
  const [selectedDate, setSelectedDate] = useState(formatDateString(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [activeFilterModal, setActiveFilterModal] = useState(null); // 'route' | 'status' | null

  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ total: 0, delivered: 0, pending: 0, skipped: 0 });
  const [deliveries, setDeliveries] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Fetch routes on mount
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await api.listRoutes(userToken);
        if (res && res.success) {
          setRoutes(res.data || []);
        }
      } catch (err) {
        console.error('Error loading routes:', err);
      }
    };
    if (userToken) fetchRoutes();
  }, [userToken]);

  // Fetch delivery tracking data
  const fetchTrackingData = async () => {
    setLoading(true);
    try {
      const res = await api.trackDeliveries(userToken, {
        date: selectedDate,
        routeId: selectedRouteId,
        status: selectedStatus === 'all' ? '' : selectedStatus,
      });

      if (res && res.success) {
        setCounts(res.counts || { total: 0, delivered: 0, pending: 0, skipped: 0 });
        setDeliveries(res.data || []);
      } else {
        setDeliveries([]);
        setCounts({ total: 0, delivered: 0, pending: 0, skipped: 0 });
      }
    } catch (err) {
      console.error('Error fetching delivery tracking:', err);
      showAlert('Error', err.message || 'Failed to load deliveries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userToken) {
      fetchTrackingData();
    }
  }, [selectedDate, selectedRouteId, selectedStatus, userToken]);

  // Date Navigation handlers
  const handlePrevDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 1);
    setSelectedDate(formatDateString(current));
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + 1);
    setSelectedDate(formatDateString(current));
  };

  const handleDateChange = (event, dateObj) => {
    setShowDatePicker(false);
    if (dateObj) {
      setSelectedDate(formatDateString(dateObj));
    }
  };

  // Update status for actual generated pending deliveries
  const handleUpdateStatus = async (deliveryId, data) => {
    if (String(deliveryId).startsWith('preview-')) {
      showAlert('Notice', 'Status updates are disabled for future preview deliveries.', 'info');
      return;
    }

    setActionLoadingId(deliveryId);
    try {
      const res = await api.updateDeliveryStatus(userToken, deliveryId, data);
      if (res && res.success) {
        showAlert('Success', `Delivery marked as ${data.status}`, 'success');
        fetchTrackingData();
      } else {
        const msg = res?.message || 'Failed to update delivery status';
        const isLocked = msg.toLowerCase().includes('locked') || msg.toLowerCase().includes('invoice has already been generated');
        if (isLocked) {
          showAlert('Locked Delivery', 'This order is locked because an invoice has already been generated for it.', 'info');
        } else {
          showAlert('Error', msg, 'error');
        }
      }
    } catch (err) {
      const msg = err?.message || '';
      const isLocked = msg.toLowerCase().includes('locked') || msg.toLowerCase().includes('invoice has already been generated');
      if (isLocked) {
        showAlert('Locked Delivery', 'This order is locked because an invoice has already been generated for it.', 'info');
      } else {
        showAlert('Error', msg || 'Something went wrong', 'error');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return '#10B981'; // Green
      case 'skipped': return '#EF4444'; // Red
      case 'pending':
      default: return '#EAB308'; // Yellow
    }
  };

  const getStatusBadge = (status, isPreview) => {
    if (isPreview) {
      return { label: 'PREVIEW', bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
    }
    switch (status) {
      case 'delivered':
        return { label: 'DELIVERED', bg: '#ECFDF5', text: '#129c00ff', border: '#A7F3D0' };
      case 'skipped':
        return { label: 'SKIPPED', bg: '#FEF2F2', text: '#980000ff', border: '#FECACA' };
      default:
        return { label: 'PENDING', bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' };
    }
  };

  const totalDeliveries = counts.total || 0;
  const completedDeliveries = counts.delivered || 0;
  const pendingDeliveries = counts.pending || 0;
  const skippedDeliveries = counts.skipped || 0;
  const deliveryProgress = totalDeliveries === 0 ? 0 : Math.round((completedDeliveries / totalDeliveries) * 100);

  const todayStr = formatDateString(new Date());
  const isPastDate = selectedDate !== todayStr;

  return (
    <View style={styles.container}>
      <CurvedHeader
        title={t('deliveries.allDeliveries') || 'All Deliveries'}
        leftIcon={<ArrowLeft size={24} color="#0B409C" />}
        onLeftPress={() => navigation.goBack()}
        height={140}
        contentStyle={{ paddingTop: Platform.OS === 'ios' ? 40 : 20, paddingBottom: 25 }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Date Selector Row */}
        <View style={styles.dateSelectorCard}>
          <TouchableOpacity style={styles.dateNavBtn} onPress={handlePrevDay} activeOpacity={0.7}>
            <ChevronLeft size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.dateDisplayBtn} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
            <CalendarIcon size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.dateDisplayText}>{formatDisplayDate(selectedDate)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dateNavBtn, !isPastDate && { opacity: 0.3 }]}
            onPress={() => {
              if (isPastDate) handleNextDay();
            }}
            activeOpacity={isPastDate ? 0.7 : 1}
            disabled={!isPastDate}
          >
            <ChevronRight size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={new Date(selectedDate)}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            maximumDate={new Date()}
            onChange={handleDateChange}
          />
        )}

        {/* Filters Row: Route & Status */}
        <View style={styles.filtersHorizontalRow}>
          {/* Route Dropdown */}
          <TouchableOpacity
            style={[styles.filterDropdown, { flex: 1 }]}
            onPress={() => setActiveFilterModal('route')}
            activeOpacity={0.7}
          >
            <MapPin size={15} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.filterDropdownText} numberOfLines={1}>
              {selectedRouteId ? (routes.find(r => String(r.id) === String(selectedRouteId))?.name || 'Route') : 'All Routes'}
            </Text>
            <ChevronRight size={15} color={COLORS.textPlaceholder} style={{ marginLeft: 'auto', transform: [{ rotate: '90deg' }] }} />
          </TouchableOpacity>

          {/* Status Dropdown */}
          <TouchableOpacity
            style={[styles.filterDropdown, { flex: 1 }]}
            onPress={() => setActiveFilterModal('status')}
            activeOpacity={0.7}
          >
            <Truck size={15} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.filterDropdownText} numberOfLines={1}>
              {selectedStatus === 'all' ? 'All Status' : selectedStatus.toUpperCase()}
            </Text>
            <ChevronRight size={15} color={COLORS.textPlaceholder} style={{ marginLeft: 'auto', transform: [{ rotate: '90deg' }] }} />
          </TouchableOpacity>
        </View>

        {/* Progress Bar Card */}
        <View style={styles.linearProgressCard}>
          <View style={styles.linearProgressInner}>
            <View style={styles.linearProgressMain}>
              <View style={styles.linearProgressHeader}>
                <Text style={styles.linearProgressStats}>
                  <Text style={styles.linearProgressStatsBig}>{completedDeliveries}</Text> <Text style={styles.linearProgressStatsSmall}>/ {totalDeliveries} Delivered</Text>
                </Text>
              </View>
              <View style={styles.linearProgressBarBg}>
                <View style={[styles.linearProgressBarFill, { width: `${deliveryProgress}%` }]} />
              </View>
            </View>

            <View style={styles.linearProgressDivider} />

            <View style={styles.linearProgressPending}>
              <Text style={styles.linearProgressPendingNum}>{pendingDeliveries}</Text>
              <Text style={styles.linearProgressPendingText}>{t('deliveries.pending')}</Text>
            </View>

            {skippedDeliveries > 0 && (
              <>
                <View style={styles.linearProgressDivider} />
                <View style={styles.linearProgressPending}>
                  <Text style={[styles.linearProgressPendingNum, { color: '#EF4444' }]}>{skippedDeliveries}</Text>
                  <Text style={[styles.linearProgressPendingText, { color: '#EF4444' }]}>{t('deliveries.skipped') || 'Skipped'}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Deliveries Data Section */}
        <Text style={styles.sectionTitle}>{t('deliveries.title')} ({deliveries.length})</Text>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>{t('deliveries.loadingDeliveries')}</Text>
          </View>
        ) : deliveries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Truck size={40} color={COLORS.textPlaceholder} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>{t('deliveries.noDeliveriesFound')}</Text>
            <Text style={styles.emptySubtitle}>{t('deliveries.noRecordsFilter')}</Text>
          </View>
        ) : (
          deliveries.map((item, idx) => {
            const todayStr = new Date().toISOString().split('T')[0];
            const isPast = selectedDate < todayStr;
            const isLocked = user?.role === 'staff' && (item.status !== 'pending' || !!item.invoiceId || isPast);
            return (
            <DeliveryCard
              key={item.id || idx}
              delivery={item}
              index={idx + 1}
              onUpdateStatus={async (id, data) => await handleUpdateStatus(id, data)}
              getStatusColor={getStatusColor}
              isViewOnly={String(item.id || '').startsWith('preview-') || isLocked}
            />
          )})
        )}

      </ScrollView>

      {/* Filter Modals */}
      {activeFilterModal === 'route' && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setActiveFilterModal(null)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setActiveFilterModal(null)}>
            <View style={styles.filterModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('deliveries.selectRoute')}</Text>
                <TouchableOpacity onPress={() => setActiveFilterModal(null)}>
                  <X size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                  style={styles.filterModalItem}
                  onPress={() => { setSelectedRouteId(''); setActiveFilterModal(null); }}
                >
                  <Text style={[styles.filterModalItemText, !selectedRouteId && { color: COLORS.primary, fontFamily: 'Geologica-Bold' }]}>
                    {t('deliveries.allRoutes')}
                  </Text>
                </TouchableOpacity>
                {routes.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={styles.filterModalItem}
                    onPress={() => { setSelectedRouteId(r.id); setActiveFilterModal(null); }}
                  >
                    <Text style={[styles.filterModalItemText, selectedRouteId === r.id && { color: COLORS.primary, fontFamily: 'Geologica-Bold' }]}>
                      {r.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {activeFilterModal === 'status' && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setActiveFilterModal(null)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setActiveFilterModal(null)}>
            <View style={styles.filterModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('deliveries.selectStatus')}</Text>
                <TouchableOpacity onPress={() => setActiveFilterModal(null)}>
                  <X size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {['all', 'pending', 'delivered', 'skipped'].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={styles.filterModalItem}
                    onPress={() => { setSelectedStatus(st); setActiveFilterModal(null); }}
                  >
                    <Text style={[styles.filterModalItemText, selectedStatus === st && { color: COLORS.primary, fontFamily: 'Geologica-Bold' }]}>
                      {st === 'all' ? 'All Status' : st.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
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
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  headerRightSpacing: {
    width: 32,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Date Selector Row
  dateSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  dateNavBtn: {
    padding: 6,
  },
  dateDisplayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateDisplayText: {
    fontSize: 15,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },

  // Filters Row
  filtersHorizontalRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 10,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
  },
  filterDropdownText: {
    fontSize: 12,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    flex: 1,
  },

  // Stats Grid (Matching HomeScreen Overview Cards)
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 20,
  },
  overviewStyleStatCard: {
    width: '48%',
    height: 95,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
  },
  overviewStatTitle: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.primary,
    marginBottom: 4,
  },
  overviewStatValue: {
    fontSize: 26,
    fontFamily: 'Geologica-Bold',
    color: COLORS.secondary,
  },

  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPlaceholder,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPlaceholder,
    textAlign: 'center',
  },

  // Delivery Card
  deliveryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerNameText: {
    fontSize: 15,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
  },
  statusBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: 'Geologica-Bold',
    letterSpacing: 0.5,
  },
  deliveryCardWrapperOptionC: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeaderOptionC: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBoxOptionC: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconBoxTextOptionC: {
    color: '#0B409C',
    fontFamily: 'Geologica-Bold',
    fontSize: 18,
  },
  titleContainerOptionC: {
    flex: 1,
    marginRight: 12,
  },
  customerNameOptionC: {
    fontSize: 16,
    fontFamily: 'Geologica-Bold',
    color: '#0F172A',
  },
  subTextOptionC: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: '#64748B',
    flexShrink: 1,
  },
  headerActionsOptionC: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickDeliverIconBtnOptionC: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliveryCardExpandedOptionC: {
    borderColor: '#E2E8F0',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
  },
  expandIconContainerOptionC: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedContentOptionC: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sliderSectionOptionC: {
    width: '100%',
  },
  sliderUnitsRowOptionC: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  sliderUnitOptionC: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sliderUnitLabelOptionC: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: '#475569',
  },
  sliderUnitValueOptionC: {
    fontSize: 16,
    fontFamily: 'Geologica-Bold',
    color: '#0F172A',
  },
  inlineEditContainerOptionC: {
    marginTop: 4,
  },
  inlineInputWrapperOptionC: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inlineInputGroupOptionC: {
    flex: 1,
  },
  inlineInputLabelOptionC: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: '#64748B',
    marginBottom: 6,
    marginLeft: 4,
  },
  inlineInputOptionC: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Geologica-Bold',
    color: '#0F172A',
  },
  inlineSaveBtnOptionC: {
    flexDirection: 'row',
    backgroundColor: '#0B409C',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineSaveBtnTextOptionC: {
    color: '#FFF',
    fontFamily: 'Geologica-Bold',
    fontSize: 15,
  },
  cardUpdatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  viewOnlyDetailsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: '#475569',
    flex: 1,
  },

  // Product & Qty Row
  productDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productNameText: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },
  expectedQtyText: {
    fontSize: 11,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  qtyStatsGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  qtyStatBox: {
    alignItems: 'flex-end',
  },
  qtyStatLabel: {
    fontSize: 10,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  qtyStatValue: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    marginTop: 1,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnSuccess: {
    backgroundColor: '#129c00ff',
  },
  actionBtnDanger: {
    backgroundColor: '#980000ff',
  },
  actionBtnText: {
    fontSize: 12,
    fontFamily: 'Geologica-Bold',
    color: '#FFFFFF',
  },

  previewNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  previewNoticeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
  },

  // Linear Progress Card Styles
  linearProgressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  linearProgressInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linearProgressMain: {
    flex: 1,
  },
  linearProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  linearProgressStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  linearProgressStatsBig: {
    fontSize: 20,
    fontFamily: 'Geologica-Bold',
    color: '#0F172A',
  },
  linearProgressStatsSmall: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: '#64748B',
  },
  linearProgressPercent: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: '#64748B',
  },
  linearProgressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  linearProgressBarFill: {
    height: '100%',
    backgroundColor: '#0B409C',
    borderRadius: 4,
  },
  linearProgressDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 20,
  },
  linearProgressPending: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  linearProgressPendingNum: {
    fontSize: 18,
    fontFamily: 'Geologica-Bold',
    color: '#F97316',
  },
  linearProgressPendingText: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: '#F97316',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  filterModalContent: {
    width: '100%',
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },
  filterModalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  filterModalItemText: {
    fontSize: 14,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPrimary,
  },
});

export default PastDeliveriesScreen;
