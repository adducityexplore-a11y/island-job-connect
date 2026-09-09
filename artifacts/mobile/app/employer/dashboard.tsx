import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, Alert, TextInput, Image, Modal,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useListRecruiterJobs,
  useUpdateRecruiterJob,
  useCloseRecruiterJob,
  useRepostRecruiterJob,
  useCloseExpiredRecruiterJobs,
  useGetCompanyProfile,
  useUpdateCompanyProfile,
  useGetRecruiterDashboard,
  useListRecruiterApplications,
  ApplicationStage,
  RecruiterJob,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const TYPE_COLORS: Record<string, string> = {
  Featured: "#2A6F97",
  Urgent: "#DC2626",
  Normal: "#6B7280",
};

function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ expiresAt, status }: { expiresAt?: string | null; status: string }) {
  if (status === "closed") {
    return (
      <View style={[styles.expiryBadge, { backgroundColor: "#FEE2E2" }]}>
        <Ionicons name="close-circle" size={11} color="#DC2626" />
        <Text style={[styles.expiryText, { color: "#DC2626" }]}>Closed</Text>
      </View>
    );
  }
  const days = daysUntil(expiresAt);
  if (days === null) return null;
  if (days <= 0) {
    return (
      <View style={[styles.expiryBadge, { backgroundColor: "#FEE2E2" }]}>
        <Ionicons name="time" size={11} color="#DC2626" />
        <Text style={[styles.expiryText, { color: "#DC2626" }]}>Expired</Text>
      </View>
    );
  }
  if (days <= 5) {
    return (
      <View style={[styles.expiryBadge, { backgroundColor: "#FEF3C7" }]}>
        <Ionicons name="time" size={11} color="#D97706" />
        <Text style={[styles.expiryText, { color: "#D97706" }]}>Expires in {days}d</Text>
      </View>
    );
  }
  return (
    <View style={[styles.expiryBadge, { backgroundColor: "#ECFDF5" }]}>
      <Ionicons name="time" size={11} color="#059669" />
      <Text style={[styles.expiryText, { color: "#059669" }]}>{days}d left</Text>
    </View>
  );
}

