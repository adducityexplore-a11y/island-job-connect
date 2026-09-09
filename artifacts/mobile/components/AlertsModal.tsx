import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Department, DEPT_OPTIONS, Job, SAMPLE_JOBS } from "@/constants/data";
import { JobAlert, useJobAlerts } from "@/contexts/JobAlertsContext";
import { usePostedJobs } from "@/contexts/PostedJobsContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
}

type ModalView = "list" | "create" | "matches";

export default function AlertsModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { alerts, addAlert, removeAlert, markAlertSeen, getNewMatches } =
    useJobAlerts();
  const { postedJobs } = usePostedJobs();
  const allJobs = useMemo(() => [...postedJobs, ...SAMPLE_JOBS], [postedJobs]);

  const [view, setView] = useState<ModalView>("list");
  const [activeAlert, setActiveAlert] = useState<JobAlert | null>(null);

  const [label, setLabel] = useState("");
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [department, setDepartment] = useState<Department>("All");

  const resetForm = () => {
    setLabel("");
    setKeyword("");
    setLocation("");
    setDepartment("All");
  };

  const handleCreate = async () => {
    if (!label.trim()) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addAlert({
      label: label.trim(),
      department,
      keyword: keyword.trim(),
      location: location.trim(),
    });
    resetForm();
    setView("list");
  };

  const handleViewMatches = async (alert: JobAlert) => {
    setActiveAlert(alert);
    const newMatches = getNewMatches(alert, allJobs);
    if (newMatches.length > 0) {
      await markAlertSeen(alert.id, newMatches.map((j) => j.id));
    }
    setView("matches");
  };

  const handleDelete = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeAlert(id);
  };

  const handleClose = () => {
    setView("list");
    resetForm();
    setActiveAlert(null);
    onClose();
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const matchJobs: Job[] = useMemo(() => {
    if (!activeAlert) return [];
    return allJobs.filter((j) => {
      const deptOk = activeAlert.department === "All" || j.department === activeAlert.department;
      const q = activeAlert.keyword.toLowerCase().trim();
      const kwOk = q === "" || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.department.toLowerCase().includes(q);
      const loc = activeAlert.location.toLowerCase().trim();
      const locOk = loc === "" || j.location.toLowerCase().includes(loc);
      return deptOk && kwOk && locOk;
    });
  }, [activeAlert, allJobs]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity
            onPress={view === "list" ? handleClose : () => { setView("list"); setActiveAlert(null); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name={view === "list" ? "x" : "arrow-left"} size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {view === "create" ? "New Alert" : view === "matches" ? (activeAlert?.label ?? "Matches") : "Job Alerts"}
          </Text>
          {view === "list" ? (
            <TouchableOpacity
              onPress={() => setView("create")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="plus" size={22} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 22 }} />
          )}
        </View>

        {/* LIST VIEW */}
        {view === "list" && (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {alerts.length === 0 ? (
              <View style={styles.empty}>
                <Feather name="bell-off" size={44} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No alerts yet</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Tap the + button to create your first job alert and never miss a matching vacancy.
                </Text>
                <TouchableOpacity
                  style={[styles.createBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setView("create")}
                >
                  <Feather name="plus" size={16} color="#fff" />
                  <Text style={styles.createBtnText}>Create Alert</Text>
                </TouchableOpacity>
              </View>
            ) : (
              alerts.map((alert) => {
                const newCount = getNewMatches(alert, allJobs).length;
                const total = allJobs.filter((j) => {
                  const deptOk = alert.department === "All" || j.department === alert.department;
                  const q = alert.keyword.toLowerCase().trim();
                  const kwOk = q === "" || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q);
                  const loc = alert.location.toLowerCase().trim();
                  const locOk = loc === "" || j.location.toLowerCase().includes(loc);
                  return deptOk && kwOk && locOk;
                }).length;
                return (
                  <TouchableOpacity
                    key={alert.id}
                    style={[styles.alertCard, { backgroundColor: colors.card, borderColor: newCount > 0 ? colors.primary : colors.border }]}
                    onPress={() => handleViewMatches(alert)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.alertIconWrap, { backgroundColor: newCount > 0 ? colors.primary : colors.secondary }]}>
                      <Feather name="bell" size={18} color={newCount > 0 ? "#fff" : colors.primary} />
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={styles.alertTitleRow}>
                        <Text style={[styles.alertLabel, { color: colors.foreground }]} numberOfLines={1}>
                          {alert.label}
                        </Text>
                        {newCount > 0 && (
                          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.badgeText}>{newCount} new</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.alertMeta}>
                        {alert.department !== "All" && (
                          <View style={[styles.chip, { backgroundColor: colors.secondary }]}>
                            <Text style={[styles.chipText, { color: colors.primary }]}>{alert.department}</Text>
                          </View>
                        )}
                        {alert.keyword !== "" && (
                          <View style={[styles.chip, { backgroundColor: colors.secondary }]}>
                            <Text style={[styles.chipText, { color: colors.primary }]}>"{alert.keyword}"</Text>
                          </View>
                        )}
                        {alert.location !== "" && (
                          <View style={[styles.chip, { backgroundColor: colors.secondary }]}>
                            <Feather name="map-pin" size={10} color={colors.primary} />
                            <Text style={[styles.chipText, { color: colors.primary }]}>{alert.location}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.alertCount, { color: colors.mutedForeground }]}>
                        {total} matching {total === 1 ? "job" : "jobs"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(alert.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.deleteBtn}
                    >
                      <Feather name="trash-2" size={16} color="#E63946" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}

        {/* CREATE VIEW */}
        {view === "create" && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Alert Name *</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
              placeholder="e.g. Kitchen jobs in North Malé"
              placeholderTextColor={colors.mutedForeground}
              value={label}
              onChangeText={setLabel}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Keyword (optional)</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
              placeholder="e.g. chef, spa, butler..."
              placeholderTextColor={colors.mutedForeground}
              value={keyword}
              onChangeText={setKeyword}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Location (optional)</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
              placeholder="e.g. North Malé Atoll, Baa Atoll..."
              placeholderTextColor={colors.mutedForeground}
              value={location}
              onChangeText={setLocation}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Department</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptScroll}>
              {(["All", ...DEPT_OPTIONS] as Department[]).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.deptChip,
                    {
                      backgroundColor: department === d ? colors.primary : colors.card,
                      borderColor: department === d ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setDepartment(d)}
                >
                  <Text style={[styles.deptChipText, { color: department === d ? "#fff" : colors.foreground }]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: label.trim() ? colors.primary : colors.border }]}
              onPress={handleCreate}
              disabled={!label.trim()}
              activeOpacity={0.85}
            >
              <Feather name="bell" size={16} color="#fff" />
              <Text style={styles.saveBtnText}>Save Alert</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* MATCHES VIEW */}
        {view === "matches" && activeAlert && (
          <FlatList
            data={matchJobs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.matchesContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Text style={[styles.matchesHeader, { color: colors.mutedForeground }]}>
                {matchJobs.length} {matchJobs.length === 1 ? "job" : "jobs"} matching this alert
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.matchCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => { handleClose(); router.push(`/job/${item.id}` as never); }}
                activeOpacity={0.8}
              >
                <View style={styles.matchCardInner}>
                  <View style={[styles.matchLogo, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.matchInitial, { color: colors.primary }]}>
                      {item.company.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.matchTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.matchCompany, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {item.company}
                    </Text>
                    <View style={styles.matchMeta}>
                      <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                      <Text style={[styles.matchLocation, { color: colors.mutedForeground }]}>{item.location}</Text>
                      <View style={[styles.chip, { backgroundColor: colors.secondary, marginLeft: 6 }]}>
                        <Text style={[styles.chipText, { color: colors.primary }]}>{item.department}</Text>
                      </View>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Feather name="search" size={36} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No matches yet</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  We'll show new listings here as soon as they match your alert.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  listContent: { padding: 16, gap: 12 },
  alertCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  alertTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  alertLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  alertMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  alertCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  deleteBtn: {
    padding: 6,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  createBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  formContent: { padding: 20, gap: 8 },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  deptScroll: { marginTop: 4, marginBottom: 4 },
  deptChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  deptChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  matchesContent: { padding: 16 },
  matchesHeader: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
    textAlign: "center",
  },
  matchCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  matchCardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  matchLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  matchInitial: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  matchTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  matchCompany: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  matchMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  matchLocation: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginLeft: 3,
  },
});
