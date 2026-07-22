import React, { useState, useContext, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Truck, Package, CheckCircle, XCircle, ChevronRight, X, Play, Calendar, MapPin, AlertCircle
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

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

const OrdersScreen = () => {
  const { t } = useTranslation();
  const { userToken } = useContext(AuthContext);

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
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('delivered');
  const [fullUnits, setFullUnits] = useState('0');
  const [emptyUnits, setEmptyUnits] = useState('0');
  const [updating, setUpdating] = useState(false);

  // Filters State
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeFilterModal, setActiveFilterModal] = useState(null); // 'route' | 'status' | null

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

  const fetchDeliveries = async (dateStr, routeId = '', status = '') => {
    setLoadingDeliveries(true);
    try {
      const statusParam = status === 'all' ? '' : status;
      const res = await api.listDeliveries(userToken, dateStr, routeId, statusParam);
      if (res.success) {
        setDeliveries(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching deliveries:', err);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  useEffect(() => {
    if (userToken) {
      fetchDeliveries(selectedDate, selectedRouteId, selectedStatus);
    }
  }, [selectedDate, selectedRouteId, selectedStatus, userToken]);

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
        Alert.alert('Success', res.message || 'Deliveries generated successfully.');
        fetchDeliveries(selectedDate);
      } else {
        Alert.alert('Notice', res.message || 'Could not generate deliveries.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'An error occurred');
    } finally {
      setGenerating(false);
    }
  };

  const openUpdateModal = (delivery) => {
    setSelectedDelivery(delivery);
    setUpdateStatus(delivery.status === 'pending' ? 'delivered' : delivery.status);
    setFullUnits(delivery.fullUnitsDelivered?.toString() || delivery.Subscription?.baseQuantity?.toString() || '0');
    setEmptyUnits(delivery.emptyUnitsCollected?.toString() || '0');
  };

  const handleUpdateSubmit = async () => {
    setUpdating(true);
    try {
      const data = {
        status: updateStatus,
        fullUnitsDelivered: parseInt(fullUnits) || 0,
        emptyUnitsCollected: parseInt(emptyUnits) || 0
      };
      const res = await api.updateDeliveryStatus(userToken, selectedDelivery.id, data);
      if (res.success) {
        setSelectedDelivery(null);
        fetchDeliveries(selectedDate);
      } else {
        Alert.alert('Error', res.message || 'Failed to update delivery');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setUpdating(false);
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
          <Text style={styles.headerTitle}>{t('deliveries.title')}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Calendar Card Section */}
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>
                {new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowDatePicker(true)}
                style={styles.calendarIconBtn}
                activeOpacity={0.7}
              >
                <Calendar size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarStrip}>
              {calendarDays.map((day, index) => {
                const isSelected = selectedDate === day.fullDate;
                return (
                  <TouchableOpacity 
                    key={index}
                    activeOpacity={0.8}
                    style={[styles.dayItem, isSelected && styles.dayItemSelected]}
                    onPress={() => setSelectedDate(day.fullDate)}
                  >
                    <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>{day.dayName}</Text>
                    <View style={[styles.dayNumberCircle, isSelected && styles.dayNumberCircleSelected]}>
                      <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>{day.dayNumber}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Filters Row */}
          <View style={styles.filtersRow}>
            <TouchableOpacity 
              style={styles.filterDropdown} 
              onPress={() => setActiveFilterModal('route')}
              activeOpacity={0.7}
            >
              <MapPin size={15} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.filterDropdownText} numberOfLines={1}>
                {selectedRouteId ? (routes.find(r => r.id === selectedRouteId)?.name || 'Route') : t('deliveries.allRoutes')}
              </Text>
              <ChevronRight size={15} color={COLORS.textPlaceholder} style={{ marginLeft: 6, transform: [{ rotate: '90deg' }] }} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.filterDropdown, { marginLeft: 10 }]} 
              onPress={() => setActiveFilterModal('status')}
              activeOpacity={0.7}
            >
              <Text style={styles.filterDropdownText} numberOfLines={1}>
                {selectedStatus === 'all' ? t('deliveries.allStatus') : t('deliveries.' + selectedStatus)}
              </Text>
              <ChevronRight size={15} color={COLORS.textPlaceholder} style={{ marginLeft: 6, transform: [{ rotate: '90deg' }] }} />
            </TouchableOpacity>
          </View>

          {/* Deliveries Actions Row */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('deliveries.taskList')}</Text>
            <TouchableOpacity 
              style={styles.generateBtn} 
              onPress={handleGenerateDeliveries}
              disabled={generating}
              activeOpacity={0.7}
            >
              {generating ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Play size={13} color={COLORS.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.generateBtnText}>{t('deliveries.generate')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.deliveriesContainer}>
            {loadingDeliveries ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading deliveries...</Text>
              </View>
            ) : deliveries.length === 0 ? (
              <View style={styles.emptyCard}>
                <Truck size={48} color={COLORS.textPlaceholder} style={{ marginBottom: 16 }} />
                <Text style={styles.emptyTitle}>{t('deliveries.emptyDeliveries')}</Text>
                <Text style={styles.emptySubtitle}>{t('deliveries.emptyDeliveriesSub')}</Text>
              </View>
            ) : (
              getGroupedDeliveries().map((group, groupIdx) => (
                <View key={groupIdx} style={styles.routeGroup}>
                  <View style={styles.routeHeader}>
                    <Text style={styles.routeTitle}>{group.routeName.toUpperCase()}</Text>
                    <View style={styles.routeBadge}>
                      <Text style={styles.routeBadgeText}>{group.items.length} {t('deliveries.trips')}</Text>
                    </View>
                  </View>

                  {group.items.map((delivery) => {
                    const statusColors = getStatusColor(delivery.status);
                    return (
                      <TouchableOpacity 
                        key={delivery.id} 
                        style={styles.deliveryCard}
                        activeOpacity={0.7}
                        onPress={() => openUpdateModal(delivery)}
                      >
                        <View style={styles.cardHeader}>
                          <View style={styles.iconBox}>
                            <Truck size={22} color={COLORS.primary} />
                          </View>
                          <View style={styles.titleContainer}>
                            <Text style={styles.customerName} numberOfLines={1}>
                              {delivery.Customer?.name || 'Unknown Customer'}
                            </Text>
                            <Text style={styles.subText} numberOfLines={1}>
                              {delivery.Customer?.address || 'No address provided'}
                            </Text>
                          </View>
                          <View style={styles.statusBadge}>
                            <View style={[styles.statusDot, { backgroundColor: statusColors.dot }]} />
                            <Text style={[styles.statusText, { color: statusColors.text }]}>
                              {delivery.status.toUpperCase()}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.cardFooter}>
                          <View style={styles.metaContainer}>
                            <Package size={14} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
                            <Text style={styles.metaText} numberOfLines={1}>
                              {delivery.Subscription?.Product?.name || 'Product'}
                            </Text>
                          </View>
                          <Text style={styles.qtyText}>
                            Qty: {delivery.Subscription?.baseQuantity || 0}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))
            )}
          </View>

        </ScrollView>
      </View>

      {/* Update Delivery Modal */}
      {selectedDelivery && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedDelivery(null)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedDelivery(null)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update Delivery</Text>
                <TouchableOpacity onPress={() => setSelectedDelivery(null)}>
                  <X size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalSubtitle}>
                {selectedDelivery.Customer?.name} • {selectedDelivery.Subscription?.Product?.name || 'Item'}
              </Text>

              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusRow}>
                {['pending', 'delivered', 'skipped'].map(st => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusOption, updateStatus === st && styles.statusOptionActive]}
                    onPress={() => setUpdateStatus(st)}
                  >
                    <Text style={[styles.statusOptionText, updateStatus === st && styles.statusOptionTextActive]}>
                      {st.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>{t('deliveries.fullDelivered')}</Text>
              <View style={styles.inputContainer}>
                <Package size={18} color={COLORS.textPlaceholder} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.textInput}
                  value={fullUnits}
                  onChangeText={setFullUnits}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>

              <Text style={styles.inputLabel}>{t('deliveries.emptyCollected')}</Text>
              <View style={styles.inputContainer}>
                <Package size={18} color={COLORS.textPlaceholder} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.textInput}
                  value={emptyUnits}
                  onChangeText={setEmptyUnits}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>

              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleUpdateSubmit}
                disabled={updating}
                activeOpacity={0.85}
              >
                {updating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>{t('deliveries.saveChanges')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

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
                  <Text style={[styles.filterModalItemText, !selectedRouteId && { color: COLORS.primary, fontFamily: 'Inter-Bold' }]}>
                    All Routes
                  </Text>
                </TouchableOpacity>
                {routes.map((r) => (
                  <TouchableOpacity 
                    key={r.id}
                    style={styles.filterModalItem} 
                    onPress={() => { setSelectedRouteId(r.id); setActiveFilterModal(null); }}
                  >
                    <Text style={[styles.filterModalItemText, selectedRouteId === r.id && { color: COLORS.primary, fontFamily: 'Inter-Bold' }]}>
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
                <Text style={styles.modalTitle}>Select Status</Text>
                <TouchableOpacity onPress={() => setActiveFilterModal(null)}>
                  <X size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              {['all', 'pending', 'delivered', 'skipped'].map((statusOption) => (
                <TouchableOpacity 
                  key={statusOption}
                  style={styles.filterModalItem} 
                  onPress={() => { setSelectedStatus(statusOption); setActiveFilterModal(null); }}
                >
                  <Text style={[styles.filterModalItemText, selectedStatus === statusOption && { color: COLORS.primary, fontFamily: 'Inter-Bold' }]}>
                    {statusOption === 'all' ? 'All Status' : statusOption.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
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
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
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
    fontFamily: 'Inter-Bold',
    color: COLORS.primary,
  },
  calendarIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarStrip: {
    paddingRight: 10,
  },
  dayItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 72,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayItemSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayName: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  dayNameSelected: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  dayNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumberCircleSelected: {
    backgroundColor: '#FFFFFF',
  },
  dayNumber: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
  },
  dayNumberSelected: {
    color: COLORS.primary,
  },
  filtersRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  filterDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 46,
    paddingHorizontal: 12,
  },
  filterDropdownText: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
    flex: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  generateBtnText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: COLORS.primary,
  },
  loadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
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
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
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
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  routeBadge: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  routeBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    color: COLORS.primary,
  },
  deliveryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    backgroundColor: '#EEF2FF',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  titleContainer: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
  },
  subText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Medium',
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
    fontFamily: 'Inter-Bold',
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
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  qtyText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: COLORS.primary,
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
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
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
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  statusOptionText: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
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
    fontFamily: 'Inter-Medium',
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
    fontFamily: 'Inter-Bold',
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
    fontFamily: 'Inter-Medium',
    color: COLORS.textPrimary,
  },
});

export default OrdersScreen;