export default function EmployerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading: jobsLoading, refetch } = useListRecruiterJobs();
  const { data: employer } = useGetCompanyProfile();
  const { data: dashboard, refetch: refetchDashboard } = useGetRecruiterDashboard();
  const { data: applications = [], refetch: refetchApplications } = useListRecruiterApplications();

  const updateJob = useUpdateRecruiterJob();
  const closeJob = useCloseRecruiterJob();
  const repostJob = useRepostRecruiterJob();
  const deleteExpired = useCloseExpiredRecruiterJobs();
  const updateCompany = useUpdateCompanyProfile();

  const [refreshing, setRefreshing] = useState(false);
  const [deletingExpired, setDeletingExpired] = useState(false);

  const [logoModalVisible, setLogoModalVisible] = useState(false);
  const [logoInput, setLogoInput] = useState("");
  const [logoSaving, setLogoSaving] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchDashboard(), refetchApplications()]);
    setRefreshing(false);
  };

  const handleLogoPress = () => {
    setLogoInput(employer?.logoUrl ?? "");
    setLogoModalVisible(true);
  };

  async function handleSaveLogo() {
    setLogoSaving(true);
    try {
      await updateCompany.mutateAsync({
        data: { logoUrl: logoInput.trim() || null }
      });
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/company"] });
      setLogoModalVisible(false);
      Alert.alert("Saved", "Company logo updated.");
    } catch {
      Alert.alert("Error", "Could not save logo. Make sure the URL is valid.");
    } finally {
      setLogoSaving(false);
    }
  }

  async function handleCloseListing(job: RecruiterJob) {
    Alert.alert(
      "Close Job",
      `Mark "${job.title}" as closed? It will be removed from public listings immediately.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close Job", style: "destructive", onPress: async () => {
            try {
              await closeJob.mutateAsync({ id: job.id });
              queryClient.invalidateQueries({ queryKey: ["/api/employer/jobs"] });
            } catch { Alert.alert("Error", "Could not close job"); }
          },
        },
      ]
    );
  }

  async function handleTogglePause(job: RecruiterJob) {
    const newStatus = job.status === "active" ? "inactive" : "active";
    try {
      await updateJob.mutateAsync({
        id: job.id,
        data: { status: newStatus }
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employer/jobs"] });
    } catch { Alert.alert("Error", "Could not update job"); }
  }

  async function handleDeleteExpired() {
    const expiredJobs = jobs.filter(j => {
      if (j.status === "closed") return true;
      const days = daysUntil(j.expiresAt);
      return days !== null && days <= 0;
    });

    if (expiredJobs.length === 0) {
      Alert.alert("Nothing to remove", "You have no expired or closed listings.");
      return;
    }

    Alert.alert(
      "Delete Expired Jobs",
      `This will permanently remove ${expiredJobs.length} expired/closed listing${expiredJobs.length > 1 ? "s" : ""}. Are you sure?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All", style: "destructive", onPress: async () => {
            setDeletingExpired(true);
            try {
              const res = await deleteExpired.mutateAsync();
              queryClient.invalidateQueries({ queryKey: ["/api/employer/jobs"] });
              Alert.alert("Done", `Removed ${res.deleted} listing${res.deleted !== 1 ? "s" : ""}.`);
            } catch { Alert.alert("Error", "Could not delete expired jobs"); }
            finally { setDeletingExpired(false); }
          },
        },
      ]
    );
  }

  async function handleRepost(job: RecruiterJob) {
    Alert.alert(
      "Repost Job",
      `Re-list "${job.title}" as a fresh active listing? It will get a new expiry date.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Repost", onPress: async () => {
            try {
              await repostJob.mutateAsync({ id: job.id });
              queryClient.invalidateQueries({ queryKey: ["/api/employer/jobs"] });
              Alert.alert("Reposted!", `"${job.title}" is now live again.`);
            } catch { Alert.alert("Error", "Could not repost job"); }
          },
        },
      ]
    );
  }

  async function handleLogout() {
    Alert.alert("Log Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: async () => { await signOut(); router.replace("/"); } },
    ]);
  }

  const now = Date.now();
  const activeCount = jobs.filter((j) => j.status === "active" && (!j.expiresAt || new Date(j.expiresAt).getTime() > now)).length;
  const expiredCount = jobs.filter((j) => j.status === "closed" || (j.expiresAt && new Date(j.expiresAt).getTime() <= now)).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleLogoPress}>
            <View style={styles.logoCircle}>
              {employer?.logoUrl ? (
                <Image source={{ uri: employer.logoUrl }} style={styles.logoImg} resizeMode="cover" />
              ) : (
                <Ionicons name="business" size={26} color="#2A6F97" />
              )}
              <View style={styles.logoEditBadge}>
                <Ionicons name="camera" size={10} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.companyName}>{employer?.companyName || "Employer"}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.replace("/")} style={styles.homeBtn}>
            <Ionicons name="home-outline" size={20} color="#2A6F97" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color="#2A6F97" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
        {[
          ["Active Jobs", dashboard?.activeJobs ?? activeCount],
          ["New", dashboard?.newApplicants ?? 0],
          ["Shortlisted", dashboard?.shortlisted ?? 0],
          ["Interview", dashboard?.interview ?? 0],
          ["Hired", dashboard?.hired ?? 0],
        ].map(([label, value]) => (
          <View key={String(label)} style={styles.statCard}>
            <Text style={styles.statNum}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.postBtn} onPress={() => router.push("/employer/post-job")}>
          <Ionicons name="add-circle" size={18} color="#fff" />
          <Text style={styles.postBtnText}>Create New Vacancy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applicantsBtn} onPress={() => router.push("/employer/applications")}>
          <Ionicons name="people" size={18} color="#2A6F97" />
          <Text style={styles.applicantsBtnText}>Applicants</Text>
        </TouchableOpacity>
        {expiredCount > 0 && (
          <TouchableOpacity
            style={styles.cleanupBtn}
            onPress={handleDeleteExpired}
            disabled={deletingExpired}
          >
            {deletingExpired
              ? <ActivityIndicator size="small" color="#DC2626" />
              : <Ionicons name="trash-bin" size={18} color="#DC2626" />
            }
            <Text style={styles.cleanupBtnText}>Delete Expired</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionTitle}>Recent Applicants</Text>
          <TouchableOpacity onPress={() => router.push("/employer/applications")}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {applications.slice(0, 3).map((application) => (
          <TouchableOpacity
            key={application.id}
            style={styles.applicantCard}
            onPress={() => router.push(`/employer/application/${application.id}` as any)}
          >
            <View style={styles.applicantIcon}><Ionicons name="person" size={18} color="#2A6F97" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.applicantName}>{application.candidateName}</Text>
              <Text style={styles.applicantMeta}>{application.jobTitle || "Vacancy"} · {application.candidateHeadline || "Hospitality candidate"}</Text>
            </View>
            <Text style={styles.applicantStatus}>
              {application.status === ApplicationStage.AI_Reviewed ? "Reviewed" : application.status}
            </Text>
          </TouchableOpacity>
        ))}
        {applications.length === 0 && !jobsLoading ? (
          <Text style={styles.noApplicants}>New applications will appear here.</Text>
        ) : null}

        <Text style={styles.sectionTitle}>Your Listings</Text>

        {jobsLoading ? (
          <ActivityIndicator color="#2A6F97" style={{ marginTop: 40 }} />
        ) : jobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={48} color="#B0C4D8" />
            <Text style={styles.emptyText}>No listings yet</Text>
            <Text style={styles.emptySubText}>Tap "Post New Job" to get started</Text>
          </View>
        ) : (
          jobs.map((job: any) => {
            const days = daysUntil(job.expiresAt);
            const isExpired = job.status === "closed" || (days !== null && days <= 0);
            return (
              <View key={job.id} style={[styles.jobCard, isExpired && styles.jobCardExpired]}>
                <View style={styles.jobCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.jobTitle, isExpired && { color: "#9CA3AF" }]}>{job.title}</Text>
                    <Text style={styles.jobMeta}>{job.department} · {job.location}</Text>
                    {(job.salaryMin || job.salaryMax) ? (
                      <Text style={styles.jobSalary}>
                        ${job.salaryMin?.toLocaleString()} – ${job.salaryMax?.toLocaleString()}/mo
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.badges}>
                    <View style={[styles.typeBadge, { backgroundColor: (TYPE_COLORS[job.type] || TYPE_COLORS["Normal"]) + "20" }]}>
                      <Text style={[styles.typeBadgeText, { color: (TYPE_COLORS[job.type] || TYPE_COLORS["Normal"]) }]}>{job.type || "Normal"}</Text>
                    </View>
                    {!isExpired && (
                      <View style={[styles.statusBadge, job.status === "active" ? styles.statusActive : styles.statusInactive]}>
                        <Text style={styles.statusText}>{job.status === "active" ? "Live" : "Paused"}</Text>
                      </View>
                    )}
                    <ExpiryBadge expiresAt={job.expiresAt} status={job.status} />
                  </View>
                </View>

                {/* Stats row */}
                <View style={styles.statsInline}>
                  <View style={styles.statInline}>
                    <Ionicons name="eye-outline" size={13} color="#6B7280" />
                    <Text style={styles.statInlineText}>{job.viewCount ?? 0} views</Text>
                  </View>
                  <View style={styles.statInline}>
                    <Ionicons name="paper-plane-outline" size={13} color="#2A6F97" />
                    <Text style={[styles.statInlineText, { color: "#2A6F97" }]}>{job.applyCount ?? 0} applied</Text>
                  </View>
                </View>

                <View style={styles.jobActions}>
                  {!isExpired ? (
                    <>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: "/employer/edit-job", params: { job: JSON.stringify(job) } })}>
                        <Ionicons name="pencil" size={14} color="#2A6F97" />
                        <Text style={[styles.actionText, { color: "#2A6F97" }]}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleTogglePause(job)}>
                        <Ionicons name={job.status === "active" ? "pause-circle" : "play-circle"} size={14} color="#6B7280" />
                        <Text style={styles.actionText}>{job.status === "active" ? "Pause" : "Activate"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleCloseListing(job)}>
                        <Ionicons name="checkmark-circle" size={14} color="#059669" />
                        <Text style={[styles.actionText, { color: "#059669" }]}>Close</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE" }]} onPress={() => handleRepost(job)}>
                      <Ionicons name="refresh-circle" size={14} color="#2A6F97" />
                      <Text style={[styles.actionText, { color: "#2A6F97" }]}>Repost Job</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Logo URL Modal */}
      <Modal visible={logoModalVisible} transparent animationType="slide" onRequestClose={() => setLogoModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Company Logo</Text>
            <Text style={styles.modalSubtitle}>Paste a direct link to your company logo or resort photo. Job seekers will see this on your listings.</Text>

            {logoInput ? (
              <Image source={{ uri: logoInput }} style={styles.logoPreview} resizeMode="cover" />
            ) : (
              <View style={[styles.logoPreview, styles.logoPlaceholder]}>
                <Ionicons name="image-outline" size={40} color="#B0C4D8" />
                <Text style={styles.logoPlaceholderText}>No image</Text>
              </View>
            )}

            <TextInput
              style={styles.logoInput}
              placeholder="https://yourresort.com/logo.jpg"
              value={logoInput}
              onChangeText={setLogoInput}
              autoCapitalize="none"
              keyboardType="url"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setLogoModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveLogo} disabled={logoSaving}>
                {logoSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Logo</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FBF8F1" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14 },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  logoCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#F3ECD9", alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 2, borderColor: "#E4DCC8" },
  logoImg: { width: 52, height: 52, borderRadius: 26 },
  logoEditBadge: { position: "absolute", bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: "#2A6F97", alignItems: "center", justifyContent: "center" },
  greeting: { fontSize: 12, color: "#6B7280" },
  companyName: { fontSize: 17, fontWeight: "700", color: "#1C4E6B" },
  headerRight: { flexDirection: "row", gap: 8, alignItems: "center" },
  homeBtn: { padding: 8, backgroundColor: "#F3ECD9", borderRadius: 10 },
  logoutBtn: { padding: 8, backgroundColor: "#F3ECD9", borderRadius: 10 },
  statsRow: { gap: 10, paddingHorizontal: 20, paddingBottom: 14 },
  statCard: { width: 104, backgroundColor: "#fff", borderRadius: 12, padding: 14, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  statNum: { fontSize: 24, fontWeight: "800", color: "#1C4E6B" },
  statLabel: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  actionRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 16 },
  postBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#2A6F97", borderRadius: 12, padding: 13, justifyContent: "center" },
  postBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  cleanupBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FEF2F2", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: "#FECACA" },
  cleanupBtnText: { color: "#DC2626", fontWeight: "700", fontSize: 14 },
  applicantsBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: "#E4DCC8" },
  applicantsBtnText: { color: "#2A6F97", fontWeight: "700", fontSize: 14 },
  list: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1C4E6B", marginBottom: 12 },
  sectionHeadingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  seeAll: { color: "#2A6F97", fontSize: 13, fontWeight: "700", marginBottom: 12 },
  applicantCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#E4DCC8" },
  applicantIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F3ECD9", alignItems: "center", justifyContent: "center" },
  applicantName: { fontSize: 14, fontWeight: "700", color: "#22303C" },
  applicantMeta: { fontSize: 11, color: "#7A7469", marginTop: 2 },
  applicantStatus: { fontSize: 10, color: "#2A6F97", fontWeight: "700", maxWidth: 72, textAlign: "right" },
  noApplicants: { color: "#7A7469", fontSize: 13, backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 16 },
  emptyState: { alignItems: "center", paddingTop: 48 },
  emptyText: { fontSize: 17, fontWeight: "600", color: "#6B7280", marginTop: 12 },
  emptySubText: { fontSize: 13, color: "#9CA3AF", marginTop: 4 },
  jobCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  jobCardExpired: { backgroundColor: "#FAFAFA", borderWidth: 1, borderColor: "#F3F4F6" },
  jobCardTop: { flexDirection: "row", gap: 12, marginBottom: 12 },
  jobTitle: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 3 },
  jobMeta: { fontSize: 13, color: "#6B7280" },
  jobSalary: { fontSize: 13, color: "#059669", fontWeight: "600", marginTop: 3 },
  badges: { gap: 5, alignItems: "flex-end" },
  typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText: { fontSize: 11, fontWeight: "700" },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusActive: { backgroundColor: "#D1FAE5" },
  statusInactive: { backgroundColor: "#F3F4F6" },
  statusText: { fontSize: 11, fontWeight: "600", color: "#374151" },
  expiryBadge: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  expiryText: { fontSize: 10, fontWeight: "700" },
  statsInline: { flexDirection: "row", gap: 14, marginBottom: 10 },
  statInline: { flexDirection: "row", alignItems: "center", gap: 4 },
  statInlineText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  jobActions: { flexDirection: "row", gap: 4, borderTopWidth: 1, borderTopColor: "#FBF8F1", paddingTop: 10 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, borderRadius: 8, backgroundColor: "#F8FAFC" },
  actionText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, gap: 14 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1C4E6B", textAlign: "center" },
  modalSubtitle: { fontSize: 13, color: "#6B7280", textAlign: "center", lineHeight: 19 },
  logoPreview: { width: "100%", height: 140, borderRadius: 14, backgroundColor: "#FBF8F1" },
  logoPlaceholder: { alignItems: "center", justifyContent: "center", gap: 6 },
  logoPlaceholderText: { fontSize: 13, color: "#B0C4D8" },
  logoInput: { borderWidth: 1, borderColor: "#E4DCC8", borderRadius: 10, padding: 13, fontSize: 14, backgroundColor: "#F8FAFC", color: "#111" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#E4DCC8", alignItems: "center" },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#6B7280" },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: "#2A6F97", alignItems: "center" },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
