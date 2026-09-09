import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Linking, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetRecruiterApplication, useUpdateApplicationStatus, ApplicationStage, getGetRecruiterApplicationQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const STAGES = [
  ApplicationStage.New_Applicant,
  ApplicationStage.AI_Reviewed,
  ApplicationStage.Shortlisted,
  ApplicationStage.Interview,
  ApplicationStage.Selected,
  ApplicationStage.Rejected,
  ApplicationStage.Hired,
];
const stageLabel = (stage: ApplicationStage) => stage === ApplicationStage.AI_Reviewed ? "Reviewed" : stage;

export default function ApplicationDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const appId = parseInt(id as string);
  const queryClient = useQueryClient();

  const { data: detail, isLoading, isError, refetch } = useGetRecruiterApplication(appId, {
    query: {
      enabled: !!appId,
      queryKey: getGetRecruiterApplicationQueryKey(appId)
    }
  });

  const updateStatus = useUpdateApplicationStatus();
  const [updating, setUpdating] = useState(false);

  const handleUpdateStatus = async (status: ApplicationStage) => {
    setUpdating(true);
    try {
      await updateStatus.mutateAsync({
        id: appId,
        data: { status }
      });
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/applications"] });
      queryClient.invalidateQueries({ queryKey: [`/api/recruiter/applications/${appId}`] });
      Alert.alert("Success", `Status updated to ${status}`);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color="#0077B6" size="large" />
      </View>
    );
  }
  if (isError || !detail) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={42} color="#DC2626" />
        <Text style={styles.errorTitle}>Candidate could not be loaded</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { application, candidate } = detail;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0077B6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Candidate Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Ionicons name="person" size={40} color="#0077B6" />
          </View>
          <Text style={styles.candidateName}>{candidate?.fullName || "Unknown Candidate"}</Text>
          <Text style={styles.candidateHeadline}>{candidate?.headline || "Hospitality Professional"}</Text>
          <Text style={styles.appliedFor}>Applied for {detail.jobTitle || "this vacancy"}</Text>
          
          <View style={styles.contactRow}>
            {candidate?.email && (
              <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL(`mailto:${candidate.email}`)}>
                <Ionicons name="mail" size={16} color="#0077B6" />
                <Text style={styles.contactBtnText}>Email</Text>
              </TouchableOpacity>
            )}
            {candidate?.phone && (
              <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL(`tel:${candidate.phone}`)}>
                <Ionicons name="call" size={16} color="#0077B6" />
                <Text style={styles.contactBtnText}>Call</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <View style={styles.chipRow}>
              {STAGES.map((stage) => (
                <TouchableOpacity 
                  key={stage} 
                  style={[styles.chip, application?.status === stage && styles.chipSelected]} 
                  onPress={() => handleUpdateStatus(stage)}
                  disabled={updating}
                >
                  <Text style={[styles.chipText, application?.status === stage && styles.chipTextSelected]}>{stageLabel(stage)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{candidate?.location || "Not specified"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Experience</Text>
            <Text style={styles.detailValue}>{candidate?.yearsExperience || "Not specified"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Availability</Text>
            <Text style={styles.detailValue}>{candidate?.availability || "Not specified"}</Text>
          </View>
        </View>

        {candidate?.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.summaryText}>{candidate.summary}</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7FF" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#003A6B" },
  centered: { alignItems: "center", justifyContent: "center", padding: 24 },
  errorTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A", marginTop: 12, marginBottom: 16 },
  retryBtn: { backgroundColor: "#0077B6", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  retryText: { color: "#fff", fontWeight: "700" },
  profileHeader: { alignItems: "center", paddingHorizontal: 20, marginBottom: 24 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#E0F2FE", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  candidateName: { fontSize: 22, fontWeight: "700", color: "#003A6B", marginBottom: 4 },
  candidateHeadline: { fontSize: 15, color: "#64748B", marginBottom: 16 },
  appliedFor: { fontSize: 13, color: "#0077B6", fontWeight: "600", marginTop: -10, marginBottom: 16 },
  contactRow: { flexDirection: "row", gap: 12 },
  contactBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: "#D1E9FF" },
  contactBtnText: { color: "#0077B6", fontWeight: "600", fontSize: 14 },
  section: { backgroundColor: "#fff", marginHorizontal: 20, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#003A6B", marginBottom: 12 },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F1F5F9" },
  chipSelected: { backgroundColor: "#0077B6" },
  chipText: { fontSize: 13, color: "#475569", fontWeight: "500" },
  chipTextSelected: { color: "#fff", fontWeight: "700" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  detailLabel: { fontSize: 14, color: "#64748B" },
  detailValue: { fontSize: 14, color: "#0F172A", fontWeight: "500" },
  summaryText: { fontSize: 14, color: "#475569", lineHeight: 22 },
  cvBtn: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#F0F7FF", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#D1E9FF" },
  cvBtnText: { color: "#0077B6", fontWeight: "600", fontSize: 15 },
});