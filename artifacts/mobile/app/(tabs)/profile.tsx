import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import Head from "expo-router/head";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

import { CandidateProfile, useProfile } from "@/contexts/ProfileContext";
import { DEPT_OPTIONS } from "@/constants/data";
import { useColors } from "@/hooks/useColors";
import { useCvUpload } from "@/hooks/useCvUpload";

const AVAILABILITY_OPTIONS = [
  "Immediately",
  "Within 1 month",
  "1–3 months",
  "3+ months",
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, isLoaded } = useProfile();
  const [form, setForm] = useState<CandidateProfile>(profile);
  const [saved, setSaved] = useState(false);
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [showAvailPicker, setShowAvailPicker] = useState(false);

  const { pickAndUpload, uploading: cvUploading } = useCvUpload({
    onSuccess: (cvFileName) => {
      setForm((f) => ({ ...f, cvAvailable: true, cvFileName }));
    },
    onError: (msg) => Alert.alert("Upload Failed", msg),
  });

  // Re-sync form from context every time this tab comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isLoaded) {
        setForm(profile);
      }
    }, [profile, isLoaded])
  );

  const handleSave = async () => {
    await updateProfile(form);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const rawBottom = Platform.OS === "web" ? 34 : insets.bottom;
  // Add tab bar height so the save bar sits above the tab bar
  const TAB_BAR_H = Platform.OS === "web" ? 84 : 49;
  const bottomPad = rawBottom + TAB_BAR_H;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Head>
        <title>My CV Profile — The Jobs MV</title>
        <meta name="description" content="Build and save your candidate CV profile on The Jobs MV. Be discovered by Maldives resort recruiters." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.primary, paddingTop: topPadding + 14 },
        ]}
      >
        <Text style={styles.headerTitle}>My CV Profile</Text>
        <Text style={styles.headerSubtitle}>
          Visible to recruiters who browse candidates
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad + 100 },
        ]}
      >
        {/* Photo */}
        <View style={styles.photoSection}>
          <View
            style={[
              styles.photoCircle,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
              },
            ]}
          >
            <Feather name="user" size={36} color={colors.primary} />
          </View>
          <TouchableOpacity
            style={[styles.photoBtn, { borderColor: colors.primary }]}
          >
            <Feather name="camera" size={14} color={colors.primary} />
            <Text style={[styles.photoBtnText, { color: colors.primary }]}>
              Add Photo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <FField label="Full Name" required colors={colors}>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  backgroundColor: colors.card,
                },
              ]}
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
              placeholder="Your full name"
              placeholderTextColor={colors.mutedForeground}
            />
          </FField>
          <FField label="Phone Number" required colors={colors}>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  backgroundColor: colors.card,
                },
              ]}
              value={form.phone}
              onChangeText={(v) => setForm({ ...form, phone: v })}
              placeholder="+960 7XX XXXX"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
            />
          </FField>
          <FField label="Email Address" colors={colors}>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  backgroundColor: colors.card,
                },
              ]}
              value={form.email}
              onChangeText={(v) => setForm({ ...form, email: v })}
              placeholder="you@email.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </FField>
          <FField label="Current Location" colors={colors}>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  backgroundColor: colors.card,
                },
              ]}
              value={form.location}
              onChangeText={(v) => setForm({ ...form, location: v })}
              placeholder="e.g., Malé, Maldives"
              placeholderTextColor={colors.mutedForeground}
            />
          </FField>
          <FField label="Years of Experience" colors={colors}>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  backgroundColor: colors.card,
                },
              ]}
              value={form.experience}
              onChangeText={(v) => setForm({ ...form, experience: v })}
              placeholder="e.g., 3"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
            />
          </FField>
          <FField label="Preferred Department" colors={colors}>
            <TouchableOpacity
              style={[
                styles.selector,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
              onPress={() => {
                setShowDeptPicker(!showDeptPicker);
                setShowAvailPicker(false);
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 15,
                  color: form.preferredDepartment
                    ? colors.foreground
                    : colors.mutedForeground,
                }}
              >
                {form.preferredDepartment || "Select department"}
              </Text>
              <Feather
                name={showDeptPicker ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
            {showDeptPicker && (
              <View
                style={[
                  styles.picker,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                {DEPT_OPTIONS.map((dept) => (
                  <TouchableOpacity
                    key={dept}
                    style={[
                      styles.pickerItem,
                      { borderBottomColor: colors.border },
                    ]}
                    onPress={() => {
                      setForm({ ...form, preferredDepartment: dept });
                      setShowDeptPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerText,
                        {
                          color:
                            form.preferredDepartment === dept
                              ? colors.primary
                              : colors.foreground,
                        },
                      ]}
                    >
                      {dept}
                    </Text>
                    {form.preferredDepartment === dept && (
                      <Feather name="check" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </FField>
          <FField label="Availability" colors={colors}>
            <TouchableOpacity
              style={[
                styles.selector,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
              onPress={() => {
                setShowAvailPicker(!showAvailPicker);
                setShowDeptPicker(false);
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 15,
                  color: form.availability
                    ? colors.foreground
                    : colors.mutedForeground,
                }}
              >
                {form.availability || "When can you start?"}
              </Text>
              <Feather
                name={showAvailPicker ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
            {showAvailPicker && (
              <View
                style={[
                  styles.picker,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.pickerItem,
                      { borderBottomColor: colors.border },
                    ]}
                    onPress={() => {
                      setForm({ ...form, availability: opt });
                      setShowAvailPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerText,
                        {
                          color:
                            form.availability === opt
                              ? colors.primary
                              : colors.foreground,
                        },
                      ]}
                    >
                      {opt}
                    </Text>
                    {form.availability === opt && (
                      <Feather name="check" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </FField>
          <FField label="Expected Salary" colors={colors}>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  backgroundColor: colors.card,
                },
              ]}
              value={form.expectedSalary}
              onChangeText={(v) => setForm({ ...form, expectedSalary: v })}
              placeholder="e.g., $1,500/month"
              placeholderTextColor={colors.mutedForeground}
            />
          </FField>

          {/* CV Upload */}
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
            CV / Resume
          </Text>
          {form.cvAvailable ? (
            <View style={[styles.cvUploaded, { borderColor: "#2A9D8F", backgroundColor: "#ECFDF5" }]}>
              <Feather name="file-text" size={22} color="#2A9D8F" />
              <View style={{ flex: 1 }}>
                <Text style={styles.cvFileName} numberOfLines={1}>
                  {form.cvFileName || "CV uploaded"}
                </Text>
                <Text style={styles.cvUploadedSub}>Stored privately and ready for applications</Text>
              </View>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.uploadBox,
              {
                borderColor: form.cvAvailable ? colors.border : colors.primary,
                backgroundColor: form.cvAvailable ? colors.card : colors.secondary,
                opacity: cvUploading ? 0.6 : 1,
              },
            ]}
            onPress={pickAndUpload}
            disabled={cvUploading}
            activeOpacity={0.75}
          >
            {cvUploading ? (
              <>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.uploadTitle, { color: colors.primary }]}>
                  Uploading…
                </Text>
              </>
            ) : (
              <>
                <Feather
                  name={form.cvAvailable ? "refresh-cw" : "upload"}
                  size={24}
                  color={form.cvAvailable ? colors.mutedForeground : colors.primary}
                />
                <Text
                  style={[
                    styles.uploadTitle,
                    { color: form.cvAvailable ? colors.mutedForeground : colors.primary },
                  ]}
                >
                  {form.cvAvailable ? "Replace CV" : "Upload your CV"}
                </Text>
                <Text style={[styles.uploadSub, { color: colors.mutedForeground }]}>
                  PDF or Word document
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Save */}
      <View
        style={[
          styles.saveBar,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            paddingBottom: bottomPad + 16,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: saved ? "#2A9D8F" : colors.primary },
          ]}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Feather name={saved ? "check" : "save"} size={18} color="#fff" />
          <Text style={styles.saveBtnText}>
            {saved ? "Profile Saved!" : "Save Profile"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FField({
  label,
  required,
  children,
  colors,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
        {label}
        {required ? (
          <Text style={{ color: "#E63946" }}> *</Text>
        ) : null}
      </Text>
      {children}
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
  scrollContent: { paddingTop: 8 },
  photoSection: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 12,
  },
  photoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  photoBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  form: {
    paddingHorizontal: 16,
    gap: 0,
  },
  fieldWrap: {
    marginBottom: 16,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  selector: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  picker: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 4,
    overflow: "hidden",
  },
  pickerItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 28,
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  uploadSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  cvUploaded: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cvFileName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#065F46",
  },
  cvUploadedSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#059669",
    marginTop: 2,
  },
  saveBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
