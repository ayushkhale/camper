import React, { useState, useEffect, useCallback, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Plus, Search, Trash2, Edit2, User, Phone, Mail, AlertCircle , ArrowLeft} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import CurvedHeader from '../../components/CurvedHeader';
import LinearGradient from 'react-native-linear-gradient';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const StaffManagementScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { userToken } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const [staffList, setStaffList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.listStaff(userToken);
      if (response && response.success) {
        setStaffList(response.data || []);
      } else {
        setError(t('common.error') || 'Failed to load staff');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [userToken, t]);

  useFocusEffect(
    useCallback(() => {
      fetchStaff();
    }, [fetchStaff])
  );

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredList(staffList);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = staffList.filter(item => 
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.phone && item.phone.includes(query)) ||
      (item.email && item.email.toLowerCase().includes(query))
    );
    setFilteredList(filtered);
  }, [searchQuery, staffList]);

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'active' ? 'inactive' : 'active';
    setActionLoadingId(item.id);
    
    const previousList = [...staffList];
    setStaffList(prev => 
      prev.map(staff => staff.id === item.id ? { ...staff, status: nextStatus } : staff)
    );

    try {
      await api.updateStaff(userToken, item.id, { status: nextStatus });
      showAlert('Success', `Staff ${nextStatus === 'active' ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch (err) {
      setStaffList(previousList);
      showAlert('Error', err.message || 'Failed to update status', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteStaff = (item) => {
    showAlert(
      t('staff.remove'),
      `${t('staff.removeConfirm')}\n\n${t('customers.name')}: ${item.name}`,
      [
        { text: t('staff.cancel'), style: 'cancel' },
        { 
          text: t('staff.deleteBtn'), 
          style: 'destructive',
          onPress: async () => {
            setActionLoadingId(item.id);
            try {
              const res = await api.deleteStaff(userToken, item.id);
              if (res && res.success) {
                showAlert('Success', t('staff.removeSuccess') || 'Staff removed successfully', 'success');
                setStaffList(prev => prev.filter(staff => staff.id !== item.id));
              } else {
                showAlert('Error', res.message || 'Failed to remove staff', 'error');
              }
            } catch (err) {
              showAlert('Error', err.message || 'Failed to remove staff', 'error');
            } finally {
              setActionLoadingId(null);
            }
          }
        }
      ]
    );
  };

  const renderStaffCard = ({ item }) => {
    const isUpdating = actionLoadingId === item.id;
    const isActive = item.status === 'active';
    const initials = getInitials(item.name);

    return (
      <LinearGradient 
        colors={isActive ? ['#FFFFFF', '#F4F7FA'] : ['#F8FAFC', '#F1F5F9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.card, !isActive && styles.cardInactive]}
      >
        <View style={styles.cardHeader}>
          {/* Avatar */}
          <LinearGradient
            colors={isActive ? ['#0B409C', '#3B82F6'] : ['#94A3B8', '#CBD5E1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={[styles.avatarText, { color: '#FFFFFF' }]}>{initials}</Text>
          </LinearGradient>
          
          {/* Staff Info */}
          <View style={styles.infoContainer}>
            <Text style={[styles.staffName, !isActive && styles.textMuted]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.detailRow}>
              <Phone size={12} color={COLORS.textSecondary} style={styles.detailIcon} />
              <Text style={styles.detailText}>{item.phone}</Text>
            </View>
            {item.email ? (
              <View style={styles.detailRow}>
                <Mail size={12} color={COLORS.textSecondary} style={styles.detailIcon} />
                <Text style={styles.detailText} numberOfLines={1}>{item.email}</Text>
              </View>
            ) : null}
          </View>

          {/* Status Switch */}
          <View style={styles.switchContainer}>
            {isUpdating ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Switch
                value={isActive}
                onValueChange={() => handleToggleStatus(item)}
                trackColor={{ false: COLORS.border, true: COLORS.success }}
                thumbColor={COLORS.background}
                ios_backgroundColor={COLORS.border}
              />
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Footer split actions */}
        <View style={styles.subActions}>
          <TouchableOpacity 
            style={[styles.subActionBtn, { borderRightWidth: 1, borderRightColor: '#E2E8F0' }]}
            onPress={() => navigation.navigate('AddStaff', { staff: item })}
            disabled={isUpdating}
          >
            <Edit2 size={15} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.subActionText}>{t('common.edit') || 'Edit'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.subActionBtn}
            onPress={() => handleDeleteStaff(item)}
            disabled={isUpdating}
          >
            <Trash2 size={15} color={COLORS.danger} style={{ marginRight: 6 }} />
            <Text style={[styles.subActionText, { color: COLORS.danger }]}>{t('common.delete') || 'Delete'}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  };

  return (
    <View style={styles.container}>
      <CurvedHeader
        title={t('staff.title')}
        leftIcon={<ArrowLeft size={24} color="#FFFFFF" />}
        onLeftPress={() => navigation.goBack()}
        height={140}
        contentStyle={{ paddingTop: Platform.OS === 'ios' ? 40 : 20, paddingBottom: 25 }}
      />

      <View style={styles.contentWrapper}>
        
        {/* Search Box */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color={COLORS.textPlaceholder} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('staff.searchPlaceholder')}
              placeholderTextColor={COLORS.textPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Main Content */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading staff list...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <AlertCircle size={40} color={COLORS.primary} style={{ marginBottom: 12 }} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchStaff}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredList.length === 0 ? (
          <View style={styles.centerContainer}>
            <View style={styles.emptyIconContainer}>
              <User size={48} color={COLORS.textPlaceholder} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No Results Found' : t('staff.noStaffTitle')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try searching another name or phone' : t('staff.noStaffSub')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredList}
            keyExtractor={item => String(item.id)}
            renderItem={renderStaffCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Floating Action Button */}
      {!loading && !error && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => navigation.navigate('AddStaff')}
        >
          <Plus size={26} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentWrapper: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
    marginTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontFamily: 'Rubik-SemiBold',
    fontSize: 15,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 90,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textPlaceholder,
  },
  errorText: {
    fontSize: 15,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: 'Rubik-Bold',
    fontSize: 14,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13.5,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textPlaceholder,
    textAlign: 'center',
    marginBottom: 25,
  },
  card: {
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  cardInactive: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
  },
  infoContainer: {
    flex: 1,
  },
  staffName: {
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  textMuted: {
    color: COLORS.textPlaceholder,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  detailIcon: {
    marginRight: 6,
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textSecondary,
  },
  switchContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  subActions: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  subActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  subActionText: {
    fontSize: 13,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 50,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
});

export default StaffManagementScreen;

