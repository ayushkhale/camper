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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Truck, Package, CheckCircle, XCircle, ChevronRight, X, Play, Calendar, MapPin, AlertCircle, Edit2, Save, MoreVertical, Activity, FileText
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import DeliveryStatusSlider from '../../components/DeliveryStatusSlider';
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

const DeliveryCard = ({ delivery, onUpdateStatus, getStatusColor, t }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [fullUnits, setFullUnits] = useState(delivery.fullUnitsDelivered?.toString() || delivery.Subscription?.baseQuantity?.toString() || '0');
  const [emptyUnits, setEmptyUnits] = useState(delivery.emptyUnitsCollected?.toString() || '0');
  const [updating, setUpdating] = useState(false);
  
  const statusColors = getStatusColor(delivery.status);

  const handleUpdate = async (status, full, empty) => {
    setUpdating(true);
    await onUpdateStatus(delivery.id, {
      status,
      fullUnitsDelivered: parseInt(full) || 0,
      emptyUnitsCollected: parseInt(empty) || 0,
    });
    setUpdating(false);
    setIsEditing(false);
  };

  const handleStatusChange = (newStatus) => {
    handleUpdate(newStatus, fullUnits, emptyUnits);
  };

  return (
    <View style={[styles.deliveryCardWrapper, isEditing && styles.deliveryCardEditing]}>
      {updating && (
        <View style={styles.cardUpdatingOverlay}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}
      
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Truck size={22} color={COLORS.primary} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.customerName} numberOfLines={1}>
            {delivery.Customer?.name || 'Unknown Customer'}
          </Text>
          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
            <Package size={12} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.subText} numberOfLines={1}>
              {delivery.Subscription?.Product?.name || 'Product'} • Qty: {delivery.Subscription?.baseQuantity || 0}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={{ padding: 4 }} onPress={() => setIsEditing(!isEditing)}>
          <Edit2 size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {!isEditing ? (
        <View style={styles.sliderSection}>
          <View style={styles.sliderUnitsRow}>
            <View style={[styles.sliderUnit, styles.sliderUnitEmpty]}>
              <Text style={[styles.sliderUnitLabel, { color: '#DC2626' }]}>Empty Jars</Text>
              <Text style={[styles.sliderUnitValue, { color: '#DC2626' }]}>{emptyUnits}</Text>
            </View>
            <View style={[styles.sliderUnit, styles.sliderUnitDelivered]}>
              <Text style={[styles.sliderUnitLabel, { color: '#059669' }]}>Delivered</Text>
              <Text style={[styles.sliderUnitValue, { color: '#059669' }]}>{fullUnits}</Text>
            </View>
          </View>
          <DeliveryStatusSlider 
            status={delivery.status} 
            onStatusChange={handleStatusChange} 
          />
        </View>
      ) : (
        <View style={styles.inlineEditContainer}>
          <View style={styles.inlineInputWrapper}>
            <View style={styles.inlineInputGroup}>
              <Text style={styles.inlineInputLabel}>Full Units</Text>
              <TextInput
                style={styles.inlineInput}
                value={fullUnits}
                onChangeText={setFullUnits}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.inlineInputGroup}>
              <Text style={styles.inlineInputLabel}>Empty Units</Text>
              <TextInput
                style={styles.inlineInput}
                value={emptyUnits}
                onChangeText={setEmptyUnits}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
          <TouchableOpacity 
            style={styles.inlineSaveBtn}
            onPress={() => handleUpdate(delivery.status, fullUnits, emptyUnits)}
            activeOpacity={0.8}
          >
            <Save size={16} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.inlineSaveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.bottomDivider} />
    </View>
  );
};


