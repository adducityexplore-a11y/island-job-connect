import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Department, DEPARTMENTS } from "@/constants/data";
import { useColors } from "@/hooks/useColors";

interface DepartmentFilterProps {
  selected: Department;
  onSelect: (dept: Department) => void;
}

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

interface DeptMeta {
  icon: FeatherIconName;
  color: string;   // active bg
  text: string;    // active text/icon colour
}

const DEPT_META: Record<Department, DeptMeta> = {
  All:                   { icon: "grid",         color: "#2A6F97", text: "#ffffff" },
  "F&B":                 { icon: "coffee",        color: "#D97706", text: "#ffffff" },
  "Front Office":        { icon: "briefcase",     color: "#7C3AED", text: "#ffffff" },
  Kitchen:               { icon: "thermometer",   color: "#DC2626", text: "#ffffff" },
  Housekeeping:          { icon: "home",          color: "#059669", text: "#ffffff" },
  Spa:                   { icon: "droplet",       color: "#DB2777", text: "#ffffff" },
  Recreation:            { icon: "sun",           color: "#E76F51", text: "#ffffff" },
  Engineering:           { icon: "tool",          color: "#7A7469", text: "#ffffff" },
  "Sales & Marketing":   { icon: "trending-up",   color: "#2A9D8F", text: "#ffffff" },
  HR:                    { icon: "users",         color: "#8B5CF6", text: "#ffffff" },
  Finance:               { icon: "dollar-sign",   color: "#0EA5E9", text: "#ffffff" },
  Transport:             { icon: "anchor",        color: "#1E40AF", text: "#ffffff" },
  "Diving & Watersports":{ icon: "wind",          color: "#06B6D4", text: "#ffffff" },
  "Guest Services":      { icon: "star",          color: "#EAB308", text: "#ffffff" },
  IT:                    { icon: "monitor",       color: "#3B82F6", text: "#ffffff" },
  Management:            { icon: "award",         color: "#BE185D", text: "#ffffff" },
  "Kids Club":           { icon: "smile",         color: "#F97316", text: "#ffffff" },
};

export default function DepartmentFilter({
  selected,
  onSelect,
}: DepartmentFilterProps) {
  const colors = useColors();

  const handlePress = async (dept: Department) => {
    await Haptics.selectionAsync();
    onSelect(dept);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {DEPARTMENTS.map((dept) => {
        const isSelected = selected === dept;
        const meta = DEPT_META[dept];
        return (
          <TouchableOpacity
            key={dept}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? meta.color : colors.card,
                borderColor: isSelected ? meta.color : colors.border,
              },
            ]}
            onPress={() => handlePress(dept)}
            activeOpacity={0.7}
          >
            <View style={styles.chipInner}>
              <Feather
                name={meta.icon}
                size={15}
                color={isSelected ? meta.text : meta.color}
              />
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? meta.text : colors.foreground },
                ]}
              >
                {dept}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexDirection: "row",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
