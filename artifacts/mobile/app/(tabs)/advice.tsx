import { Feather } from "@expo/vector-icons";
import Head from "expo-router/head";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface TipItem {
  id: string;
  title: string;
  body: string;
}

const INTERVIEW_TIPS: TipItem[] = [
  {
    id: "i1",
    title: "Research the resort before your interview",
    body: "Know the resort's brand, location, number of villas, and any awards they have won. Mention something specific about their property — this shows genuine interest and professionalism.",
  },
  {
    id: "i2",
    title: "Dress professionally and arrive early",
    body: "First impressions are everything in luxury hospitality. Wear clean, smart-casual attire. Arrive 10 minutes early for in-person interviews and test your connection well before virtual calls.",
  },
  {
    id: "i3",
    title: "Practice common hospitality interview questions",
    body: 'Examples: "Tell me about a time you handled a difficult guest", "How do you handle working in an isolated island environment?", "What does luxury service mean to you?". Prepare specific, real examples.',
  },
  {
    id: "i4",
    title: "Highlight your adaptability",
    body: "Resort life in the Maldives requires living and working in close quarters on an island. Show that you are comfortable with this lifestyle, enjoy team camaraderie, and can thrive away from home.",
  },
  {
    id: "i5",
    title: "Ask thoughtful questions",
    body: 'Asking questions shows engagement. Try: "What does a typical day look like for this role?", "How do you support staff wellbeing on the island?", or "What qualities do your best team members share?"',
  },
];

const CV_TIPS: TipItem[] = [
  {
    id: "c1",
    title: "Keep your CV to 1–2 pages maximum",
    body: "Recruiters in hospitality review many CVs quickly. Keep yours concise. One page is ideal for those with under 5 years of experience; two pages for senior roles. Remove irrelevant jobs.",
  },
  {
    id: "c2",
    title: "Lead with your most relevant experience",
    body: "Put your most recent and most relevant hospitality experience at the top. List your job title, employer name, dates, location, and 3–4 bullet points of key achievements and responsibilities.",
  },
  {
    id: "c3",
    title: "Include certifications prominently",
    body: "Certifications matter in Maldives hospitality. List PADI, WSET, First Aid/CPR, HACCP, Food Handling, language certificates, or any luxury brand training you have completed.",
  },
  {
    id: "c4",
    title: "Use action verbs and numbers",
    body: 'Start bullet points with strong verbs: "Managed a team of 12", "Increased upsell revenue by 22%", "Trained 8 new staff members". Quantify your impact whenever possible.',
  },
  {
    id: "c5",
    title: "Add a professional photo and clear contact details",
    body: "In Maldives hospitality, including a professional headshot photo is standard practice. Make sure your phone number (with country code), email, and nationality are clearly visible at the top.",
  },
  {
    id: "c6",
    title: "Tailor your CV for each application",
    body: "Adjust your opening summary and key skills to match the specific role you are applying for. A CV for a Spa Therapist role should feel different from one for a Front Office Supervisor.",
  },
];

