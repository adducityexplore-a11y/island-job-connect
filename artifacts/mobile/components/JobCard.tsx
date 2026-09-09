import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Image,
  ImageSourcePropType,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Job, getResortImage } from "@/constants/data";
import { useSavedJobs } from "@/contexts/SavedJobsContext";
import { useColors } from "@/hooks/useColors";
import Badge from "./Badge";

const DEPT_IMAGES: Partial<Record<string, ImageSourcePropType>> = {
  "Kitchen":         require("../assets/images/dept_kitchen.jpg"),
  "F&B":             require("../assets/images/dept_fb.jpg"),
  "Front Office":    require("../assets/images/dept_front_office.jpg"),
  "Housekeeping":    require("../assets/images/dept_housekeeping.jpg"),
  "Spa":             require("../assets/images/dept_spa.jpg"),
  "Recreation":      require("../assets/images/dept_recreation.jpg"),
  "Engineering":     require("../assets/images/dept_engineering.jpg"),
  "Sales & Marketing": require("../assets/images/dept_sales_marketing.jpg"),
  "HR":              require("../assets/images/dept_hr.jpg"),
  "Finance":         require("../assets/images/dept_finance.jpg"),
  "Transport":       require("../assets/images/dept_transport.jpg"),
  "Diving & Watersports": require("../assets/images/dept_diving.jpg"),
  "Guest Services":  require("../assets/images/dept_guest_services.jpg"),
  "IT":              require("../assets/images/dept_it.jpg"),
  "Management":      require("../assets/images/dept_management.jpg"),
  "Kids Club":       require("../assets/images/dept_kids_club.jpg"),
};

function getJobImage(job: Job): ImageSourcePropType {
  if (job.imageUrl) return { uri: job.imageUrl };
  if (job.logoUrl) return { uri: job.logoUrl };
  if (DEPT_IMAGES[job.department]) return DEPT_IMAGES[job.department]!;
  return { uri: getResortImage(job.company) };
}

interface JobCardProps {
  job: Job;
  featured?: boolean;
}


/* ── Helpers ── */
function timeAgo(dateStr: string): string {
  const now = new Date();
  const posted = new Date(dateStr);
  const diffMs = now.getTime() - posted.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return `${Math.floor(diffD / 7)}w ago`;
}

const PERK_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  "Free Accommodation": "home",
  "Staff Meals": "coffee",
  "Annual Flight": "send",
  "Medical Insurance": "shield",
  "Transport Provided": "truck",
};

const PERK_COLORS: Record<string, string> = {
  "Free Accommodation": "#0EA5E9",
  "Staff Meals": "#10B981",
  "Annual Flight": "#8B5CF6",
  "Medical Insurance": "#F59E0B",
  "Transport Provided": "#EC4899",
};

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN ?? "";

