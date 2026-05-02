import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export const DeliveryMap = ({
  region,
  deliveryLocation,
  onMapPress,
  onMarkerDragEnd,
}) => {
  return (
    <MapView style={styles.map} region={region} onPress={onMapPress}>
      <Marker
        coordinate={
          deliveryLocation
            ? { latitude: deliveryLocation.latitude, longitude: deliveryLocation.longitude }
            : { latitude: region.latitude, longitude: region.longitude }
        }
        draggable
        onDragEnd={onMarkerDragEnd}
        title="Delivery location"
      />
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 180,
    borderRadius: 16,
  },
});