function TipCard({ tip }: { tip: TipItem }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={[
        styles.tipCard,
        {
          backgroundColor: colors.card,
          borderColor: expanded ? colors.primary : colors.border,
        },
      ]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      <View style={styles.tipHeader}>
        <View style={[styles.tipBullet, { backgroundColor: colors.secondary }]}>
          <Feather name="check" size={12} color={colors.primary} />
        </View>
        <Text
          style={[styles.tipTitle, { color: colors.foreground }]}
          numberOfLines={expanded ? undefined : 2}
        >
          {tip.title}
        </Text>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.mutedForeground}
        />
      </View>
      {expanded && (
        <Text style={[styles.tipBody, { color: colors.foreground }]}>
          {tip.body}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function AdviceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Head>
        <title>Career Tips for Maldives Hospitality — The Jobs MV</title>
        <meta name="description" content="Expert interview tips and CV advice for Maldives resort job seekers. Learn how to stand out and land your dream hospitality role in the Maldives." />
        <meta property="og:title" content="Career Tips for Maldives Hospitality — The Jobs MV" />
        <meta property="og:description" content="Expert interview tips and CV writing advice for Maldives resort job seekers." />
        <meta property="og:url" content="/advice" />
      </Head>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.primary, paddingTop: topPadding + 14 },
        ]}
      >
        <Text style={styles.headerTitle}>Career Advice</Text>
        <Text style={styles.headerSubtitle}>
          Expert guidance for Maldives hospitality professionals
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad + 40 },
        ]}
      >
        {/* ── Trust & Safety ── */}
        <View style={[styles.trustSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.trustHeading, { color: colors.foreground }]}>
            Why Trust The Jobs MV?
          </Text>
          <View style={styles.trustItems}>
            <View style={styles.trustItem}>
              <View style={[styles.trustIcon, { backgroundColor: "#ECFDF5" }]}>
                <Feather name="shield" size={18} color="#2A9D8F" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.trustItemTitle, { color: colors.foreground }]}>
                  Scam-Free Guarantee
                </Text>
                <Text style={[styles.trustItemText, { color: colors.mutedForeground }]}>
                  Every listing is manually reviewed. We never charge job seekers a fee to apply.
                </Text>
              </View>
            </View>
            <View style={[styles.trustDivider, { backgroundColor: colors.border }]} />
            <View style={styles.trustItem}>
              <View style={[styles.trustIcon, { backgroundColor: "#EFF6FF" }]}>
                <Feather name="check-circle" size={18} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.trustItemTitle, { color: colors.foreground }]}>
                  Verified Resort Partners
                </Text>
                <Text style={[styles.trustItemText, { color: colors.mutedForeground }]}>
                  Resorts with a Verified badge are confirmed partners — their HR contacts are authenticated.
                </Text>
              </View>
            </View>
            <View style={[styles.trustDivider, { backgroundColor: colors.border }]} />
            <View style={styles.trustItem}>
              <View style={[styles.trustIcon, { backgroundColor: "#FEF3C7" }]}>
                <Feather name="user-check" size={18} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.trustItemTitle, { color: colors.foreground }]}>
                  Verified Recruiters
                </Text>
                <Text style={[styles.trustItemText, { color: colors.mutedForeground }]}>
                  Recruiters listing jobs on The Jobs MV are vetted and must provide verifiable resort credentials.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* WhatsApp Apply Banner */}
        <View style={[styles.banner, { backgroundColor: "#ECFDF5", borderColor: "#6EE7B7" }]}>
          <Feather name="message-circle" size={22} color="#059669" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: "#065F46" }]}>
              Apply via WhatsApp
            </Text>
            <Text style={[styles.bannerText, { color: "#047857" }]}>
              Most Maldives resorts prefer WhatsApp applications. Be professional and include your CV in your first message.
            </Text>
          </View>
        </View>

        {/* Interview Tips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: "#F3ECD9" }]}>
              <Feather name="users" size={16} color={colors.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Interview Advice
            </Text>
          </View>
          {INTERVIEW_TIPS.map((tip) => (
            <TipCard key={tip.id} tip={tip} />
          ))}
        </View>

        {/* CV Tips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: "#FEF3C7" }]}>
              <Feather name="file-text" size={16} color="#D97706" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              CV Advice
            </Text>
          </View>
          {CV_TIPS.map((tip) => (
            <TipCard key={tip.id} tip={tip} />
          ))}
        </View>

        {/* WhatsApp Message Template */}
        <View style={[styles.templateBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.templateTitle, { color: colors.foreground }]}>
            WhatsApp Message Template
          </Text>
          <Text style={[styles.templateText, { color: colors.mutedForeground }]}>
            {`Hello, I am writing to apply for the [Job Title] position at [Resort Name]. My name is [Your Name] and I have [X] years of experience in [Department].\n\nI am available [immediately / from date] and my expected salary is [amount].\n\nPlease find my CV attached. I look forward to hearing from you.\n\nThank you.`}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.78)",
  },
  scrollContent: { paddingTop: 16, paddingHorizontal: 16 },

  /* Trust section */
  trustSection: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    gap: 4,
  },
  trustHeading: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  trustItems: { gap: 0 },
  trustItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
  },
  trustDivider: { height: 1 },
  trustIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  trustItemTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  trustItemText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },

  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  bannerTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  section: { marginBottom: 28, gap: 10 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  tipCard: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 10 },
  tipHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  tipBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tipTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
  tipBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    paddingLeft: 34,
  },
  templateBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  templateTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  templateText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
});
