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
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Truck,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  X,
  Check,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { api } from '../../services/api';

const PastDeliveriesScreen = () => {
  const navigation = useNavigation();
  const { userToken } = useContext(AuthContext);
  const { showAlert } = useAlert();

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
  const handleUpdateStatus = async (deliveryId, newStatus) => {
    if (String(deliveryId).startsWith('preview-')) {
      showAlert('Notice', 'Status updates are disabled for future preview deliveries.', 'info');
      return;
    }

    setActionLoadingId(deliveryId);
    try {
      const res = await api.updateDeliveryStatus(userToken, deliveryId, { status: newStatus });
      if (res && res.success) {
        showAlert('Success', `Delivery marked as ${newStatus}`, 'success');
        fetchTrackingData();
      } else {
        showAlert('Error', res.message || 'Failed to update delivery status', 'error');
      }
    } catch (err) {
      showAlert('Error', err.message || 'Something went wrong', 'error');
    } finally {
      setActionLoadingId(null);
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Past Deliveries</Text>
      </View>

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

          <TouchableOpacity style={styles.dateNavBtn} onPress={handleNextDay} activeOpacity={0.7}>
            <ChevronRight size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={new Date(selectedDate)}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
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
              {selectedRouteId ? (routes.find(r => r.id === selectedRouteId)?.name || 'Route') : 'All Routes'}
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

        {/* 4 Summary Stat Cards (Exact Overview Design) */}
        <View style={styles.statsGrid}>
          <View style={styles.overviewStyleStatCard}>
            <Text style={styles.overviewStatTitle}>Total Orders</Text>
            <Text style={styles.overviewStatValue}>{counts.total || 0}</Text>
          </View>

          <View style={styles.overviewStyleStatCard}>
            <Text style={styles.overviewStatTitle}>Completed</Text>
            <Text style={styles.overviewStatValue}>{counts.delivered || 0}</Text>
          </View>

          <View style={styles.overviewStyleStatCard}>
            <Text style={styles.overviewStatTitle}>Pending</Text>
            <Text style={styles.overviewStatValue}>{counts.pending || 0}</Text>
          </View>

          <View style={styles.overviewStyleStatCard}>
            <Text style={styles.overviewStatTitle}>Skipped</Text>
            <Text style={styles.overviewStatValue}>{counts.skipped || 0}</Text>
          </View>
        </View>

        {/* Deliveries Data Section */}
        <Text style={styles.sectionTitle}>Delivery Records ({deliveries.length})</Text>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading delivery records...</Text>
          </View>
        ) : deliveries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Truck size={40} color={COLORS.textPlaceholder} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No deliveries found</Text>
            <Text style={styles.emptySubtitle}>No records match the selected date and filters.</Text>
          </View>
        ) : (
          deliveries.map((item, idx) => {
            const isPreview = String(item.id).startsWith('preview-');
            const statusBadge = getStatusBadge(item.status, isPreview);
            const customerName = item.Customer?.name || 'Unknown Customer';
            const phone = item.Customer?.phone || '';
            const address = item.Customer?.address || '';
            const productName = item.Subscription?.Product?.name || item.Product?.name || 'Water Can 20L';

            const expectedUnits = item.expectedSubscriptionUnits || item.expectedAddonUnits || 1;
            const fullDelivered = item.fullUnitsDelivered || 0;
            const emptyCollected = item.emptyUnitsCollected || 0;

            return (
              <View key={item.id || idx} style={styles.deliveryCard}>
                {/* Card Top Row */}
                <View style={styles.cardTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customerNameText}>{customerName}</Text>
                    {!!phone && (
                      <View style={styles.infoRow}>
                        <Phone size={12} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                        <Text style={styles.infoText}>{phone}</Text>
                      </View>
                    )}
                  </View>

                  <View style={[styles.statusBadgePill, { backgroundColor: statusBadge.bg, borderColor: statusBadge.border }]}>
                    <Text style={[styles.statusBadgeText, { color: statusBadge.text }]}>
                      {statusBadge.label}
                    </Text>
                  </View>
                </View>

                {!!address && (
                  <View style={[styles.infoRow, { marginTop: 4 }]}>
                    <MapPin size={12} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={styles.infoText} numberOfLines={2}>{address}</Text>
                  </View>
                )}

                <View style={styles.cardDivider} />

                {/* Product & Qty Row */}
                <View style={styles.productDetailsRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productNameText}>{productName}</Text>
                    <Text style={styles.expectedQtyText}>Expected Qty: {expectedUnits}</Text>
                  </View>

                  <View style={styles.qtyStatsGroup}>
                    <View style={styles.qtyStatBox}>
                      <Text style={styles.qtyStatLabel}>Delivered</Text>
                      <Text style={[styles.qtyStatValue, { color: COLORS.primary }]}>{fullDelivered}</Text>
                    </View>

                    <View style={styles.qtyStatBox}>
                      <Text style={styles.qtyStatLabel}>Empty Ret.</Text>
                      <Text style={[styles.qtyStatValue, { color: COLORS.textSecondary }]}>{emptyCollected}</Text>
                    </View>
                  </View>
                </View>

                {/* Status Update Actions for Pending Non-Preview Deliveries */}
                {item.status === 'pending' && !isPreview && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnSuccess]}
                      onPress={() => handleUpdateStatus(item.id, 'delivered')}
                      disabled={actionLoadingId === item.id}
                      activeOpacity={0.8}
                    >
                      {actionLoadingId === item.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Check size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.actionBtnText}>Mark Delivered</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnDanger]}
                      onPress={() => handleUpdateStatus(item.id, 'skipped')}
                      disabled={actionLoadingId === item.id}
                      activeOpacity={0.8}
                    >
                      <X size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.actionBtnText}>Mark Skipped</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {isPreview && (
                  <View style={styles.previewNoticeRow}>
                    <Eye size={13} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.previewNoticeText}>Future Preview • Status updates disabled</Text>
                  </View>
                )}
              </View>
            );
          })
        )}

      </ScrollView>

      {/* Filter Modals */}
      {activeFilterModal === 'route' && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setActiveFilterModal(null)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setActiveFilterModal(null)}>
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

      {activeFilterModal === 'status' && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setActiveFilterModal(null)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setActiveFilterModal(null)}>
            <View style={styles.filterModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Status</Text>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
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
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
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
    fontSize: 11,
    fontFamily: 'Geologica-Medium',
    color: COLORS.primary,
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
