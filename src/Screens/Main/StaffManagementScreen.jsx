import React, { useState, useEffect, useCallback, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Switch
} from 'react-native';
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

  // Refetch staff list whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchStaff();
    }, [fetchStaff])
  );

  // Filter staff list when searchQuery changes
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
    
    // Optimistic UI update
    const previousList = [...staffList];
    setStaffList(prev => 
      prev.map(staff => staff.id === item.id ? { ...staff, status: nextStatus } : staff)
    );

    try {
      await api.updateStaff(userToken, item.id, { status: nextStatus });
    } catch (err) {
      // Revert if API fails
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
              <Phone size={14} color={COLORS.textPlaceholder} style={styles.detailIcon} />
              <Text style={styles.detailText}>{item.phone}</Text>
            </View>
            {item.email ? (
              <View style={styles.detailRow}>
                <Mail size={14} color={COLORS.textPlaceholder} style={styles.detailIcon} />
                <Text style={styles.detailText} numberOfLines={1}>{item.email}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Action Controls */}
        <View style={styles.cardActions}>
          <View style={styles.statusToggleContainer}>
            <Text style={[styles.statusText, isActive ? styles.statusActive : styles.statusInactive]}>
              {isActive ? t('staff.active') : t('staff.inactive')}
            </Text>
            {isUpdating ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={styles.loadingIndicator} />
            ) : (
              <Switch
                value={isActive}
                onValueChange={() => handleToggleStatus(item)}
                trackColor={{ false: COLORS.textPlaceholder, true: COLORS.primary }}
                thumbColor={isActive ? COLORS.primary : COLORS.primaryLight}
                ios_backgroundColor={COLORS.textPlaceholder}
              />
            )}
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('AddStaff', { staff: item })}
              disabled={isUpdating}
            >
              <Edit2 size={18} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteStaff(item)}
              disabled={isUpdating}
            >
              <Trash2 size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('staff.title')}</Text>
        <View style={styles.headerRightSpacing} />
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.textPlaceholder} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('staff.searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.textPlaceholder}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={48} color={COLORS.primary} style={styles.errorIcon} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchStaff}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredList.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconContainer}>
            <User size={64} color={COLORS.textPlaceholder} />
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

      {/* Floating Action Button */}
      {!loading && !error && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => navigation.navigate('AddStaff')}
        >
          <Plus size={28} color={COLORS.primary} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textPlaceholder,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  headerRightSpacing: {
    width: 40,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: COLORS.primary,
    padding: 0,
  },
  clearText: {
    fontSize: 22,
    color: COLORS.textPlaceholder,
    paddingHorizontal: 8,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  errorIcon: {
    marginBottom: 15,
  },
  errorText: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.textPlaceholder,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textPlaceholder,
    textAlign: 'center',
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  emptyAddText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
  },
  buttonIcon: {
    marginRight: 8,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardInactive: {
    opacity: 0.6,
    backgroundColor: COLORS.surfaceMuted,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
  },
  infoContainer: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
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
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textPlaceholder,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.textPlaceholder,
    marginVertical: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
    marginRight: 10,
  },
  statusActive: {
    color: COLORS.primary,
  },
  statusInactive: {
    color: COLORS.textPlaceholder,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.textPlaceholder,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  deleteButton: {
    borderColor: COLORS.textPlaceholder,
    backgroundColor: COLORS.primaryLight,
  },
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StaffManagementScreen;
