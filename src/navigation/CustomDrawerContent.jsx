import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { COLORS } from '../constants/colors';

const CustomDrawerContent = (props) => {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        {/* Drawer Header */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/hindilogo.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
        </View>

        {/* Drawer Items List */}
        <View style={styles.listContainer}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Camper v1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 15,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 10,
    alignItems: 'center', // Clean centering for the logo header
  },
  logo: {
    height: 52,
    width: 160,
  },
  listContainer: {
    paddingHorizontal: 10,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  }
});

export default CustomDrawerContent;
