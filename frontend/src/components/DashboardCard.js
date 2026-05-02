import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export const DashboardCard = ({
  icon = 'shopping-cart',
  title = 'Total Orders',
  value = '0',
  trend = null,
  trendUp = true,
  color = '#16A34A',
  backgroundColor = '#DCFCE7',
  style,
}) => {
  return (
    <View style={[styles.card, { backgroundColor }, style]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <MaterialIcons name={icon} size={24} color="#FFFFFF" />
        </View>
        {trend && (
          <View
            style={[
              styles.trendBadge,
              {
                backgroundColor: trendUp ? '#D1FAE5' : '#FEE2E2',
              },
            ]}
          >
            <MaterialIcons
              name={trendUp ? 'trending-up' : 'trending-down'}
              size={14}
              color={trendUp ? '#059669' : '#EF4444'}
            />
            <Text
              style={[
                styles.trendText,
                {
                  color: trendUp ? '#059669' : '#EF4444',
                },
              ]}
            >
              {trend}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.value, { color }]}>{value}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8,
    marginVertical: 8,
    flex: 1,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  contentContainer: {
    marginTop: 12,
  },
  title: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
  },
});
