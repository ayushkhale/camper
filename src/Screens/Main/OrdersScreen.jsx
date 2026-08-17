import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Truck, Package, CheckSquare, XCircle, ChevronRight, ChevronDown, ChevronUp, X, Play, Calendar, MapPin, AlertCircle, Edit2, Save, MoreVertical, Activity, FileText, Menu, User
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect, DrawerActions } from '@react-navigation/native';
import DeliveryStatusSlider from '../../components/DeliveryStatusSlider';
import CurvedHeader from '../../components/CurvedHeader';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useAlert } from '../../context/AlertContext';

const getNext7Days = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: d,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      fullDate: d.toISOString().split('T')[0]
    });
  }
  return days;
};

const DeliveryCard = ({ delivery, index, onUpdateStatus, getStatusColor, t }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedEditStatus, setSelectedEditStatus] = useState(delivery.status || 'pending');

  useEffect(() => {
    setSelectedEditStatus(delivery.status || 'pending');
  }, [delivery.status]);

  const expectedTotal = (delivery.expectedSubscriptionUnits || 0) + (delivery.expectedAddonUnits || 0);
  const defaultFull = (delivery.status === 'pending' && (!delivery.fullUnitsDelivered || delivery.fullUnitsDelivered === 0))
    ? (expectedTotal > 0 ? expectedTotal.toString() : (delivery.Subscription?.baseQuantity?.toString() || '0'))
    : (delivery.fullUnitsDelivered?.toString() || '0');

  const defaultEmpty = (delivery.status === 'pending' && (!delivery.emptyUnitsCollected || delivery.emptyUnitsCollected === 0))
    ? (delivery.expectedEmptyCollections?.toString() || '0')
    : (delivery.emptyUnitsCollected?.toString() || '0');

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
    <View style={[styles.deliveryCardWrapperOptionC, isExpanded && styles.deliveryCardExpandedOptionC]}>
      {updating && (
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
              {delivery.Subscription?.Product?.name || (delivery.oneTimeOrderId ? 'One-Time Order' : 'Water Camper 20Ltr')} • Qty: {delivery.Subscription?.baseQuantity || delivery.expectedAddonUnits || delivery.fullUnitsDelivered || 1}
            </Text>
          </View>
        </View>

        <View style={styles.headerActionsOptionC}>
          {!isEditing && (
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

          {delivery.status === 'pending' && !isExpanded && (
            <TouchableOpacity
              style={styles.quickDeliverIconBtnOptionC}
              onPress={(e) => {
                e.stopPropagation();
                handleStatusChange('delivered');
              }}
              activeOpacity={0.7}
            >
              <CheckSquare size={22} color="#10B981" />
            </TouchableOpacity>
          )}
          {delivery.status === 'delivered' && !isExpanded && (
            <TouchableOpacity
              style={[styles.quickDeliverIconBtnOptionC, { backgroundColor: '#ECFDF5', borderColor: '#10B981' }]}
              onPress={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              activeOpacity={0.7}
            >
              <CheckSquare size={22} color="#10B981" />
            </TouchableOpacity>
          )}
          {delivery.status === 'skipped' && !isExpanded && (
            <TouchableOpacity
              style={[styles.quickDeliverIconBtnOptionC, { backgroundColor: '#FEF2F2', borderColor: '#EF4444' }]}
              onPress={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              activeOpacity={0.7}
            >
              <XCircle size={22} color="#EF4444" />
            </TouchableOpacity>
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

          {!isEditing ? (
            <View style={styles.sliderSectionOptionC}>
              <View style={styles.sliderUnitsRowOptionC}>
                <View style={styles.sliderUnitOptionC}>
                  <Text style={styles.sliderUnitLabelOptionC}>{t ? t('deliveries.emptyJars') : 'Empty Jars'}</Text>
                  <Text style={styles.sliderUnitValueOptionC}>{emptyUnits}</Text>
                </View>
                <View style={[styles.sliderUnitOptionC, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                  <Text style={[styles.sliderUnitLabelOptionC, { color: '#0B409C' }]}>{t ? t('deliveries.delivered') : 'Delivered'}</Text>
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
                  <Text style={styles.inlineInputLabelOptionC}>{t ? t('deliveries.emptyJars') : 'Empty Jars'}</Text>
                  <TextInput
                    style={styles.inlineInputOptionC}
                    value={emptyUnits}
                    onChangeText={setEmptyUnits}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={styles.inlineInputGroupOptionC}>
                  <Text style={styles.inlineInputLabelOptionC}>{t ? t('deliveries.delivered') : 'Delivered'}</Text>
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
                    selectedEditStatus === 'delivered' && { backgroundColor: '#ECFDF5', borderColor: '#10B981' }
                  ]}
                  onPress={() => setSelectedEditStatus('delivered')}
                  activeOpacity={0.7}
                >
                  <Text style={[{ fontSize: 11, fontWeight: '700', color: '#64748B' }, selectedEditStatus === 'delivered' && { color: '#15803D' }]}>
                    DELIVERED
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[{ flex: 1, paddingVertical: 7, borderRadius: 8, borderWidth: 1, alignItems: 'center', backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' },
                    selectedEditStatus === 'skipped' && { backgroundColor: '#FEF2F2', borderColor: '#EF4444' }
                  ]}
                  onPress={() => setSelectedEditStatus('skipped')}
                  activeOpacity={0.7}
                >
                  <Text style={[{ fontSize: 11, fontWeight: '700', color: '#64748B' }, selectedEditStatus === 'skipped' && { color: '#B91C1C' }]}>
                    SKIPPED
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
                    PENDING
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <TouchableOpacity
                  style={[styles.inlineSaveBtnOptionC, { flex: 1, backgroundColor: '#F1F5F9', marginTop: 0 }]}
                  onPress={() => setIsEditing(false)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.inlineSaveBtnTextOptionC, { color: '#64748B' }]}>{t ? t('common.cancel') : 'Cancel'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inlineSaveBtnOptionC, { flex: 1, marginTop: 0 }]}
                  onPress={() => handleUpdate(selectedEditStatus, fullUnits, emptyUnits)}
                  activeOpacity={0.8}
                >
                  <Save size={16} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={styles.inlineSaveBtnTextOptionC}>{t ? t('common.saveChanges') : 'Save Changes'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

    </View>
  );
};


const OrdersScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { userToken, user } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const vendorLogo = user?.logoUrl || user?.imageUrl;

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const onDateChange = (event, selectedDateObj) => {
    setShowDatePicker(false);
    if (selectedDateObj) {
      setSelectedDate(formatDateString(selectedDateObj));
    }
  };

  // Deliveries State
  const [allDeliveries, setAllDeliveries] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Modal State
  const [activeFilterModal, setActiveFilterModal] = useState(null); // 'route' | 'status' | null

  // Filters State
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('pending'); // Default: 'pending'

  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (loadingDeliveries) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.75,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.35,
            duration: 750,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [loadingDeliveries]);

  const renderDeliverySkeleton = () => (
    <View style={{ gap: 12 }}>
      {[1, 2, 3].map((key) => (
        <Animated.View key={key} style={[styles.skeletonCardOptionC, { opacity: pulseAnim }]}>
          <View style={styles.skeletonAvatarOptionC} />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <View style={[styles.skeletonTitle, { width: 120, height: 16, marginBottom: 8, marginTop: 0 }]} />
            <View style={[styles.skeletonTitle, { width: 160, height: 12, marginTop: 0 }]} />
          </View>
          <View style={[styles.skeletonValue, { width: 44, height: 44, borderRadius: 12, backgroundColor: '#E2E8F0' }]} />
        </Animated.View>
      ))}
    </View>
  );

  const fetchRoutes = async () => {
    try {
      const res = await api.listRoutes(userToken);
      if (res.success) {
        setRoutes(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
    }
  };

  const fetchDeliveries = async (dateStr, routeId = '') => {
    setLoadingDeliveries(true);
    try {
      const res = await api.listDeliveries(userToken, dateStr, routeId, '');
      if (res && res.success) {
        let rawList = Array.isArray(res.data) ? res.data : (res.data?.deliveries || []);

        // Exclude one-time order deliveries from Today's & All Deliveries view
        rawList = rawList.filter(item => !item.oneTimeOrderId && !item.one_time_order_item_id);

        setAllDeliveries(rawList);
      }
    } catch (err) {
      console.error('Error fetching deliveries:', err);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  useEffect(() => {
    if (userToken) {
      fetchDeliveries(selectedDate, selectedRouteId);
    }
  }, [selectedDate, selectedRouteId, userToken]);

  useEffect(() => {
    if (userToken) {
      fetchRoutes();
    }
  }, [userToken]);

  const handleGenerateDeliveries = async () => {
    setGenerating(true);
    try {
      const res = await api.generateDeliveries(userToken, selectedDate);
      if (res.success) {
        showAlert('Success', res.message || 'Deliveries generated successfully.', 'success');
        fetchDeliveries(selectedDate);
      } else {
        showAlert('Notice', res.message || 'Could not generate deliveries.', 'info');
      }
    } catch (err) {
      showAlert('Error', err.message || 'An error occurred', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeliveryUpdate = async (deliveryId, data) => {
    try {
      const res = await api.updateDeliveryStatus(userToken, deliveryId, data);
      if (res && res.success) {
        setAllDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, status: data.status } : d));
        fetchDeliveries(selectedDate, selectedRouteId);
      } else {
        const msg = res?.message || 'Failed to update delivery';
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
        showAlert('Error', msg || 'Failed to update delivery', 'error');
      }
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return { dot: '#16A34A', text: '#15803D' };
      case 'skipped': return { dot: '#EF4444', text: '#B91C1C' };
      default: return { dot: '#D97706', text: '#B45309' }; // pending
    }
  };

  const getGroupedDeliveries = () => {
    const groups = {};
    filteredDeliveries.forEach(d => {
      const routeName = d.Customer?.Route?.name || 'Unassigned Route';
      if (!groups[routeName]) {
        groups[routeName] = [];
      }
      groups[routeName].push(d);
    });
    return Object.keys(groups).map(name => ({
      routeName: name,
      items: groups[name]
    }));
  };

  const filteredDeliveries = allDeliveries.filter(item => {
    const st = (item.status || '').toLowerCase();
    if (selectedStatus === 'pending') return st === 'pending';
    if (selectedStatus === 'completed') return st === 'delivered' || st === 'completed';
    if (selectedStatus === 'skipped') return st === 'skipped' || st === 'skip';
    return true;
  });

  const totalDeliveries = Array.isArray(allDeliveries) ? allDeliveries.length : 0;
  const completedDeliveries = Array.isArray(allDeliveries)
    ? allDeliveries.filter(d => (d.status || '').toLowerCase() === 'delivered' || (d.status || '').toLowerCase() === 'completed').length
    : 0;
  const skippedDeliveries = Array.isArray(allDeliveries)
    ? allDeliveries.filter(d => (d.status || '').toLowerCase() === 'skipped' || (d.status || '').toLowerCase() === 'skip').length
    : 0;
  const pendingDeliveries = Array.isArray(allDeliveries)
    ? allDeliveries.filter(d => (d.status || '').toLowerCase() === 'pending').length
    : 0;
  const rawProgress = totalDeliveries > 0 ? Math.round((completedDeliveries / totalDeliveries) * 100) : 0;
  const deliveryProgress = Math.min(100, Math.max(0, isNaN(rawProgress) ? 0 : rawProgress));

  return (
    <View style={styles.container}>
      <CurvedHeader
        title="Today's Deliveries"
        leftIcon={<Menu size={24} color="#FFF" />}
        onLeftPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
        height={120}
        contentStyle={{ paddingTop: 10, paddingBottom: 25 }}
      />
      <View style={styles.contentWrapper}>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <View style={styles.topFiltersContainerOptionC}>
            <View style={styles.filterRowOptionC}>
              <TouchableOpacity
                style={styles.filterBtnOptionC}
                onPress={() => setActiveFilterModal('route')}
                activeOpacity={0.7}
              >
                <MapPin size={16} color="#334155" style={{ marginRight: 8 }} />
                <Text style={styles.filterBtnTextOptionC} numberOfLines={1}>
                  {selectedRouteId ? (routes.find(r => String(r.id) === String(selectedRouteId))?.name || 'Route') : t('deliveries.allRoutes')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterBtnOptionC}
                onPress={() => setActiveFilterModal('status')}
                activeOpacity={0.7}
              >
                <Truck size={16} color="#334155" style={{ marginRight: 8 }} />
                <Text style={styles.filterBtnTextOptionC} numberOfLines={1}>
                  {selectedStatus === 'pending' ? t('deliveries.pending') : selectedStatus === 'completed' ? t('deliveries.completed') : selectedStatus === 'skipped' ? t('deliveries.skipped') : t('common.all')}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.generateBtnOptionC}
              onPress={handleGenerateDeliveries}
              disabled={generating}
              activeOpacity={0.7}
            >
              {generating ? (
                <ActivityIndicator size="small" color="#0B409C" />
              ) : (
                <>
                  <FileText size={18} color="#0B409C" style={{ marginRight: 8 }} />
                  <Text style={styles.generateBtnTextOptionC}>
                    {Array.isArray(allDeliveries) && allDeliveries.length === 0
                      ? t('deliveries.generateForToday')
                      : t('deliveries.refresh')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

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

          <View style={styles.deliveriesContainer}>
            {loadingDeliveries ? (
              renderDeliverySkeleton()
            ) : filteredDeliveries.length === 0 ? (
              <View style={styles.emptyCard}>
                <Truck size={48} color="#94A3B8" style={{ marginBottom: 16 }} />
                <Text style={styles.emptyTitle}>{t('deliveries.emptyDeliveries')}</Text>
                <Text style={styles.emptySubtitle}>{t('deliveries.emptyDeliveriesSub')}</Text>
              </View>
            ) : (
              filteredDeliveries.map((delivery, idx) => (
                <DeliveryCard
                  key={delivery.id}
                  delivery={delivery}
                  index={idx + 1}
                  onUpdateStatus={handleDeliveryUpdate}
                  getStatusColor={getStatusColor}
                  t={t}
                />
              ))
            )}
          </View>

        </ScrollView>
      </View>

      {/* Route & Status Filter Modals */}
      {activeFilterModal === 'route' && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveFilterModal(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setActiveFilterModal(null)}
          >
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

      {/* Status Filter Modal (Pending, Completed, All in last) */}
      {activeFilterModal === 'status' && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveFilterModal(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setActiveFilterModal(null)}
          >
            <View style={styles.filterModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('deliveries.selectStatus')}</Text>
                <TouchableOpacity onPress={() => setActiveFilterModal(null)}>
                  <X size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* 1. Pending (Default) */}
                <TouchableOpacity
                  style={styles.filterModalItem}
                  onPress={() => { setSelectedStatus('pending'); setActiveFilterModal(null); }}
                >
                  <Text style={[styles.filterModalItemText, selectedStatus === 'pending' && { color: COLORS.primary, fontFamily: 'Geologica-Bold' }]}>
                    {t('deliveries.pending')}
                  </Text>
                </TouchableOpacity>

                {/* 2. Completed */}
                <TouchableOpacity
                  style={styles.filterModalItem}
                  onPress={() => { setSelectedStatus('completed'); setActiveFilterModal(null); }}
                >
                  <Text style={[styles.filterModalItemText, selectedStatus === 'completed' && { color: COLORS.primary, fontFamily: 'Geologica-Bold' }]}>
                    {t('deliveries.completed')}
                  </Text>
                </TouchableOpacity>

                {/* 3. Skipped */}
                <TouchableOpacity
                  style={styles.filterModalItem}
                  onPress={() => { setSelectedStatus('skipped'); setActiveFilterModal(null); }}
                >
                  <Text style={[styles.filterModalItemText, selectedStatus === 'skipped' && { color: COLORS.danger || '#EF4444', fontFamily: 'Geologica-Bold' }]}>
                    {t('deliveries.skipped')}
                  </Text>
                </TouchableOpacity>

                {/* 4. All (In Last) */}
                <TouchableOpacity
                  style={styles.filterModalItem}
                  onPress={() => { setSelectedStatus('all'); setActiveFilterModal(null); }}
                >
                  <Text style={[styles.filterModalItemText, selectedStatus === 'all' && { color: COLORS.primary, fontFamily: 'Geologica-Bold' }]}>
                    {t('common.all')}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}



      {showDatePicker && (
        <DateTimePicker
          value={parseDateString(selectedDate)}
          mode="date"
          display="default"
          onChange={onDateChange}
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
  contentWrapper: {
    flex: 1,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    fontFamily: 'Geologica-Bold',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: 'Geologica-Medium',
    marginTop: 4,
  },
  topHeaderIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  calendarCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  calendarTitle: {
    fontSize: 15,
    fontFamily: 'Geologica-Bold',
    color: COLORS.primary,
  },
  calHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  todayPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  todayPillText: {
    fontSize: 12,
    fontFamily: 'Geologica-Bold',
    color: COLORS.primary,
  },
  calendarIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  calendarStrip: {
    paddingRight: 10,
  },
  dayItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 58,
    height: 76,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  dayItemSelected: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  dayName: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  dayNameSelected: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  dayNumberCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumberCircleSelected: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFFFFF',
    paddingBottom: 2,
  },
  dayNumber: {
    fontSize: 18,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  filtersHorizontalRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 10,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 12,
  },
  filterDropdownText: {
    fontSize: 13,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    flex: 1,
  },
  generateBtnThick: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    height: 48,
    borderRadius: 14,
    marginBottom: 20,
  },
  generateBtnTextThick: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: '#1D4ED8',
  },
  loadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPlaceholder,
  },
  deliveriesContainer: {
    marginBottom: 24,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPlaceholder,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickDeliverIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  expandIconContainer: {
    padding: 2,
    marginLeft: 4,
  },
  expandedContent: {
    marginTop: 8,
  },
  editToggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  editToggleText: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
  },
  routeGroup: {
    marginBottom: 24,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  routeTitle: {
    fontSize: 13,
    fontFamily: 'Geologica-Bold',
    color: '#1D4ED8',
    letterSpacing: 0.5,
    borderBottomWidth: 2,
    borderBottomColor: '#1D4ED8',
    paddingBottom: 4,
  },
  routeBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  routeBadgeText: {
    fontSize: 11,
    fontFamily: 'Geologica-Bold',
    color: '#1D4ED8',
  },
  sliderSection: {
    marginTop: 8,
  },
  sliderUnitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sliderUnit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginHorizontal: 3,
    borderWidth: 1,
  },
  sliderUnitEmpty: {
    backgroundColor: COLORS.surfaceMuted,
    borderColor: '#E2E8F0',
  },
  sliderUnitDelivered: {
    backgroundColor: COLORS.primaryLight,
    borderColor: '#BFDBFE',
  },
  sliderUnitLabel: {
    fontSize: 12,
    fontFamily: 'Geologica-Bold',
  },
  sliderUnitValue: {
    fontSize: 16,
    fontFamily: 'Geologica-Bold',
  },
  cardUpdatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  deliveryCardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  deliveryCardEditing: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  bottomDivider: {
    display: 'none',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  titleContainer: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },
  subText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Geologica-Medium',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Geologica-Bold',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  qtyText: {
    fontSize: 12,
    fontFamily: 'Geologica-Bold',
    color: COLORS.primary,
  },

  inlineEditContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  inlineInputWrapper: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  inlineInputGroup: {
    flex: 1,
  },
  inlineInputLabel: {
    fontSize: 11,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  inlineInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 14,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPrimary,
  },
  inlineSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  inlineSaveBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: 'Geologica-Bold',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  statusOptionActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.border,
  },
  statusOptionText: {
    fontSize: 11,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textSecondary,
  },
  statusOptionTextActive: {
    color: COLORS.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPrimary,
    padding: 0,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Geologica-Bold',
  },
  filterModalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  filterModalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterModalItemText: {
    fontSize: 14.5,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPrimary,
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
  },
  skeletonBar: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
  skeletonBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
  },

  // ===================== NEW OPTION C STYLES ===================== //
  avatarContainerHeader: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topFiltersContainerOptionC: {
    marginBottom: 20,
    gap: 12,
  },
  filterRowOptionC: {
    flexDirection: 'row',
    gap: 12,
  },
  filterBtnOptionC: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
  },
  filterBtnTextOptionC: {
    color: '#0F172A',
    fontFamily: 'Geologica-Bold',
    fontSize: 14,
  },
  generateBtnOptionC: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingVertical: 14,
  },
  generateBtnTextOptionC: {
    color: '#0B409C',
    fontFamily: 'Geologica-Bold',
    fontSize: 15,
  },

  // Skeleton
  skeletonCardOptionC: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  skeletonAvatarOptionC: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
  },

  // Delivery Card Option C
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
  deliveryCardExpandedOptionC: {
    borderColor: '#E2E8F0',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
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
  expandIconContainerOptionC: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Expanded Content
  expandedContentOptionC: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  editToggleRowOptionC: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  editToggleBtnOptionC: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editToggleTextOptionC: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: '#0B409C',
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

  // Inline Edit
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
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineSaveBtnTextOptionC: {
    color: '#FFFFFF',
    fontFamily: 'Geologica-Bold',
    fontSize: 14,
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
});

export default OrdersScreen;
