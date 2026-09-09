import { Feather } from "@expo/vector-icons";
import Head from "expo-router/head";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AlertsModal from "@/components/AlertsModal";
import DepartmentFilter from "@/components/DepartmentFilter";
import JobCard from "@/components/JobCard";
import { Department } from "@/constants/data";
import { useJobAlerts } from "@/contexts/JobAlertsContext";
import { useSavedJobs } from "@/contexts/SavedJobsContext";
import { useColors } from "@/hooks/useColors";
import { useApiJobs } from "@/hooks/useApiJobs";

export default function JobsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { savedIds } = useSavedJobs();
  const { jobs: apiJobs, loading } = useApiJobs();
  const { totalUnread } = useJobAlerts();
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState<Department>("All");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const allJobs = useMemo(() => apiJobs, [apiJobs]);

  const filteredJobs = useMemo(() => {
    return allJobs.filter((job) => {
      if (showSavedOnly && !savedIds.includes(job.id)) return false;
      const matchesDept =
        selectedDept === "All" || job.department === selectedDept;
      const q = search.toLowerCase();
      const matchesSearch =
        search === "" ||
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q);
      return matchesDept && matchesSearch;
    });
  }, [search, selectedDept, showSavedOnly, savedIds, allJobs]);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Head>
        <title>Browse Jobs in the Maldives — The Jobs MV</title>
        <meta name="description" content="Search and filter hundreds of Maldives resort and hospitality jobs by department. F&B, Front Office, Diving, Spa, Housekeeping and more." />
        <meta property="og:title" content="Browse Jobs in the Maldives — The Jobs MV" />
        <meta property="og:description" content="Search and filter Maldives resort jobs by department. Find your perfect hospitality role today." />
        <meta property="og:url" content="/jobs" />
        <meta name="twitter:title" content="Browse Jobs in the Maldives — The Jobs MV" />
        <meta name="twitter:description" content="Search and filter Maldives resort jobs by department." />
      </Head>
      {/* Header */}
      <View
        style={[
          styles.searchHeader,
          { backgroundColor: colors.primary, paddingTop: topPadding + 14 },
        ]}
      >
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>Browse Jobs</Text>
          <View style={styles.headerActions}>
            {/* Alerts bell */}
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => setAlertsOpen(true)}
              activeOpacity={0.8}
            >
              <Feather name="bell" size={18} color="#fff" />
              {totalUnread > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {totalUnread > 9 ? "9+" : totalUnread}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Saved toggle */}
            <TouchableOpacity
              style={[
                styles.savedToggle,
                {
                  backgroundColor: showSavedOnly
                    ? "#fff"
                    : "rgba(255,255,255,0.2)",
                },
              ]}
              onPress={() => setShowSavedOnly(!showSavedOnly)}
              activeOpacity={0.8}
            >
              <Feather
                name="bookmark"
                size={15}
                color={showSavedOnly ? colors.primary : "#fff"}
              />
              <Text
                style={[
                  styles.savedToggleText,
                  { color: showSavedOnly ? colors.primary : "#fff" },
                ]}
              >
                Saved{savedIds.length > 0 ? ` (${savedIds.length})` : ""}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: "rgba(255,255,255,0.95)" },
          ]}
        >
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[
              styles.searchInput,
              {
                color: colors.foreground,
                fontFamily: "Inter_400Regular",
              },
            ]}
            placeholder="Search jobs, companies, locations..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom:
              (Platform.OS === "web" ? 34 : insets.bottom) + 100,
          },
        ]}
        ListHeaderComponent={
          <>
            {!showSavedOnly && (
              <DepartmentFilter
                selected={selectedDept}
                onSelect={setSelectedDept}
              />
            )}
            <View style={styles.resultsRow}>
              <Text
                style={[styles.resultsText, { color: colors.mutedForeground }]}
              >
                {showSavedOnly
                  ? "Your saved jobs"
                  : `${filteredJobs.length} ${filteredJobs.length === 1 ? "job" : "jobs"} found`}
              </Text>
              {(search.length > 0 || selectedDept !== "All") &&
                !showSavedOnly && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearch("");
                      setSelectedDept("All");
                    }}
                  >
                    <Text
                      style={[styles.clearText, { color: colors.primary }]}
                    >
                      Clear filters
                    </Text>
                  </TouchableOpacity>
                )}
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.jobItem}>
            <JobCard job={item} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather
              name={showSavedOnly ? "bookmark" : "search"}
              size={40}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {showSavedOnly ? "No saved jobs yet" : "No jobs found"}
            </Text>
            <Text
              style={[styles.emptyText, { color: colors.mutedForeground }]}
            >
              {showSavedOnly
                ? "Tap the bookmark icon on any job to save it here"
                : "Try different keywords or filters"}
            </Text>
          </View>
        }
      />

      <AlertsModal visible={alertsOpen} onClose={() => setAlertsOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#E63946",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#2A6F97",
  },
  bellBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  savedToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  savedToggleText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  listContent: { paddingTop: 4 },
  resultsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resultsText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  clearText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  jobItem: { paddingHorizontal: 16 },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
