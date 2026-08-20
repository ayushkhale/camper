import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { MapPin, Phone, User, AlertCircle } from 'lucide-react-native';
import { api } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../constants/colors';

const OutstandingReport = ({ filters }) => {
  const { userToken } = useContext(AuthContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [filters.routeId, filters.staffId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Exclude date filters for Outstanding
      const payload = {};
      if (filters.routeId) payload.routeId = filters.routeId;
      if (filters.staffId) payload.staffId = filters.staffId;

      const res = await api.getOutstandingReports(userToken, payload);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load outstanding data');
      }
    } catch (err) {
      setError('An error occurred while fetching data');
      console.log('Outstanding report error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderCustomerItem = ({ item }) => (
    <View style={styles.customerCard}>
      <View style={styles.cardHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          {item.phone ? (
            <View style={styles.subInfoRow}>
              <Phone size={12} color={COLORS.textPlaceholder} style={styles.subIcon} />
              <Text style={styles.subText}>{item.phone}</Text>
            </View>
          ) : null}
          {item.address ? (
            <View style={styles.subInfoRow}>
              <MapPin size={12} color={COLORS.textPlaceholder} style={styles.subIcon} />
              <Text style={styles.subText} numberOfLines={1}>{item.address}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Owes</Text>
          <Text style={styles.balanceAmount}>₹{Number(item.currentBalance).toLocaleString()}</Text>
        </View>
      </View>
      
      {item.Route?.name && (
        <View style={styles.routeBadge}>
          <Text style={styles.routeBadgeText}>{item.Route.name}</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle size={48} color="#CBD5E1" style={{marginBottom: 16}} />
        <Text style={styles.emptyTitle}>All Clear!</Text>
        <Text style={styles.emptySubtitle}>No customers currently owe money based on the selected filters.</Text>
      </View>
    );
  }

  const totalOutstanding = data.reduce((acc, curr) => acc + Number(curr.currentBalance || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Total Outstanding Debt</Text>
        <Text style={styles.headerAmount}>₹{totalOutstanding.toLocaleString()}</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomerItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: 'Geologica-Medium',
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Geologica-SemiBold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Geologica-Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  header: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: '#991B1B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerAmount: {
    fontSize: 28,
    fontFamily: 'Geologica-Bold',
    color: '#DC2626',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  customerCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerInfo: {
    flex: 1,
    paddingRight: 16,
  },
  customerName: {
    fontSize: 17,
    fontFamily: 'Geologica-Bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  subIcon: {
    marginRight: 8,
  },
  subText: {
    fontSize: 13,
    fontFamily: 'Geologica-Medium',
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  balanceContainer: {
    alignItems: 'flex-end',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  balanceLabel: {
    fontSize: 11,
    fontFamily: 'Geologica-SemiBold',
    color: '#EF4444',
    textTransform: 'uppercase',
  },
  balanceAmount: {
    fontSize: 18,
    fontFamily: 'Geologica-Bold',
    color: '#DC2626',
    marginTop: 2,
  },
  routeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  routeBadgeText: {
    fontSize: 11,
    fontFamily: 'Geologica-SemiBold',
    color: '#475569',
  }
});

export default OutstandingReport;
