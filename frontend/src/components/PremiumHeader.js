import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export const PremiumHeader = ({
  title,
  subtitle = null,
  leftIcon = 'menu',
  rightIcon = null,
  onLeftPress = null,
  onRightPress = null,
  backgroundColor = '#FFFFFF',
}) => {
  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onLeftPress}
        style={styles.iconButton}
      >
        <MaterialIcons name={leftIcon} size={24} color="#16A34A" />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <TouchableOpacity
        onPress={onRightPress}
        style={styles.iconButton}
      >
        {rightIcon && (
          <MaterialIcons name={rightIcon} size={24} color="#16A34A" />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  iconButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
