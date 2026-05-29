import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import FaceScanner from '../components/FaceScanner';
import { getFaceDescriptors } from '../api';

export default function FaceIDScreen({ navigation }: any) {
  const [descriptors, setDescriptors] = useState([]);

  useEffect(() => {
    getFaceDescriptors().then(res => setDescriptors(res.data));
  }, []);

  return (
    <View style={styles.container}>
      <FaceScanner 
        descriptors={descriptors} 
        onSuccess={() => {
            setTimeout(() => navigation.goBack(), 4000);
        }} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
});
