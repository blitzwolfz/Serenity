import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { PlusCircle } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

type AddMoodButtonProps = {
  onPress: () => void;
};

export default function AddMoodButton({ onPress }: AddMoodButtonProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.primary }]}
      onPress={onPress}
    >
      <PlusCircle size={20} color="#fff" />
      <Text style={styles.buttonText}>Add Mood</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 16,
  },
});