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
import { ChevronLeft, Plus, Search, Trash2, Edit2, User, Phone, Mail, AlertCircle } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

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
    } catch (err) {
      setStaffList(previousList);
      Alert.alert('Error', err.message || 'Failed to update status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteStaff = (item) => {
    Alert.alert(
      t('staff.remove'),
      `${t('staff.removeConfirm')}\n\nName: ${item.name}`,
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
                setStaffList(prev => prev.filter(staff => staff.id !== item.id));
              } else {
                Alert.alert('Error', res.message || 'Failed to remove staff');
              }
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to remove staff');
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
      <View style={[styles.card, !isActive && styles.cardInactive]}>
        <View style={styles.cardHeader}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          
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
            style={[styles.subActionBtn, { borderRightWidth: 1, borderRightColor: '#F1F5F9' }]}
            onPress={() => navigation.navigate('AddStaff', { staff: item })}
            disabled={isUpdating}
          >
            <Edit2 size={15} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.subActionText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.subActionBtn}
            onPress={() => handleDeleteStaff(item)}
            disabled={isUpdating}
          >
            <Trash2 size={15} color={COLORS.danger} style={{ marginRight: 6 }} />
            <Text style={[styles.subActionText, { color: COLORS.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.contentWrapper}>
        
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ChevronLeft size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('staff.title')}</Text>
          <View style={styles.headerRightSpacing} />
        </View>

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
            keyExtractor={(item) => item.id}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  headerRightSpacing: {
    width: 32,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
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
    fontFamily: 'Geologica-Medium',
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
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPlaceholder,
  },
  errorText: {
    fontSize: 15,
    fontFamily: 'Geologica-Medium',
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
    fontFamily: 'Geologica-Bold',
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
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13.5,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPlaceholder,
    textAlign: 'center',
    marginBottom: 25,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  cardInactive: {
    opacity: 0.7,
    backgroundColor: '#F8FAFC',
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
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 15,
    fontFamily: 'Geologica-Bold',
  },
  infoContainer: {
    flex: 1,
  },
  staffName: {
    fontSize: 15,
    fontFamily: 'Geologica-Bold',
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
    fontFamily: 'Geologica-Medium',
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
    backgroundColor: '#F8FAFC',
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
    fontFamily: 'Geologica-Bold',
    color: COLORS.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StaffManagementScreen;
