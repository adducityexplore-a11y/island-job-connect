import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Head from "expo-router/head";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useEmployerAuth } from "@/contexts/EmployerAuthContext";

export default function PostTab() {
  const { employer, isLoading } = useEmployerAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isLoading) {
      if (employer) {
        router.replace("/employer/dashboard");
      }
    }
  }, [isLoading, employer]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2A6F97" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <Head>
        <title>Post a Hospitality Job in the Maldives — The Jobs MV</title>
        <meta name="description" content="Resort and hotel employers can post jobs on The Jobs MV to reach thousands of Maldives hospitality professionals. Normal, Featured and Urgent listings available." />
        <meta property="og:title" content="Post a Hospitality Job in the Maldives — The Jobs MV" />
        <meta property="og:description" content="Reach thousands of Maldives hospitality professionals. Post your resort job today." />
        <meta property="og:url" content="/post" />
      </Head>
      <View style={styles.iconCircle}>
        <Ionicons name="business" size={48} color="#2A6F97" />
      </View>

      <Text style={styles.title}>Employer Portal</Text>
      <Text style={styles.subtitle}>
        Resorts and employers can post jobs, manage listings, and reach thousands of Maldives hospitality professionals.
      </Text>

      <View style={styles.features}>
        {[
          { icon: "add-circle-outline", text: "Post Normal, Featured, or Urgent jobs" },
          { icon: "pencil-outline", text: "Edit and manage your listings anytime" },
          { icon: "pause-circle-outline", text: "Pause or reactivate jobs with one tap" },
          { icon: "people-outline", text: "Reach verified Maldives job seekers" },
        ].map(({ icon, text }) => (
          <View key={text} style={styles.featureRow}>
            <Ionicons name={icon as any} size={20} color="#2A6F97" />
            <Text style={styles.featureText}>{text}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.loginBtn} onPress={() => router.push("/employer/login")}>
        <Text style={styles.loginBtnText}>Log In as Employer</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.registerBtn} onPress={() => router.push("/employer/register")}>
        <Text style={styles.registerBtnText}>Create Employer Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { flex: 1, backgroundColor: "#FBF8F1", alignItems: "center", paddingHorizontal: 28 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#F3ECD9", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "800", color: "#1C4E6B", marginBottom: 10, textAlign: "center" },
  subtitle: { fontSize: 15, color: "#555", textAlign: "center", lineHeight: 22, marginBottom: 28 },
  features: { width: "100%", backgroundColor: "#fff", borderRadius: 16, padding: 20, gap: 14, marginBottom: 28, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureText: { fontSize: 14, color: "#333", flex: 1 },
  loginBtn: { width: "100%", backgroundColor: "#2A6F97", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 12 },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  registerBtn: { width: "100%", borderWidth: 1.5, borderColor: "#2A6F97", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  registerBtnText: { color: "#2A6F97", fontSize: 15, fontWeight: "600" },
});
