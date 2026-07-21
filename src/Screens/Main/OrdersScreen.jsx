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
  TextInput
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Truck, Package, CheckCircle, XCircle, ChevronRight, X, Play, Calendar, MapPin
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
  const insets = useSafeAreaInsets();

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
        fetchDeliveries(selectedDate); // refresh list
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
      case 'delivered': return { bg: COLORS.successLight, text: COLORS.success };
      case 'skipped': return { bg: COLORS.dangerLight, text: COLORS.danger };
      default: return { bg: COLORS.warningLight, text: COLORS.warning };
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
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right', 'top']}>
      
      {/* Header */}
      <View style={styles.headerContainer}>
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
          >
            <MapPin size={14} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.filterDropdownText} numberOfLines={1}>
              {selectedRouteId ? (routes.find(r => r.id === selectedRouteId)?.name || 'Route') : t('deliveries.allRoutes')}
            </Text>
            <ChevronRight size={14} color={COLORS.textSecondary} style={{ marginLeft: 'auto', transform: [{ rotate: '90deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterDropdown, { marginLeft: 12 }]} 
            onPress={() => setActiveFilterModal('status')}
          >
            <Text style={styles.filterDropdownText}>
              {selectedStatus === 'all' ? t('deliveries.allStatus') : t('deliveries.' + selectedStatus)}
            </Text>
            <ChevronRight size={14} color={COLORS.textSecondary} style={{ marginLeft: 'auto', transform: [{ rotate: '90deg' }] }} />
          </TouchableOpacity>
        </View>

        {/* Deliveries Actions Row */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t('deliveries.taskList')}</Text>
          <TouchableOpacity 
            style={styles.generateBtn} 
            onPress={handleGenerateDeliveries}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <Play size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                <Text style={styles.generateBtnText}>{t('deliveries.generate')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.deliveriesContainer}>
          {loadingDeliveries ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : deliveries.length === 0 ? (
            <View style={styles.emptyCard}>
              <Truck size={40} color={COLORS.textPlaceholder} style={{ marginBottom: 12 }} />
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
                      <View style={styles.deliveryHeader}>
                        <View style={styles.deliveryCustomerInfo}>
                          <Text style={styles.deliveryCustomerName} numberOfLines={1}>
                            {delivery.Customer?.name || 'Unknown'}
                          </Text>
                          <Text style={styles.deliveryAddress} numberOfLines={1}>
                            {delivery.Customer?.address || 'No address'}
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                          <Text style={[styles.statusText, { color: statusColors.text }]}>
                            {delivery.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.deliveryDivider} />
                      
                      <View style={styles.deliveryFooter}>
                        <View style={styles.deliveryProductInfo}>
                          <Package size={14} color={COLORS.textPlaceholder} style={{ marginRight: 6 }} />
                          <Text style={styles.deliveryProductName} numberOfLines={1}>
                            {delivery.Subscription?.Product?.name || 'Product'}
                          </Text>
                        </View>
                        <Text style={styles.deliveryQty}>
                          {t('oneTimeOrders.qty')}: {delivery.Subscription?.baseQuantity || 0}
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

      {/* Update Delivery Modal */}
      {selectedDelivery && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedDelivery(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('deliveries.statusFilter')}</Text>
                <TouchableOpacity onPress={() => setSelectedDelivery(null)}>
                  <X size={24} color={COLORS.textPlaceholder} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalSubtitle}>
                {selectedDelivery.Customer?.name} - {selectedDelivery.Subscription?.Product?.name}
              </Text>

              <Text style={styles.inputLabel}>{t('products.status')}</Text>
              <View style={styles.statusRow}>
                {['pending', 'delivered', 'skipped'].map(st => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusOption, updateStatus === st && styles.statusOptionActive]}
                    onPress={() => setUpdateStatus(st)}
                  >
                    <Text style={[styles.statusOptionText, updateStatus === st && styles.statusOptionTextActive]}>
                      {t('deliveries.' + st)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>{t('deliveries.fullDelivered')}</Text>
              <TextInput
                style={styles.textInput}
                value={fullUnits}
                onChangeText={setFullUnits}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>{t('deliveries.emptyCollected')}</Text>
              <TextInput
                style={styles.textInput}
                value={emptyUnits}
                onChangeText={setEmptyUnits}
                keyboardType="numeric"
              />

              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleUpdateSubmit}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>{t('deliveries.saveChanges')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
                  <X size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView>
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
                  <X size={24} color={COLORS.textSecondary} />
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
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  calendarCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    color: COLORS.primary,
    marginBottom: 0,
  },
  calendarIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
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
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },
  dayItemSelected: {
    backgroundColor: COLORS.primary,
  },
  dayName: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  dayNameSelected: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  dayNumberCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.surfaceMuted,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
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
  deliveriesContainer: {
    marginBottom: 24,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  deliveryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  deliveryCustomerInfo: {
    flex: 1,
    marginRight: 12,
  },
  deliveryCustomerName: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  deliveryAddress: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  deliveryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  deliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryProductInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deliveryProductName: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
  },
  deliveryQty: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    color: COLORS.primary,
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
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 12,
  },
  statusOptionActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  statusOptionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
  },
  statusOptionTextActive: {
    color: COLORS.primary,
    fontFamily: 'Inter-Bold',
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  filtersRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  filterDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    height: 44,
    paddingHorizontal: 12,
  },
  filterDropdownText: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
    flex: 1,
  },
  routeGroup: {
    marginBottom: 24,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  routeTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  routeBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  routeBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    color: COLORS.primary,
  },
  filterModalContent: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  filterModalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterModalItemText: {
    fontSize: 14.5,
    fontFamily: 'Inter-Medium',
    color: COLORS.textPrimary,
  },
});

export default OrdersScreen;
