import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Platform,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Alert
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, ChevronDown, Filter, X, MapPin, User, Calendar as CalendarIcon, CheckCircle, IndianRupee, Package, AlertCircle } from 'lucide-react-native';
import CurvedHeader from '../../components/CurvedHeader';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';

// Placeholder imports for child components
import FinancialReport from '../../components/reports/FinancialReport';
import OutstandingReport from '../../components/reports/OutstandingReport';
import OperationsReport from '../../components/reports/OperationsReport';
import InventoryReport from '../../components/reports/InventoryReport';

const PRESETS = [
  { id: '7_days', label: 'Last 7 Days' },
  { id: 'last_week', label: 'Last Week' },
  { id: '15_days', label: 'Last 15 Days' },
  { id: '30_days', label: 'Last 30 Days' },
  { id: 'last_month', label: 'Last Month' },
  { id: '3_months', label: 'Last 3 Months' },
  { id: 'custom', label: 'Custom Range' },
];

const TABS = [
  { id: 'financials', label: 'Financials', icon: IndianRupee },
  { id: 'outstanding', label: 'Outstanding', icon: AlertCircle },
  { id: 'operations', label: 'Operations', icon: CheckCircle },
  { id: 'inventory', label: 'Inventory', icon: Package },
];

const ReportsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { userToken } = useContext(AuthContext);

  // Filters State
  const [activeTab, setActiveTab] = useState('financials');
  const [rangePreset, setRangePreset] = useState('7_days');
  const [routeId, setRouteId] = useState('');
  const [staffId, setStaffId] = useState('');
  
  // Custom dates
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  const [customFrom, setCustomFrom] = useState(todayStr);
  const [customTo, setCustomTo] = useState(tomorrowStr);
  const [activeDatePicker, setActiveDatePicker] = useState(null); // 'from' | 'to' | null

  // Dropdown Data
  const [routes, setRoutes] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(true);

  // Modals
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeSelect, setActiveSelect] = useState(null); // 'preset', 'route', 'staff'

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      const [routeRes, staffRes] = await Promise.all([
        api.listRoutes(userToken),
        api.listStaff(userToken)
      ]);
      if (routeRes.success) setRoutes(routeRes.data || []);
      if (staffRes.success) setStaffList(staffRes.data || []);
    } catch (err) {
      console.log('Error fetching filters:', err);
    } finally {
      setLoadingFilters(false);
    }
  };

  const getPresetLabel = () => {
    if (rangePreset === 'custom') return 'Custom Range';
    const preset = PRESETS.find(p => p.id === rangePreset);
    return preset ? preset.label : 'Select Date';
  };

  const getRouteLabel = () => {
    if (!routeId) return 'All Routes';
    const route = routes.find(r => String(r.id) === String(routeId));
    return route ? route.name : 'All Routes';
  };

  const getStaffLabel = () => {
    if (!staffId) return 'All Staff';
    const staff = staffList.find(s => String(s.id) === String(staffId));
    return staff ? staff.name : 'All Staff';
  };

  const renderActiveTab = () => {
    const filters = { rangePreset, routeId, staffId };
    if (rangePreset === 'custom') {
      filters.from = customFrom;
      filters.to = customTo;
    }
    switch (activeTab) {
      case 'financials': return <FinancialReport filters={filters} />;
      case 'outstanding': return <OutstandingReport filters={filters} />;
      case 'operations': return <OperationsReport filters={filters} />;
      case 'inventory': return <InventoryReport filters={filters} />;
      default: return null;
    }
  };

  const formatDateString = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const parseDateString = (str) => {
    if (!str) return new Date();
    const [year, month, day] = str.split('-').map(Number);
    if (year && month && day) {
      return new Date(year, month - 1, day);
    }
    return new Date();
  };

  const onDatePickerChange = (event, selectedDate) => {
    const pickerType = activeDatePicker;
    setActiveDatePicker(null);
    if (event.type === 'set' && selectedDate) {
      const formatted = formatDateString(selectedDate);
      
      if (pickerType === 'from') {
        let newToDate = customTo;
        if (formatted >= customTo) {
          // auto push 'to' date to be at least 1 day after 'from'
          const nextDay = new Date(selectedDate);
          nextDay.setDate(nextDay.getDate() + 1);
          newToDate = formatDateString(nextDay);
          setCustomTo(newToDate);
        }
        
        const diffDays = (parseDateString(newToDate).getTime() - parseDateString(formatted).getTime()) / (1000 * 3600 * 24);
        if (diffDays > 90) {
          Alert.alert('Invalid Range', 'Custom date range cannot exceed 90 days.');
          return;
        }
        setCustomFrom(formatted);
      } else if (pickerType === 'to') {
        if (formatted <= customFrom) {
          Alert.alert('Invalid Range', 'End date must be strictly after Start date.');
          return;
        }
        const diffDays = (parseDateString(formatted).getTime() - parseDateString(customFrom).getTime()) / (1000 * 3600 * 24);
        if (diffDays > 90) {
          Alert.alert('Invalid Range', 'Custom date range cannot exceed 90 days.');
          return;
        }
        setCustomTo(formatted);
      }
    }
  };

  const formatDisplayDate = (str) => {
    if (!str) return '';
    const [year, month, day] = str.split('-');
    return `${day}/${month}/${year}`;
  };

  const renderSelectModal = () => {
    let title = '';
    let options = [];
    let onSelect = () => {};
    let currentValue = '';

    if (activeSelect === 'preset') {
      title = 'Select Date Range';
      options = PRESETS;
      currentValue = rangePreset;
      onSelect = (val) => { setRangePreset(val); setFilterModalVisible(false); };
    } else if (activeSelect === 'route') {
      title = 'Select Route';
      options = [{ id: '', label: 'All Routes' }, ...routes.map(r => ({ id: r.id, label: r.name }))];
      currentValue = routeId;
      onSelect = (val) => { setRouteId(val); setFilterModalVisible(false); };
    } else if (activeSelect === 'staff') {
      title = 'Select Staff';
      options = [{ id: '', label: 'All Staff' }, ...staffList.map(s => ({ id: s.id, label: s.name }))];
      currentValue = staffId;
      onSelect = (val) => { setStaffId(val); setFilterModalVisible(false); };
    }

    return (
      <Modal visible={filterModalVisible} transparent animationType="fade" onRequestClose={() => setFilterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((opt) => {
                const isSelected = String(opt.id) === String(currentValue);
                return (
                  <TouchableOpacity
                    key={String(opt.id)}
                    style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                    onPress={() => onSelect(opt.id)}
                  >
                    <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <CurvedHeader
        title="Business Reports"
        leftIcon={<ChevronLeft size={28} color="#FFF" />}
        onLeftPress={() => navigation.goBack()}
        height={110}
        contentStyle={{ paddingTop: Platform.OS === 'ios' ? 40 : 20, paddingBottom: 15 }}
      />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <TouchableOpacity 
                key={tab.id} 
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.8}
                style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
              >
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Icon size={16} color={isSelected ? '#FFF' : '#64748B'} style={{ marginRight: 6 }} />
                  <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Global Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {activeTab !== 'outstanding' && (
            <TouchableOpacity 
              style={styles.filterPill}
              onPress={() => { setActiveSelect('preset'); setFilterModalVisible(true); }}
            >
              <CalendarIcon size={14} color={COLORS.primary} style={styles.filterIcon} />
              <Text style={styles.filterText}>{getPresetLabel()}</Text>
              <ChevronDown size={14} color={COLORS.textPlaceholder} style={{marginLeft: 4}} />
            </TouchableOpacity>
          )}

          {activeTab !== 'outstanding' && rangePreset === 'custom' && (
            <>
              <TouchableOpacity 
                style={styles.filterPill}
                onPress={() => setActiveDatePicker('from')}
              >
                <Text style={styles.filterText}>Fr: {formatDisplayDate(customFrom)}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.filterPill}
                onPress={() => setActiveDatePicker('to')}
              >
                <Text style={styles.filterText}>To: {formatDisplayDate(customTo)}</Text>
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity 
            style={styles.filterPill}
            onPress={() => { setActiveSelect('route'); setFilterModalVisible(true); }}
          >
            <MapPin size={14} color={COLORS.primary} style={styles.filterIcon} />
            <Text style={styles.filterText}>{getRouteLabel()}</Text>
            <ChevronDown size={14} color={COLORS.textPlaceholder} style={{marginLeft: 4}} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.filterPill}
            onPress={() => { setActiveSelect('staff'); setFilterModalVisible(true); }}
          >
            <User size={14} color={COLORS.primary} style={styles.filterIcon} />
            <Text style={styles.filterText}>{getStaffLabel()}</Text>
            <ChevronDown size={14} color={COLORS.textPlaceholder} style={{marginLeft: 4}} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {renderActiveTab()}
      </View>

      {renderSelectModal()}

      {activeDatePicker !== null && (
        <DateTimePicker
          value={activeDatePicker === 'from' ? parseDateString(customFrom) : parseDateString(customTo)}
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
    backgroundColor: COLORS.background,
  },
  tabContainer: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 10,
    backgroundColor: '#F8FAFC',
  },
  tabBtnActive: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Geologica-Medium',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFF',
    fontFamily: 'Geologica-Bold',
  },
  filterContainer: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 10,
  },
  filterIcon: {
    marginRight: 6,
  },
  filterText: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPrimary,
  },
  body: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalOptionSelected: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderBottomWidth: 0,
    paddingHorizontal: 12,
  },
  modalOptionText: {
    fontSize: 15,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
  },
  modalOptionTextSelected: {
    color: COLORS.primary,
    fontFamily: 'Geologica-Bold',
  },
});

export default ReportsScreen;
