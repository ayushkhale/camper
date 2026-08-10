import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Save, RotateCcw, User, MapPin } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import CurvedHeader from '../../components/CurvedHeader';
import { useTranslation } from 'react-i18next';

const RouteBuilderScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { userToken } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState([]);
  
  // Array of customer IDs representing the selected sequence order
  const [selectedSequence, setSelectedSequence] = useState([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.listCustomers(userToken);
      if (res.success) {
        const fetchedCustomers = res.data || [];
        setCustomers(fetchedCustomers);
        
        // Initialize selected sequence based on existing sequenceOrder
        const sequenced = fetchedCustomers
          .filter(c => c.sequenceOrder && c.sequenceOrder > 0)
          .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
          .map(c => c.id);
          
        setSelectedSequence(sequenced);
      } else {
        throw new Error(res.message || 'Failed to load customers');
      }
    } catch (err) {
      console.error('Error fetching customers for sequencing:', err);
      showAlert('Error', err.message || 'Could not load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerTap = (customerId) => {
    setSelectedSequence(prev => {
      const currentIndex = prev.indexOf(customerId);
      if (currentIndex >= 0) {
        // Remove from sequence
        const newSeq = [...prev];
        newSeq.splice(currentIndex, 1);
        return newSeq;
      } else {
        // Add to end of sequence
        return [...prev, customerId];
      }
    });
  };

  const handleReset = () => {
    setSelectedSequence([]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build payload mapping all customers
      // If in selectedSequence, sequenceOrder = index + 1. Else 0.
      const sequences = customers.map(c => {
        const idx = selectedSequence.indexOf(c.id);
        return {
          customerId: c.id,
          sequenceOrder: idx >= 0 ? idx + 1 : 0
        };
      });

      const res = await api.updateCustomerSequence(userToken, sequences);
      if (res.success) {
        showAlert('Success', 'Route sequence saved successfully', 'success');
        navigation.goBack();
      } else {
        throw new Error(res.message || 'Failed to save sequence');
      }
    } catch (err) {
      console.error('Save sequence error:', err);
      showAlert('Error', err.message || 'Could not save sequence', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Derive the display list: Selected items first (in sequence order), then unselected items
  const displayList = useMemo(() => {
    const selected = selectedSequence.map(id => customers.find(c => String(c.id) === String(id))).filter(Boolean);
    const unselected = customers.filter(c => !selectedSequence.includes(c.id));
    return [...selected, ...unselected];
  }, [customers, selectedSequence]);

  const renderCustomerItem = ({ item }) => {
    const sequenceIndex = selectedSequence.indexOf(item.id);
    const isSelected = sequenceIndex >= 0;
    const sequenceNumber = sequenceIndex + 1;

    return (
      <TouchableOpacity 
        style={[styles.customerCard, isSelected && styles.customerCardSelected]}
        activeOpacity={0.7}
        onPress={() => handleCustomerTap(item.id)}
      >
        <View style={styles.cardContent}>
          <View style={styles.infoCol}>
            <Text style={styles.customerName}>{item.name}</Text>
            {item.address ? (
              <View style={styles.addressRow}>
                <MapPin size={12} color={COLORS.textSecondary} />
                <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
              </View>
            ) : null}
          </View>
          
          <View style={[styles.badge, isSelected ? styles.badgeSelected : styles.badgeUnselected]}>
            {isSelected ? (
              <Text style={styles.badgeTextSelected}>{sequenceNumber}</Text>
            ) : (
              <View style={styles.badgeDot} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <CurvedHeader
        title={<Text style={{ color: '#FFF', fontSize: 20, fontFamily: 'Geologica-Bold' }}>{t('routes.customerSequence')}</Text>}
        leftIcon={<ChevronLeft size={28} color="#FFF" />}
        onLeftPress={() => navigation.goBack()}
        rightIcon={
          <TouchableOpacity
            style={[styles.headerActionBtnDark, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <RotateCcw size={18} color="#FFF" />
          </TouchableOpacity>
        }
        height={120}
        contentStyle={{ paddingTop: 10, paddingBottom: 25 }}
      />

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          Tap customers in the order you want to deliver to them. Tap again to remove from sequence.
        </Text>
        <Text style={styles.statsText}>
          {selectedSequence.length} of {customers.length} sequenced
        </Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : customers.length === 0 ? (
        <View style={styles.centerContainer}>
          <User size={40} color={COLORS.textPlaceholder} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>{t('routes.noCustomersOnRoute')}</Text>
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={item => String(item.id)}
          renderItem={renderCustomerItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Save Button */}
      {!loading && customers.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Save size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveBtnText}>{t('routes.saveSequence')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerActionBtnDark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetBtn: {
    padding: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
  },
  instructionsContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  instructionsText: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  statsText: {
    fontSize: 13,
    fontFamily: 'Geologica-Bold',
    color: COLORS.primary,
    marginTop: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPlaceholder,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 150, // padding for footer
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    padding: 14,
  },
  customerCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F4F8FE',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoCol: {
    flex: 1,
    paddingRight: 16,
  },
  customerName: {
    fontSize: 15,
    fontFamily: 'Geologica-SemiBold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    fontSize: 12,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
    flex: 1,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  badgeUnselected: {
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  badgeSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  badgeTextSelected: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Geologica-Bold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 65 : 45,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Geologica-Bold',
  },
});

export default RouteBuilderScreen;
