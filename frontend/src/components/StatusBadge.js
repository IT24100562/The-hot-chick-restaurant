import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const StatusBadge = ({ status, size = 'md' }) => {
  const statuses = {
    pending: { bg: '#FEF3C7', text: '#F59E0B', label: 'Pending' },
    preparing: { bg: '#DBEAFE', text: '#3B82F6', label: 'Preparing' },
    ready: { bg: '#DCFCE7', text: '#16A34A', label: 'Ready' },
    delivered: { bg: '#D1FAE5', text: '#059669', label: 'Delivered' },
    cancelled: { bg: '#FEE2E2', text: '#EF4444', label: 'Cancelled' },
    confirmed: { bg: '#DCFCE7', text: '#16A34A', label: 'Confirmed' },
    paid: { bg: '#DCFCE7', text: '#16A34A', label: 'Paid' },
    processing: { bg: '#DBEAFE', text: '#3B82F6', label: 'Processing' },
    failed: { bg: '#FEE2E2', text: '#EF4444', label: 'Failed' },
    active: { bg: '#DCFCE7', text: '#16A34A', label: 'Active' },
    inactive: { bg: '#F3F4F6', text: '#6B7280', label: 'Inactive' },
  };

  const statusStyle = statuses[status] || statuses.pending;

  const sizes = {
    sm: { paddingHorizontal: 8, paddingVertical: 4, fontSize: 10 },
    md: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 12 },
    lg: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 },
  };

  const sizeStyle = sizes[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: statusStyle.bg,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          paddingVertical: sizeStyle.paddingVertical,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: statusStyle.text,
            fontSize: sizeStyle.fontSize,
          },
        ]}
      >
        {statusStyle.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
});
