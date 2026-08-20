import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, Save, User, MapPin, Search, Plus, Minus } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import CurvedHeader from '../../components/CurvedHeader';
import { useTranslation } from 'react-i18next';

const SequenceInput = ({ initialValue, max, onSave, onFocus }) => {
  const [val, setVal] = useState(String(initialValue));

  useEffect(() => {
    setVal(String(initialValue));
  }, [initialValue]);

  const handleChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (!cleaned) {
       setVal('');
       return;
    }
    
    let num = parseInt(cleaned, 10);
    if (num > max) {
       num = max;
    }
    setVal(String(num));
  };

  const handleBlurOrSubmit = () => {
     let num = parseInt(val, 10);
     if (isNaN(num) || num <= 0) {
        setVal(String(initialValue));
        return;
     }
     if (num !== initialValue) {
        onSave(num);
     }
  };

  return (
    <TextInput
      style={styles.stepperInput}
      keyboardType="number-pad"
      value={val}
      onChangeText={handleChange}
      onFocus={onFocus}
      onEndEditing={handleBlurOrSubmit}
      returnKeyType="done"
      selectTextOnFocus={true}
      maxLength={String(max).length}
    />
  );
};

const RouteBuilderScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const routeId = route?.params?.routeId || route?.params?.route?.id || route?.params?.id;
  const { userToken } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const flatListRef = useRef(null);
  
  const [customers, setCustomers] = useState([]);
  const [selectedSequence, setSelectedSequence] = useState([]); // array of IDs in sequence order

  useEffect(() => {
    fetchCustomers();
  }, [routeId]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.listCustomers(userToken, '', routeId || '');
      if (res && res.success) {
        const fetchedCustomers = Array.isArray(res.data) ? res.data : [];
        setCustomers(fetchedCustomers);
        
        const sequencedIds = fetchedCustomers
          .filter(c => c && c.sequenceOrder && c.sequenceOrder > 0)
          .sort((a, b) => (Number(a.sequenceOrder) || 0) - (Number(b.sequenceOrder) || 0))
          .map(c => c?.id !== undefined && c?.id !== null ? c.id : c?._id)
          .filter(Boolean);
          
        setSelectedSequence(sequencedIds);
      } else {
        throw new Error(res?.message || 'Failed to load customers');
      }
    } catch (err) {
      console.error('Error fetching customers for sequencing:', err);
      showAlert('Error', err?.message || 'Could not load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerTap = (customerId) => {
    if (customerId === undefined || customerId === null) return;
    setSelectedSequence(prev => {
      const currentIndex = prev.findIndex(id => String(id) === String(customerId));
      if (currentIndex >= 0) {
        // Remove from sequence
        const newSeq = [...prev];
        newSeq.splice(currentIndex, 1);
        return newSeq;
      } else {
        // Add to sequence
        return [...prev, customerId];
      }
    });
  };



  const handleSequenceInputChange = (customerId, newPos) => {
    if (!customerId) return;
    
    setSelectedSequence(prev => {
      const currentIdx = prev.findIndex(id => String(id) === String(customerId));
      if (currentIdx < 0) return prev; // Should not happen since only selected items have inputs

      const newSeq = [...prev];
      newSeq.splice(currentIdx, 1); // Remove from old pos
      
      const targetIdx = Math.min(newPos - 1, newSeq.length);
      newSeq.splice(targetIdx, 0, customerId); // Insert at new pos
      
      return newSeq;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const sequences = customers.map(c => {
        if (!c) return null;
        const cId = c?.id !== undefined && c?.id !== null ? c.id : c?._id;
        const idx = selectedSequence.findIndex(id => String(id) === String(cId));
        return {
          customerId: cId,
          sequenceOrder: idx >= 0 ? idx + 1 : 0
        };
      }).filter(s => s && s.customerId);

      const res = await api.updateCustomerSequence(userToken, sequences);
      if (res && res.success) {
        showAlert('Success', 'Route sequence saved successfully', 'success');
        navigation.goBack();
      } else {
        throw new Error(res?.message || 'Failed to save sequence');
      }
    } catch (err) {
      console.error('Save sequence error:', err);
      showAlert('Error', err?.message || 'Could not save sequence', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Derived list: perfectly sorted based on selectedSequence
  const displayList = useMemo(() => {
    const selected = selectedSequence
      .map(id => customers.find(c => c && String(c?.id !== undefined && c?.id !== null ? c.id : c?._id) === String(id)))
      .filter(Boolean);

    const unselected = customers.filter(
      c => c && !selectedSequence.some(seqId => String(seqId) === String(c?.id !== undefined && c?.id !== null ? c.id : c?._id))
    );

    return [...selected, ...unselected];
  }, [customers, selectedSequence]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return displayList;
    const lowerQ = searchQuery.toLowerCase();
    return displayList.filter(c => (c.name || '').toLowerCase().includes(lowerQ));
  }, [displayList, searchQuery]);

  const renderCustomerItem = ({ item, index }) => {
    if (!item) return null;
    const itemId = item?.id !== undefined && item?.id !== null ? item.id : item?._id;
    const sequenceIndex = selectedSequence.findIndex(id => String(id) === String(itemId));
    const isSelected = sequenceIndex >= 0;
    const sequenceNumber = sequenceIndex + 1;

    return (
      <View
        style={[
          styles.customerCard,
          isSelected && styles.customerCardSelected,
        ]}
      >
        <TouchableOpacity
          style={styles.cardContent}
          activeOpacity={0.7}
          onPress={() => handleCustomerTap(itemId)}
        >
          <View style={styles.infoCol}>
            <Text style={styles.customerName}>{item.name || t('routes.unnamedCustomer') || 'Unnamed Customer'}</Text>
            {item.address ? (
              <View style={styles.addressRow}>
                <MapPin size={12} color={COLORS.textSecondary} />
                <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
        
        {/* Sequence Badge / Input */}
        <View style={styles.sequenceCol}>
          {isSelected ? (
            <View style={styles.stepperContainer}>
              <TouchableOpacity 
                style={[styles.stepperBtn, sequenceNumber <= 1 && styles.stepperBtnDisabled]}
                onPress={() => handleSequenceInputChange(itemId, sequenceNumber - 1)}
                disabled={sequenceNumber <= 1}
              >
                <Minus size={16} color={sequenceNumber <= 1 ? '#CBD5E1' : COLORS.primary} />
              </TouchableOpacity>
              
              <SequenceInput 
                initialValue={sequenceNumber}
                max={selectedSequence.length}
                onSave={(newNum) => handleSequenceInputChange(itemId, newNum)}
                onFocus={() => {
                  try {
                    flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
                  } catch (e) {
                    console.log('Scroll failed', e);
                  }
                }}
              />
              
              <TouchableOpacity 
                style={[styles.stepperBtn, sequenceNumber >= selectedSequence.length && styles.stepperBtnDisabled]}
                onPress={() => handleSequenceInputChange(itemId, sequenceNumber + 1)}
                disabled={sequenceNumber >= selectedSequence.length}
              >
                <Plus size={16} color={sequenceNumber >= selectedSequence.length ? '#CBD5E1' : COLORS.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.badgeUnselected}
              onPress={() => handleCustomerTap(itemId)}
            >
              <View style={styles.badgeDot} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CurvedHeader
        title={<Text style={{ color: '#FFF', fontSize: 20, fontFamily: 'Geologica-Bold' }}>{t('routes.customerSequence')}</Text>}
        leftIcon={<ChevronLeft size={28} color="#FFF" />}
        onLeftPress={() => navigation.goBack()}
        height={120}
        contentStyle={{ paddingTop: 10, paddingBottom: 25 }}
      />

      <View style={styles.instructionsContainer}>
        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.textPlaceholder} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('routes.searchCustomers') || "Search customers..."}
            placeholderTextColor={COLORS.textPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {!searchQuery && (
           <Text style={styles.instructionsText}>
             {t('routes.sequenceInstructions') || "Tap to select/unselect. Type a new number to instantly reorder."}
           </Text>
        )}
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          <Text style={{ color: COLORS.primary, fontFamily: 'Geologica-Bold', fontSize: 16 }}>
            {(selectedSequence || []).length}
          </Text>
          {' '}{t('routes.sequenced') || 'sequenced'} {t('common.outOf') || 'out of'}{' '}
          <Text style={{ color: COLORS.text, fontFamily: 'Geologica-Bold', fontSize: 16 }}>
            {(customers || []).length}
          </Text>
          {' '}{t('routes.totalCustomers') || 'total customers'}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : (customers || []).length === 0 ? (
          <View style={styles.centerContainer}>
            <User size={40} color={COLORS.textPlaceholder} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyText}>{t('routes.noCustomersOnRoute')}</Text>
          </View>
        ) : (
            <FlatList
              ref={flatListRef}
              data={filteredData}
              extraData={selectedSequence}
              keyExtractor={(item, index) => (item && (item?.id || item?._id)) ? String(item?.id || item?._id) : `cust-${index}`}
              renderItem={renderCustomerItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              keyboardDismissMode="interactive"
              onScrollToIndexFailed={(info) => {
                const wait = new Promise(resolve => setTimeout(resolve, 500));
                wait.then(() => {
                  flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.3 });
                });
              }}
            />
        )}
      </View>

      {/* Floating Save Button */}
      {!loading && (customers || []).length > 0 && (
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
  instructionsContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Geologica-Regular',
    color: COLORS.text,
  },
  instructionsText: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statsText: {
    fontSize: 14,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textPlaceholder,
    textAlign: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 400,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  customerCardSelected: {
    borderColor: COLORS.primaryLight,
    backgroundColor: '#F8FAFF',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 16,
    fontFamily: 'Geologica-SemiBold',
    color: COLORS.text,
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 13,
    fontFamily: 'Geologica-Regular',
    color: COLORS.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  sequenceCol: {
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnDisabled: {
    backgroundColor: '#F8FAFC',
  },
  stepperInput: {
    width: 44,
    fontSize: 16,
    fontFamily: 'Geologica-Bold',
    color: COLORS.primary,
    textAlign: 'center',
    paddingVertical: 4,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    marginHorizontal: 6,
  },
  badgeUnselected: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Geologica-Bold',
  },
});

export default RouteBuilderScreen;
