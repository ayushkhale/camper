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
  Truck, Package, CheckCircle, XCircle, ChevronRight, X, Play
} from 'lucide-react-native';
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

  const fetchDeliveries = async (dateStr) => {
    setLoadingDeliveries(true);
    try {
      const res = await api.listDeliveries(userToken, dateStr);
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
      fetchDeliveries(selectedDate);
    }
  }, [selectedDate, userToken]);

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

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right', 'top']}>
      
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Daily Deliveries</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Calendar Card Section */}
        <View style={styles.calendarCard}>
          <Text style={styles.calendarTitle}>
            {new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          
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

        {/* Deliveries Actions Row */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Task List</Text>
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
                <Text style={styles.generateBtnText}>Generate</Text>
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
              <Text style={styles.emptyTitle}>No Deliveries</Text>
              <Text style={styles.emptySubtitle}>Click generate if you've added new subscriptions recently.</Text>
            </View>
          ) : (
            deliveries.map((delivery) => {
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
                      Qty: {delivery.Subscription?.baseQuantity || 0}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            })
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
                <Text style={styles.modalTitle}>Update Delivery</Text>
                <TouchableOpacity onPress={() => setSelectedDelivery(null)}>
                  <X size={24} color={COLORS.textPlaceholder} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalSubtitle}>
                {selectedDelivery.Customer?.name} - {selectedDelivery.Subscription?.Product?.name}
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
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Full Units Delivered</Text>
              <TextInput
                style={styles.textInput}
                value={fullUnits}
                onChangeText={setFullUnits}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Empty Units Collected</Text>
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
                  <Text style={styles.submitBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    fontFamily: 'Poppins-Bold',
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
  calendarTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: COLORS.primary,
    marginBottom: 16,
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
    fontFamily: 'Poppins-Medium',
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
    fontFamily: 'Poppins-Bold',
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
    fontFamily: 'Poppins-Bold',
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
    fontFamily: 'Poppins-Bold',
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
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
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
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  deliveryAddress: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
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
    fontFamily: 'Poppins-Medium',
    color: COLORS.textSecondary,
  },
  deliveryQty: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
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
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
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
    fontFamily: 'Poppins-Medium',
    color: COLORS.textSecondary,
  },
  statusOptionTextActive: {
    color: COLORS.primary,
    fontFamily: 'Poppins-Bold',
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
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
    fontFamily: 'Poppins-Bold',
  }
});

export default OrdersScreen;
