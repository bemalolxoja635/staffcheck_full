import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Asosiy sahifa</Text>
      
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: '#06b6d4' }]} 
        onPress={() => navigation.navigate('FaceID')}
      >
        <Text style={styles.cardText}>FaceID Davomat</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.card, { backgroundColor: '#6366f1' }]} 
        onPress={() => navigation.navigate('Profile')}
      >
        <Text style={styles.cardText}>Profilim</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  card: { padding: 30, borderRadius: 20, marginBottom: 20, alignItems: 'center', elevation: 5 },
  cardText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
