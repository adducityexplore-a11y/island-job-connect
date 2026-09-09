import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import Head from "expo-router/head";
import React, { useEffect, useRef } from "react";
import {
  ImageBackground,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Badge from "@/components/Badge";
import {
  RESORT_ABOUT,
  VERIFIED_RESORTS,
  getResortImage,
  Job,
} from "@/constants/data";
import { useSavedJobs } from "@/contexts/SavedJobsContext";
import { useApiJobs, trackJobView, trackJobApply } from "@/hooks/useApiJobs";
import { useColors } from "@/hooks/useColors";
import { useCreateApplication } from "@workspace/api-client-react";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN ?? "";

const DEPT_IMAGES: Partial<Record<string, number>> = {
  "Kitchen":         require("../../assets/images/dept_kitchen.jpg"),
  "F&B":             require("../../assets/images/dept_fb.jpg"),
  "Front Office":    require("../../assets/images/dept_front_office.jpg"),
  "Housekeeping":    require("../../assets/images/dept_housekeeping.jpg"),
  "Spa":             require("../../assets/images/dept_spa.jpg"),
  "Recreation":      require("../../assets/images/dept_recreation.jpg"),
  "Engineering":     require("../../assets/images/dept_engineering.jpg"),
  "Sales & Marketing": require("../../assets/images/dept_sales_marketing.jpg"),
  "HR":              require("../../assets/images/dept_hr.jpg"),
  "Finance":         require("../../assets/images/dept_finance.jpg"),
  "Transport":       require("../../assets/images/dept_transport.jpg"),
  "Diving & Watersports": require("../../assets/images/dept_diving.jpg"),
  "Guest Services":  require("../../assets/images/dept_guest_services.jpg"),
  "IT":              require("../../assets/images/dept_it.jpg"),
  "Management":      require("../../assets/images/dept_management.jpg"),
  "Kids Club":       require("../../assets/images/dept_kids_club.jpg"),
};

function getJobImage(job: Job): { uri: string } | number {
  if (job.imageUrl) return { uri: job.imageUrl };
  if (job.logoUrl) return { uri: job.logoUrl };
  if (DEPT_IMAGES[job.department]) return DEPT_IMAGES[job.department]!;
  return { uri: getResortImage(job.company) };
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isSaved, toggleSaved } = useSavedJobs();
  const { jobs } = useApiJobs();
  const createApplication = useCreateApplication();

  const [hasApplied, setHasApplied] = React.useState(false);
  const [applying, setApplying] = React.useState(false);
  const [applicationError, setApplicationError] = React.useState<string | null>(null);

  const job = jobs.find((j) => j.id === id);
  const saved = job ? isSaved(job.id) : false;
  const isVerified = job ? VERIFIED_RESORTS.has(job.company) : false;
  const resortAbout = job ? (RESORT_ABOUT[job.company] ?? null) : null;
  const resortImage = job ? getJobImage(job) : null;

  const viewTracked = useRef(false);
  useEffect(() => {
    if (job?.numericId && !viewTracked.current) {
      viewTracked.current = true;
      trackJobView(job.numericId);
    }
  }, [job?.numericId]);

  const handleToggleSave = async () => {
    if (!job) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleSaved(job.id);
  };

  const handleShare = async () => {
    if (!job) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const link = DOMAIN ? `https://${DOMAIN}/job/${job.id}` : "";
    const lines = [
      `Job Title: *${job.title}*`,
      `Resort: ${job.company}`,
      `Location: ${job.location}`,
      job.salary ? `Salary: ${job.salary}` : null,
      `Department: ${job.department}`,
      link ? `\nView job: ${link}` : null,
      `\nFound on The Jobs MV`,
    ].filter(Boolean).join("\n");
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(lines)}`);
  };

  const handleEmail = async () => {
    if (!job?.applyEmail) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (job.numericId) trackJobApply(job.numericId);
    const subject = `Application for ${job.title} — ${job.company}`;
    const body = `Dear Hiring Manager,\n\nI am writing to express my interest in the ${job.title} position at ${job.company}.\n\nI found this opportunity on The Jobs MV App.\n\nPlease find my CV attached.\n\nThank you,`;
    Linking.openURL(
      `mailto:${job.applyEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    );
  };

  const handleWhatsApp = async () => {
    if (!job?.applyWhatsApp) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (job.numericId) trackJobApply(job.numericId);
    const msg = `Hello, I am interested in the ${job.title} position at ${job.company}. I found this job on The Jobs MV App. Please let me know if it is still available. Thank you.`;
    Linking.openURL(
      `https://wa.me/${job.applyWhatsApp.replace(/\+/g, "")}?text=${encodeURIComponent(msg)}`
    );
  };

  const handleApplyDirect = async () => {
    if (!job?.numericId) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setApplying(true);
    setApplicationError(null);
    try {
      if (job.numericId) trackJobApply(job.numericId);
      await createApplication.mutateAsync({
        id: job.numericId,
        data: {}
      });
      setHasApplied(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      if (e?.error?.includes("already applied") || e?.error?.includes("duplicate")) {
        setHasApplied(true);
        setApplicationError("You have already applied for this job.");
      } else {
        setApplicationError(e?.error || "Failed to submit application. Please try again.");
      }
    } finally {
      setApplying(false);
    }
  };

  if (!job) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>
          Job not found
        </Text>
      </View>
    );
  }

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
  const siteUrl = domain ? `https://${domain}` : "https://thejobsmv.com";
  const pageUrl = `${siteUrl}/job/${job.id}`;
  const jobDescription = job.description
    ? job.description.replace(/<[^>]+>/g, "").slice(0, 160)
    : `${job.title} at ${job.company} in ${job.location}. Apply via The Jobs MV.`;
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description ?? jobDescription,
    datePosted: new Date().toISOString().split("T")[0],
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressCountry: "MV",
      },
    },
    employmentType: "FULL_TIME",
    url: pageUrl,
    ...(job.salary
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "USD",
            value: { "@type": "QuantitativeValue", description: job.salary },
          },
        }
      : {}),
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Head>
        <title>{`${job.title} at ${job.company} — The Jobs MV`}</title>
        <meta name="description" content={jobDescription} />
        <meta property="og:title" content={`${job.title} at ${job.company}`} />
        <meta property="og:description" content={jobDescription} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="article" />
        <meta name="twitter:title" content={`${job.title} at ${job.company} — The Jobs MV`} />
        <meta name="twitter:description" content={jobDescription} />
        <script type="application/ld+json">{jsonLd}</script>
      </Head>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 200 + bottomPad },
        ]}
      >
        {/* ── Resort Photo Banner ── */}
        <ImageBackground
          source={resortImage ?? { uri: "" }}
          style={[styles.photoBanner, { paddingTop: topPad }]}
          imageStyle={styles.photoBannerImg}
        >
          <LinearGradient
            colors={["rgba(0,15,40,0.18)", "rgba(0,15,40,0.78)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Top action row */}
          <View style={styles.bannerTopRow}>
            <TouchableOpacity
              style={styles.bannerIconBtn}
              onPress={() => router.back()}
            >
              <Feather name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={styles.bannerIconBtn} onPress={handleShare}>
              <Feather name="share-2" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.bannerIconBtn,
                saved && { backgroundColor: "#fff" },
              ]}
              onPress={handleToggleSave}
            >
              <Feather
                name="bookmark"
                size={18}
                color={saved ? colors.primary : "#fff"}
              />
            </TouchableOpacity>
          </View>

          {/* Company info overlaid on photo */}
          <View style={styles.bannerInfo}>
            {isVerified && (
              <View style={styles.verifiedBadge}>
                <Feather name="shield" size={12} color="#6EE7B7" />
                <Text style={styles.verifiedBadgeText}>Verified Resort</Text>
              </View>
            )}
            <Text style={styles.bannerCompany}>{job.company}</Text>
            <View style={styles.bannerLocationRow}>
              <Feather name="map-pin" size={13} color="rgba(255,255,255,0.85)" />
              <Text style={styles.bannerLocationText}> {job.location}</Text>
            </View>
            {job.tags.length > 0 && (
              <View style={styles.badgesRow}>
                {job.tags.map((tag) => (
                  <Badge key={tag} label={tag} />
                ))}
              </View>
            )}
          </View>
        </ImageBackground>

        {/* ── Job Title Block ── */}
        <View style={styles.titleBlock}>
          <Text style={[styles.jobTitle, { color: colors.foreground }]}>
            {job.title}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.chip, { backgroundColor: colors.secondary }]}>
              <Feather name="tag" size={12} color={colors.primary} />
              <Text style={[styles.chipText, { color: colors.primary }]}>
                {" "}
                {job.department}
              </Text>
            </View>
            {job.salary && (
              <View style={[styles.chip, { backgroundColor: "#ECFDF5" }]}>
                <Feather name="dollar-sign" size={12} color="#059669" />
                <Text style={[styles.chipText, { color: "#059669" }]}>
                  {job.salary}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.deadlineRow}>
            <Feather name="clock" size={14} color={colors.mutedForeground} />
            <Text style={[styles.deadlineText, { color: colors.mutedForeground }]}>
              {" "}
              Application Deadline: {job.deadline}
            </Text>
          </View>
        </View>

        {/* ── Staff Benefits ── */}
        {job.perks && job.perks.length > 0 && (
          <View style={[styles.section, { borderTopColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Staff Benefits
            </Text>
            <View style={styles.perksRow}>
              {job.perks.map((perk) => (
                <View
                  key={perk}
                  style={[
                    styles.perkChip,
                    { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
                  ]}
                >
                  <Feather name="check-circle" size={13} color="#2563EB" />
                  <Text style={[styles.perkText, { color: "#1D4ED8" }]}>
                    {perk}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── About the Role ── */}
        <View style={[styles.section, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            About the Role
          </Text>
          <Text style={[styles.bodyText, { color: colors.foreground }]}>
            {job.description}
          </Text>
        </View>

        {/* ── Requirements ── */}
        <View style={[styles.section, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Requirements
          </Text>
          {job.requirements.map((req, i) => (
            <View key={i} style={styles.reqItem}>
              <View
                style={[styles.bullet, { backgroundColor: colors.primary }]}
              />
              <Text style={[styles.reqText, { color: colors.foreground }]}>
                {req}
              </Text>
            </View>
          ))}
        </View>

        {/* ── About the Resort ── */}
        {resortAbout && (
          <View style={[styles.section, { borderTopColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              About {job.company}
            </Text>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>
              {resortAbout}
            </Text>
            {isVerified && (
              <View
                style={[
                  styles.verifiedBlock,
                  { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
                ]}
              >
                <Feather name="shield" size={16} color="#10B981" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.verifiedBlockTitle}>Verified Resort</Text>
                  <Text style={styles.verifiedBlockText}>
                    This resort is a verified partner of The Jobs MV. All
                    listings from verified partners are reviewed for
                    authenticity — no fake jobs, no fees for applicants.
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── How to Apply ── */}
        <View style={[styles.section, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            How to Apply
          </Text>
          <Text style={[styles.bodyText, { color: colors.mutedForeground }]}>
            Apply directly using the buttons below. Mention you found this job
            on The Jobs MV App and attach your CV in your first message.
          </Text>
        </View>

        <Text style={[styles.postedText, { color: colors.mutedForeground }]}>
          Posted: {job.postedAt}
        </Text>
      </ScrollView>

      {/* ── Sticky Apply Bar ── */}
      <View
        style={[
          styles.applyBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: bottomPad + 16,
          },
        ]}
      >
        {/* Share on WhatsApp */}
        <TouchableOpacity
          style={styles.waShareBar}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Feather name="share-2" size={16} color="#16A34A" />
          <Text style={styles.waShareBarText}>Share on WhatsApp</Text>
        </TouchableOpacity>

        {/* Apply buttons row */}
        <View style={styles.applyRow}>
          <TouchableOpacity
            style={[styles.directApplyBtn, { backgroundColor: hasApplied ? "#10B981" : colors.primary }]}
            onPress={handleApplyDirect}
            activeOpacity={0.85}
            disabled={applying || hasApplied}
          >
            {applying ? (
              <Text style={styles.applyBtnText}>Sending...</Text>
            ) : hasApplied ? (
              <>
                <Feather name="check" size={16} color="#fff" />
                <Text style={styles.applyBtnText}>Applied</Text>
              </>
            ) : (
              <>
                <Feather name="send" size={16} color="#fff" />
                <Text style={styles.applyBtnText}>Apply Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {applicationError ? (
          <Text style={{ color: "#DC2626", fontSize: 13, textAlign: "center", marginTop: 4 }}>
            {applicationError}
          </Text>
        ) : null}

        {/* Fallback apply row */}
        {(job.applyWhatsApp || job.applyEmail) && (
          <View style={[styles.applyRow, { marginTop: 8 }]}>
            {job.applyWhatsApp && (
              <TouchableOpacity
                style={[styles.whatsappBtn, job.applyEmail && { flex: 1 }]}
                onPress={handleWhatsApp}
                activeOpacity={0.85}
              >
                <Feather name="message-circle" size={16} color="#fff" />
                <Text style={styles.applyBtnText}>Apply via WA</Text>
              </TouchableOpacity>
            )}
            {job.applyEmail && (
              <TouchableOpacity
                style={[styles.emailBtn, { backgroundColor: "#475569" }, job.applyWhatsApp && { flex: 1 }]}
                onPress={handleEmail}
                activeOpacity={0.85}
              >
                <Feather name="mail" size={16} color="#fff" />
                <Text style={styles.applyBtnText}>Apply via Email</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {},
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  notFoundText: { fontSize: 16, fontFamily: "Inter_400Regular" },

  /* Photo banner */
  photoBanner: {
    height: 290,
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  photoBannerImg: { resizeMode: "cover" },
  bannerTopRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 12,
  },
  bannerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.32)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  bannerInfo: { gap: 6 },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(16,185,129,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.4)",
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#6EE7B7",
  },
  bannerCompany: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  bannerLocationRow: { flexDirection: "row", alignItems: "center" },
  bannerLocationText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.85)",
  },
  badgesRow: { flexDirection: "row", gap: 8, marginTop: 2 },

  /* Title block */
  titleBlock: { padding: 20, gap: 12 },
  jobTitle: { fontSize: 24, fontFamily: "Inter_700Bold", lineHeight: 32 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  deadlineRow: { flexDirection: "row", alignItems: "center" },
  deadlineText: { fontSize: 13, fontFamily: "Inter_400Regular" },

  /* Sections */
  section: {
    marginHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  bodyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 23,
  },
  reqItem: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 9,
    flexShrink: 0,
  },
  reqText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 23 },

  /* Perks */
  perksRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  perkChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  perkText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  /* Verified block */
  verifiedBlock: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  verifiedBlockTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#065F46",
    marginBottom: 3,
  },
  verifiedBlockText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#047857",
    lineHeight: 18,
  },

  /* Posted */
  postedText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },

  /* Apply bar */
  applyBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  waShareBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#25D366",
    backgroundColor: "#F0FDF4",
  },
  waShareBarText: {
    color: "#16A34A",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  applyRow: {
    flexDirection: "row",
    gap: 8,
  },
  directApplyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 12,
    gap: 7,
    backgroundColor: "#25D366",
    paddingHorizontal: 12,
  },
  emailBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 12,
    gap: 7,
    paddingHorizontal: 12,
  },
  applyBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
