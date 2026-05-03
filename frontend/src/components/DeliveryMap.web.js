import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export const DeliveryMap = () => {
  return (
    <View style={styles.wrapper}>
      <MaterialIcons name="map" size={40} color="#16A34A" />
      <Text style={styles.title}>Map preview is unavailable on web</Text>
      <Text style={styles.subtitle}>
        Use the address field or open Google Maps to choose a delivery location.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    minHeight: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 14,
  },
});