export default function JobCard({ job, featured = false }: JobCardProps) {
  const colors = useColors();
  const { isSaved, toggleSaved } = useSavedJobs();
  const saved = isSaved(job.id);
  const isUrgent = job.tags.includes("Urgent");
  const resortImg = getJobImage(job);

  const handleSave = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleSaved(job.id);
  };

  const handleWhatsAppShare = async () => {
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
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const email = job.applyEmail ?? "";
    const subject = encodeURIComponent(`Job Application – ${job.title}`);
    const body = encodeURIComponent(
      `Dear Hiring Manager,\n\nI am writing to apply for the ${job.title} position at ${job.company}. I found this job on The Jobs MV App.\n\nPlease find my CV attached.\n\nThank you.`
    );
    const url = `mailto:${email}?subject=${subject}&body=${body}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "No email app found",
          "Please set up an email app to apply this way."
        );
      }
    } catch {
      Linking.openURL(url);
    }
  };

  /* ── FEATURED card ── */
  if (featured) {
    return (
      <TouchableOpacity
        style={[
          styles.featuredCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={() => router.push(`/job/${job.id}` as never)}
        activeOpacity={0.82}
      >
        {/* Resort photo banner */}
        <View style={styles.bannerWrap}>
          <Image
            source={resortImg}
            style={styles.bannerImg}
            resizeMode="cover"
          />
          {/* Gradient scrim so text on top stays readable */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.55)"]}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Urgency pill on top-left */}
          {isUrgent && (
            <View style={styles.urgentPill}>
              <Feather name="zap" size={10} color="#fff" />
              <Text style={styles.urgentPillText}>URGENT</Text>
            </View>
          )}
          {/* Bookmark on top-right */}
          <TouchableOpacity
            style={[
              styles.bannerBookmark,
              { backgroundColor: saved ? colors.primary : "rgba(0,0,0,0.35)" },
            ]}
            onPress={handleSave}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="bookmark" size={13} color="#fff" />
          </TouchableOpacity>
          {/* Company name over image bottom */}
          <View style={styles.bannerBottom}>
            <Text style={styles.bannerCompany} numberOfLines={1}>
              {job.company}
            </Text>
            <View style={styles.postedRow}>
              <Feather name="clock" size={11} color="rgba(255,255,255,0.8)" />
              <Text style={styles.bannerPosted}>
                {" "}Posted {timeAgo(job.postedAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Card body */}
        <View style={styles.featuredBody}>
          {/* Tags row */}
          {job.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {job.tags.map((tag) => (
                <Badge key={tag} label={tag} />
              ))}
            </View>
          )}

          {/* Title */}
          <Text
            style={[styles.featuredTitle, { color: colors.foreground }]}
            numberOfLines={2}
          >
            {job.title.toUpperCase()}
          </Text>

          {/* Location */}
          <View style={[styles.infoRow, { marginTop: 4 }]}>
            <Feather name="map-pin" size={12} color={colors.mutedForeground} />
            <Text
              style={[styles.infoText, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {" "}{job.location}
            </Text>
          </View>

          {/* Salary */}
          {job.salary && (
            <View style={[styles.infoRow, { marginTop: 4 }]}>
              <Feather name="dollar-sign" size={13} color="#059669" />
              <Text style={styles.salaryText}>{job.salary}</Text>
            </View>
          )}

          {/* Perks */}
          {job.perks && job.perks.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 10 }}
              contentContainerStyle={styles.perksRow}
            >
              {job.perks.map((perk) => (
                <View
                  key={perk}
                  style={[
                    styles.perkChip,
                    {
                      backgroundColor: (PERK_COLORS[perk] ?? "#6B7280") + "18",
                      borderColor: (PERK_COLORS[perk] ?? "#6B7280") + "44",
                    },
                  ]}
                >
                  <Feather
                    name={PERK_ICONS[perk] ?? "check"}
                    size={11}
                    color={PERK_COLORS[perk] ?? "#6B7280"}
                  />
                  <Text
                    style={[
                      styles.perkText,
                      { color: PERK_COLORS[perk] ?? "#6B7280" },
                    ]}
                  >
                    {perk}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Footer */}
          <View style={styles.featuredFooter}>
            <View style={[styles.dept, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.deptText, { color: colors.primary }]}>
                {job.department}
              </Text>
            </View>
            <View style={styles.featuredFooterActions}>
              <TouchableOpacity
                style={styles.waShareBtn}
                onPress={handleWhatsAppShare}
                activeOpacity={0.85}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Feather name="share-2" size={12} color="#25D366" />
              </TouchableOpacity>
              {job.applyEmail && (
                <TouchableOpacity
                  style={[styles.applySmall, { backgroundColor: colors.primary }]}
                  onPress={handleEmail}
                  activeOpacity={0.85}
                >
                  <Feather name="mail" size={12} color="#fff" />
                  <Text style={styles.applySmallText}>Apply</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  /* ── REGULAR (list) card ── */
  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: saved ? colors.primary : colors.border,
        },
      ]}
      onPress={() => router.push(`/job/${job.id}` as never)}
      activeOpacity={0.8}
    >
      {/* Bookmark */}
      <TouchableOpacity
        style={[
          styles.bookmarkBtnAbs,
          {
            backgroundColor: saved ? colors.primary : "rgba(0,0,0,0.06)",
          },
        ]}
        onPress={handleSave}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather
          name="bookmark"
          size={13}
          color={saved ? "#fff" : colors.mutedForeground}
        />
      </TouchableOpacity>

      <View style={styles.headerRow}>
        {/* Resort photo avatar */}
        <View style={styles.resortThumb}>
          <Image
            source={resortImg}
            style={styles.resortThumbImg}
            resizeMode="cover"
          />
        </View>

        <View style={styles.headerInfo}>
          <Text
            style={[styles.company, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {job.company}
          </Text>
          <View style={styles.infoRow}>
            <Feather name="map-pin" size={11} color={colors.mutedForeground} />
            <Text
              style={[styles.infoText, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {" "}{job.location}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Feather name="clock" size={11} color={colors.mutedForeground} />
            <Text
              style={[styles.infoText, { color: colors.mutedForeground }]}
            >
              {" "}{timeAgo(job.postedAt)}
            </Text>
          </View>
        </View>

        {job.tags.length > 0 && (
          <View style={styles.badges}>
            {job.tags.map((tag) => (
              <Badge key={tag} label={tag} />
            ))}
          </View>
        )}
      </View>

      <Text
        style={[styles.title, { color: colors.foreground }]}
        numberOfLines={2}
      >
        {job.title}
      </Text>

      {/* Perks (compact) */}
      {job.perks && job.perks.length > 0 && (
        <View style={styles.perksRowCompact}>
          {job.perks.slice(0, 2).map((perk) => (
            <View
              key={perk}
              style={[
                styles.perkChipCompact,
                { backgroundColor: (PERK_COLORS[perk] ?? "#6B7280") + "15" },
              ]}
            >
              <Feather
                name={PERK_ICONS[perk] ?? "check"}
                size={10}
                color={PERK_COLORS[perk] ?? "#6B7280"}
              />
              <Text
                style={[
                  styles.perkTextCompact,
                  { color: PERK_COLORS[perk] ?? "#6B7280" },
                ]}
              >
                {perk}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <View style={[styles.dept, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.deptText, { color: colors.primary }]}>
            {job.department}
          </Text>
        </View>
        {job.salary && (
          <Text style={styles.salaryText}>{job.salary}</Text>
        )}
      </View>

      {((job.viewCount ?? 0) > 0 || (job.applyCount ?? 0) > 0) && (
        <View style={styles.statsRow}>
          {(job.viewCount ?? 0) > 0 && (
            <View style={styles.statChip}>
              <Feather name="eye" size={11} color="#6B7280" />
              <Text style={styles.statChipText}>{job.viewCount} views</Text>
            </View>
          )}
          {(job.applyCount ?? 0) > 0 && (
            <View style={[styles.statChip, { backgroundColor: "#EFF6FF" }]}>
              <Feather name="send" size={11} color="#0077B6" />
              <Text style={[styles.statChipText, { color: "#0077B6" }]}>{job.applyCount} applied</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.waShareFull}
          onPress={handleWhatsAppShare}
          activeOpacity={0.85}
        >
          <Feather name="share-2" size={13} color="#25D366" />
          <Text style={styles.waShareFullText}>Share on WhatsApp</Text>
        </TouchableOpacity>
        {job.applyEmail && (
          <TouchableOpacity
            style={[styles.applyBtnSmall, { backgroundColor: colors.primary }]}
            onPress={handleEmail}
            activeOpacity={0.85}
          >
            <Feather name="mail" size={13} color="#fff" />
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  /* ── Featured card ── */
  featuredCard: {
    borderRadius: 16,
    borderWidth: 1,
    width: 295,
    marginRight: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  bannerWrap: {
    height: 140,
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  bannerImg: {
    width: "100%",
    height: "100%",
  },
  urgentPill: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  urgentPillText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  bannerBookmark: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerBottom: {
    position: "absolute",
    bottom: 10,
    left: 12,
    right: 12,
    gap: 2,
  },
  bannerCompany: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bannerPosted: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  featuredBody: {
    padding: 14,
    gap: 0,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  featuredTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
    lineHeight: 22,
    marginTop: 2,
  },
  featuredFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  applySmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  applySmallText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },

  /* ── Regular card ── */
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  bookmarkBtnAbs: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 10,
    paddingRight: 36,
  },
  resortThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: "hidden",
    flexShrink: 0,
  },
  resortThumbImg: {
    width: "100%",
    height: "100%",
  },
  headerInfo: {
    flex: 1,
    gap: 3,
  },
  company: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: 11.5,
    fontFamily: "Inter_400Regular",
  },
  badges: {
    flexDirection: "column",
    gap: 4,
    alignItems: "flex-end",
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
    lineHeight: 22,
  },
  perksRowCompact: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  perkChipCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  perkTextCompact: {
    fontSize: 10.5,
    fontFamily: "Inter_500Medium",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  dept: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deptText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  salaryText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#059669",
  },
  perksRow: {
    flexDirection: "row",
    gap: 6,
  },
  perkChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  perkText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    flexWrap: "wrap",
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statChipText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#6B7280",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  waShareFull: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: "#25D366",
    backgroundColor: "#F0FDF4",
  },
  waShareFullText: {
    color: "#16A34A",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  applyBtnSmall: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  applyBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  featuredFooterActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  waShareBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#25D366",
    backgroundColor: "#F0FDF4",
  },
  postedRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