const OrdersScreen = () => {
  const { t } = useTranslation();
  const { userToken } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [calendarDays] = useState(getNext7Days());
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
  const [deliveries, setDeliveries] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Modal State
  const [activeFilterModal, setActiveFilterModal] = useState(null); // 'route' | 'status' | null

  // Filters State
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedStatus] = useState('pending');

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
    <View style={{ gap: 16 }}>
      {[1, 2, 3].map((key) => (
        <Animated.View key={key} style={[styles.skeletonCard, { opacity: pulseAnim }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={styles.skeletonAvatar} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={[styles.skeletonBar, { width: '55%', height: 16, marginBottom: 6 }]} />
              <View style={[styles.skeletonBar, { width: '35%', height: 12 }]} />
            </View>
            <View style={[styles.skeletonBar, { width: 60, height: 24, borderRadius: 12 }]} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={[styles.skeletonBox, { flex: 1, height: 48 }]} />
            <View style={[styles.skeletonBox, { flex: 1, height: 48 }]} />
          </View>
          <View style={[styles.skeletonBar, { width: '100%', height: 48, borderRadius: 24 }]} />
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
      const res = await api.listDeliveries(userToken, dateStr, routeId, 'pending');
      if (res && res.success) {
        const rawList = Array.isArray(res.data) ? res.data : (res.data?.deliveries || []);
        // Hide items whose status is delivered or skipped
        const pendingOnly = rawList.filter(item => item.status !== 'delivered' && item.status !== 'skipped');
        setDeliveries(pendingOnly);
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
        // Immediately remove delivered/skipped item from active pending list
        setDeliveries(prev => prev.filter(d => d.id !== deliveryId));
        fetchDeliveries(selectedDate, selectedRouteId);
      } else {
        showAlert('Error', res.message || 'Failed to update delivery', 'error');
      }
    } catch (err) {
      showAlert('Error', err.message, 'error');
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
    deliveries.forEach(d => {
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.contentWrapper}>
        
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Today's deliveries</Text>
            <Text style={styles.headerSubtitle}>Manage and track your daily delivery tasks</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Filters Row - Route Filter Only */}
          <View style={styles.filtersHorizontalRow}>
            <TouchableOpacity 
              style={[styles.filterDropdown, { flex: 1 }]} 
              onPress={() => setActiveFilterModal('route')}
              activeOpacity={0.7}
            >
              <MapPin size={15} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.filterDropdownText} numberOfLines={1}>
                {selectedRouteId ? (routes.find(r => r.id === selectedRouteId)?.name || 'Route') : t('deliveries.allRoutes')}
              </Text>
              <ChevronRight size={15} color={COLORS.textPlaceholder} style={{ marginLeft: 'auto', transform: [{ rotate: '90deg' }] }} />
            </TouchableOpacity>
          </View>

          {/* Generate Button */}
          <TouchableOpacity 
            style={styles.generateBtnThick} 
            onPress={handleGenerateDeliveries}
            disabled={generating}
            activeOpacity={0.7}
          >
            {generating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <FileText size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.generateBtnTextThick}>Generate Deliveries</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.deliveriesContainer}>
            {loadingDeliveries ? (
              renderDeliverySkeleton()
            ) : deliveries.length === 0 ? (
              <View style={styles.emptyCard}>
                <Truck size={48} color={COLORS.textPlaceholder} style={{ marginBottom: 16 }} />
                <Text style={styles.emptyTitle}>{t('deliveries.emptyDeliveries')}</Text>
                <Text style={styles.emptySubtitle}>{t('deliveries.emptyDeliveriesSub')}</Text>
              </View>
            ) : (
              deliveries.map((delivery) => (
                <DeliveryCard 
                  key={delivery.id} 
                  delivery={delivery} 
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
                <Text style={styles.modalTitle}>Select Route</Text>
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
                    All Routes
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



      {showDatePicker && (
        <DateTimePicker
          value={parseDateString(selectedDate)}
          mode="date"
          display="default"
          onChange={onDateChange}
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
  contentWrapper: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 24 : 16,
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
    paddingBottom: 40,
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
    backgroundColor: '#1D4ED8',
    height: 52,
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  generateBtnTextThick: {
    fontSize: 15,
    fontFamily: 'Geologica-Bold',
    color: '#FFFFFF',
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
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  sliderUnitDelivered: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
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
    paddingHorizontal: 0,
    paddingVertical: 14,
  },
  deliveryCardEditing: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  bottomDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 20,
    marginBottom: 6,
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
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editToggleText: {
    fontSize: 12,
    fontFamily: 'Geologica-Bold',
    color: COLORS.primary,
    marginLeft: 4,
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
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
});

export default OrdersScreen;
