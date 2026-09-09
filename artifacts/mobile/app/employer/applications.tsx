import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useListRecruiterApplications, ApplicationStage } from "@workspace/api-client-react";

const STAGES = [
  "All",
  ApplicationStage.New_Applicant,
  ApplicationStage.AI_Reviewed,
  ApplicationStage.Shortlisted,
  ApplicationStage.Interview,
  ApplicationStage.Selected,
  ApplicationStage.Rejected,
  ApplicationStage.Hired,
];
const stageLabel = (stage: string) => stage === ApplicationStage.AI_Reviewed ? "Reviewed" : stage;

export default function ApplicationsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ jobId?: string }>();
  const { data: applications = [], isLoading, isRefetching, refetch } = useListRecruiterApplications({
    query: {
      queryKey: ["/api/recruiter/applications", params.jobId],
    }
  });

  const [activeStage, setActiveStage] = useState<string>("All");

  const filtered = applications.filter((app) => 
    (activeStage === "All" || app.status === activeStage) &&
    (params.jobId ? app.jobId === parseInt(params.jobId) : true)
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#2A6F97" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Applicants</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {STAGES.map((stage) => (
            <TouchableOpacity 
              key={stage} 
              style={[styles.tabBtn, activeStage === stage && styles.tabBtnActive]}
              onPress={() => setActiveStage(stage)}
            >
              <Text style={[styles.tabBtnText, activeStage === stage && styles.tabBtnTextActive]}>
                {stageLabel(stage)} ({stage === "All" ? applications.length : applications.filter((app) => app.status === stage).length})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {isLoading ? (
          <ActivityIndicator color="#2A6F97" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#B0C4D8" />
            <Text style={styles.emptyText}>No applicants in this stage</Text>
          </View>
        ) : (
          filtered.map((app) => (
            <TouchableOpacity 
              key={app.id} 
              style={styles.card}
              onPress={() => router.push(`/employer/application/${app.id}` as any)}
            >
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={20} color="#2A6F97" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.candidateName}>{app.candidateName || "Unknown Candidate"}</Text>
                  <Text style={styles.jobText}>{app.jobTitle || "Vacancy"}</Text>
                  <Text style={styles.metaText}>
                    {app.candidateHeadline || "Hospitality candidate"}
                    {app.createdAt ? ` · ${new Date(app.createdAt).toLocaleDateString()}` : ""}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FBF8F1" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1C4E6B" },
  tabsWrapper: { marginBottom: 12 },
  tabsScroll: { paddingHorizontal: 20, gap: 8 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E4DCC8" },
  tabBtnActive: { backgroundColor: "#2A6F97", borderColor: "#2A6F97" },
  tabBtnText: { fontSize: 13, color: "#475569", fontWeight: "500" },
  tabBtnTextActive: { color: "#fff", fontWeight: "700" },
  list: { flex: 1, paddingHorizontal: 20 },
  emptyState: { alignItems: "center", paddingTop: 40 },
  emptyText: { fontSize: 15, color: "#7A7469", marginTop: 12 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#E4DCC8" },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F3ECD9", alignItems: "center", justifyContent: "center" },
  candidateName: { fontSize: 16, fontWeight: "600", color: "#22303C", marginBottom: 4 },
  jobText: { fontSize: 13, color: "#7A7469" },
  metaText: { fontSize: 12, color: "#94A3B8", marginTop: 3 },
});