import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PremiumButton } from './PremiumButton';

export const EmptyState = ({
  icon = 'inbox',
  title = 'No Items',
  description = 'Nothing to show right now',
  actionLabel = null,
  onAction = null,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <MaterialIcons
        name={icon}
        size={64}
        color="#D1D5DB"
        style={styles.icon}
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction && (
        <View style={styles.buttonContainer}>
          <PremiumButton
            title={actionLabel}
            onPress={onAction}
            variant="primary"
            size="md"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    marginTop: 16,
    width: '100%',
  },
});
