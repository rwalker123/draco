import React from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

type ScreenContainerProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: Edge[];
};

const DEFAULT_EDGES: Edge[] = ['top', 'bottom'];

export function ScreenContainer({ children, style, edges = DEFAULT_EDGES }: ScreenContainerProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  }
});
