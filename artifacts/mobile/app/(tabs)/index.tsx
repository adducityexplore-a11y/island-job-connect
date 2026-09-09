import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Head from "expo-router/head";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AlertsModal from "@/components/AlertsModal";
import DepartmentFilter from "@/components/DepartmentFilter";
import JobCard from "@/components/JobCard";
import { Department } from "@/constants/data";
import { useJobAlerts } from "@/contexts/JobAlertsContext";
import { useColors } from "@/hooks/useColors";
import { useApiJobs } from "@/hooks/useApiJobs";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { jobs: apiJobs } = useApiJobs();
  const { totalUnread } = useJobAlerts();
  const [selectedDept, setSelectedDept] = useState<Department>("All");
  const [alertsOpen, setAlertsOpen] = useState(false);

  const allJobs = useMemo(() => apiJobs, [apiJobs]);

  const featuredJobs = useMemo(
    () => allJobs.filter((j) => j.tags.includes("Featured")),
    [allJobs]
  );

  const filteredJobs = useMemo(
    () =>
      selectedDept === "All"
        ? allJobs
        : allJobs.filter((j) => j.department === selectedDept),
    [selectedDept, allJobs]
  );

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Head>
        <title>The Jobs MV — Maldives Hospitality Jobs</title>
        <meta name="description" content="Find your next resort career in the Maldives. Browse F&B, Front Office, Housekeeping, Diving, Spa and more hospitality jobs across top Maldivian resorts." />
        <meta property="og:title" content="The Jobs MV — Maldives Hospitality Jobs" />
        <meta property="og:description" content="Find your next resort career in the Maldives. Browse jobs across top Maldivian resorts." />
        <meta property="og:url" content="/" />
        <meta name="twitter:title" content="The Jobs MV — Maldives Hospitality Jobs" />
        <meta name="twitter:description" content="Find your next resort career in the Maldives. Browse jobs across top Maldivian resorts." />
      </Head>
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
            {/* ── Hero Header ── */}
            <ImageBackground
              source={require("../../assets/images/maldives_hero.jpg")}
              style={[styles.header, { paddingTop: topPadding + 12 }]}
              imageStyle={styles.headerBg}
            >
              {/* Left-to-right gradient overlay */}
              <LinearGradient
                colors={["#1C4E6B", "#2A6F97", "#2A6F97BB", "#2A6F9755"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
              {/* Subtle bottom darkening for legibility */}
              <LinearGradient
                colors={["transparent", "rgba(0,20,50,0.45)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />

              {/* ── Top row: logo + title + icons ── */}
              <View style={styles.topRow}>
                <View style={styles.logoCircle}>
                  <Image
                    source={require("../../assets/images/logo_final.png")}
                    style={styles.logoSmall}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  The Jobs MV
                </Text>
                <View style={styles.headerIcons}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => router.push("/jobs" as never)}
                  >
                    <Feather name="search" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => setAlertsOpen(true)}>
                    <Feather name="bell" size={20} color="#fff" />
                    {totalUnread > 0 ? (
                      <View style={styles.notifDot}>
                        <Text style={styles.notifDotText}>{totalUnread > 9 ? "9+" : totalUnread}</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── Tagline ── */}
              <Text style={styles.tagline}>
                Connecting You with the Right Opportunities in the Maldives
              </Text>

              {/* ── Stats ── */}
              <View style={styles.statsRow}>
                <View style={styles.statBadge}>
                  <Feather name="briefcase" size={15} color="#fff" />
                  <View style={styles.statTexts}>
                    <Text style={styles.statNum}>{allJobs.length}+</Text>
                    <Text style={styles.statLabel}>Active Jobs</Text>
                  </View>
                </View>
                <View style={styles.statBadge}>
                  <Feather name="home" size={15} color="#fff" />
                  <View style={styles.statTexts}>
                    <Text style={styles.statNum}>27</Text>
                    <Text style={styles.statLabel}>Resorts</Text>
                  </View>
                </View>
                <View style={styles.statBadge}>
                  <Feather name="shield" size={15} color="#fff" />
                  <View style={styles.statTexts}>
                    <Text style={styles.statNum}>Trusted</Text>
                    <Text style={styles.statLabel}>Jobs</Text>
                  </View>
                </View>
              </View>
            </ImageBackground>

            {/* ── Trust Bar ── */}
            <View style={styles.trustBar}>
              {(
                [
                  { icon: "shield", label: "Scam-Free", sub: "Guarantee", color: "#2A9D8F", bg: "#ECFDF5" },
                  { icon: "check-circle", label: "Verified", sub: "Resorts", color: "#2A6F97", bg: "#EFF6FF" },
                  { icon: "user-check", label: "Real Jobs", sub: "Only", color: "#D97706", bg: "#FFFBEB" },
                ] as const
              ).map(({ icon, label, sub, color, bg }) => (
                <View key={label} style={[styles.trustCard, { backgroundColor: bg }]}>
                  <Feather name={icon} size={17} color={color} />
                  <Text style={[styles.trustLabel, { color }]}>{label}</Text>
                  <Text style={styles.trustSub}>{sub}</Text>
                </View>
              ))}
            </View>

            {/* Featured Jobs */}
            {featuredJobs.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text
                    style={[styles.sectionTitle, { color: colors.foreground }]}
                  >
                    Featured Jobs
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedDept("All")}>
                    <Text style={[styles.seeAll, { color: colors.primary }]}>
                      See all
                    </Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredScroll}
                >
                  {featuredJobs.map((job) => (
                    <JobCard key={job.id} job={job} featured />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Department Filter */}
            <DepartmentFilter
              selected={selectedDept}
              onSelect={setSelectedDept}
            />

            {/* Latest Header */}
            <View style={[styles.sectionHeader, styles.latestHeader]}>
              <Text
                style={[styles.sectionTitle, { color: colors.foreground }]}
              >
                {selectedDept === "All"
                  ? "Latest Jobs"
                  : `${selectedDept} Jobs`}
              </Text>
              <Text
                style={[styles.resultCount, { color: colors.mutedForeground }]}
              >
                {filteredJobs.length} results
              </Text>
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
              name="briefcase"
              size={40}
              color={colors.mutedForeground}
            />
            <Text
              style={[styles.emptyText, { color: colors.mutedForeground }]}
            >
              No jobs in this department yet
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

  /* ── Header ── */
  header: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
    overflow: "hidden",
    width: SCREEN_WIDTH,
  },
  headerBg: {
    resizeMode: "cover",
    opacity: 0.92,
  },

  /* Top row */
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  logoSmall: {
    width: 62,
    height: 62,
  },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E63946",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  notifDotText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },

  /* Tagline */
  tagline: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13.5,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },

  /* Stats */
  statsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  statTexts: {
    gap: 0,
  },
  statNum: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    lineHeight: 17,
  },
  statLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 14,
  },

  /* List */
  listContent: { paddingTop: 0 },
  section: { marginBottom: 4, marginTop: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  seeAll: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  featuredScroll: {
    paddingLeft: 16,
    paddingRight: 4,
  },
  latestHeader: {
    paddingHorizontal: 16,
  },
  resultCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  jobItem: {
    paddingHorizontal: 16,
  },
  /* Trust bar */
  trustBar: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  trustCard: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    paddingVertical: 10,
    borderRadius: 12,
  },
  trustLabel: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  trustSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#6B7280",
    textAlign: "center",
  },

  empty: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
});
