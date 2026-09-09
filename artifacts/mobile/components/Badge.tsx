import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface BadgeProps {
  label: "Featured" | "Urgent";
}

export default function Badge({ label }: BadgeProps) {
  const isFeatured = label === "Featured";
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: isFeatured ? "#FEF3C7" : "#FEE2E2" },
      ]}
    >
      <Text style={[styles.text, { color: isFeatured ? "#D97706" : "#DC2626" }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  text: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
