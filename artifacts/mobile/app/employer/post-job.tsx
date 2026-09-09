import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Platform, KeyboardAvoidingView, Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useImageUpload } from "../../hooks/useImageUpload";
import { useCreateRecruiterJob, useGetCompanyProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const DEPARTMENTS = ["F&B","Kitchen","Front Office","Housekeeping","Spa","Recreation","Engineering","HR","Finance","Transport","Diving & Watersports","Guest Services","IT","Management","Sales & Marketing"];
const JOB_TYPES = ["Normal", "Featured", "Urgent"];

export default function PostJobScreen() {
  const insets = useSafeAreaInsets();
  const { data: employer } = useGetCompanyProfile();
  const createJob = useCreateRecruiterJob();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: "", department: "", location: employer?.companyName || "",
    salaryMin: "", salaryMax: "", description: "", requirements: "",
    salaryCurrency: "USD", salaryPeriod: "month",
    imageUrl: "",
    type: "Normal", applyMethod: "whatsapp", applyContact: "",
  });
  const [error, setError] = useState("");
  const { pickAndUpload, uploading: imageUploading } = useImageUpload({
    onSuccess: (url) => update("imageUrl", url),
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.title || !form.department || !form.location || !form.description || !form.applyContact) {
      setError("Please fill in all required fields"); return;
    }
    setError("");
    try {
      const salaryMin = form.salaryMin ? Number(form.salaryMin) : undefined;
      const salaryMax = form.salaryMax ? Number(form.salaryMax) : undefined;
      if ((salaryMin !== undefined && (!Number.isInteger(salaryMin) || salaryMin <= 0)) ||
          (salaryMax !== undefined && (!Number.isInteger(salaryMax) || salaryMax <= 0))) {
        setError("Salary must be a positive whole number");
        return;
      }
      if (salaryMin !== undefined && salaryMax !== undefined && salaryMin > salaryMax) {
        setError("Maximum salary must be greater than minimum salary");
        return;
      }
      await createJob.mutateAsync({
        data: {
          title: form.title.trim(),
          department: form.department,
          location: form.location.trim(),
          description: form.description.trim(),
          requirements: form.requirements.trim() || undefined,
          applyContact: form.applyContact.trim(),
          applyMethod: form.applyMethod as "whatsapp" | "email",
          type: form.type as "Normal" | "Featured" | "Urgent",
          imageUrl: form.imageUrl || undefined,
          salaryMin,
          salaryMax,
           ...(salaryMin !== undefined || salaryMax !== undefined ? { salaryCurrency: form.salaryCurrency as "USD" | "MVR", salaryPeriod: "month" as const } : {}),
        },
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employer/jobs"] });
      router.replace("/employer/dashboard");
    } catch (e: any) {
      setError(e.message || "Failed to post job");
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#2A6F97" /></TouchableOpacity>
          <Text style={styles.pageTitle}>Post a Job</Text>
          <View style={{ width: 24 }} />
        </View>

        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

        <Text style={styles.sectionHeader}>Job Details</Text>
        <Text style={styles.label}>Job Title *</Text>
        <TextInput style={styles.input} placeholder="e.g. Head Chef" value={form.title} onChangeText={(v) => update("title", v)} />

        <Text style={styles.label}>Department *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          <View style={styles.chipRow}>
            {DEPARTMENTS.map((d) => (
              <TouchableOpacity key={d} style={[styles.chip, form.department === d && styles.chipSelected]} onPress={() => update("department", d)}>
                <Text style={[styles.chipText, form.department === d && styles.chipTextSelected]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.label}>Location / Atoll *</Text>
        <TextInput style={styles.input} placeholder="e.g. North Malé Atoll" value={form.location} onChangeText={(v) => update("location", v)} />

        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Min Salary</Text>
            <TextInput style={styles.input} placeholder="e.g. 1500" value={form.salaryMin} onChangeText={(v) => update("salaryMin", v)} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Max Salary</Text>
            <TextInput style={styles.input} placeholder="e.g. 2500" value={form.salaryMax} onChangeText={(v) => update("salaryMax", v)} keyboardType="numeric" />
          </View>
        </View>
        <Text style={styles.label}>Salary currency</Text>
        <View style={styles.chipRow}>
          {["USD", "MVR"].map((currency) => (
            <TouchableOpacity key={currency} style={[styles.chip, form.salaryCurrency === currency && styles.chipSelected]} onPress={() => update("salaryCurrency", currency)}>
              <Text style={[styles.chipText, form.salaryCurrency === currency && styles.chipTextSelected]}>{currency}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Salary period: Monthly</Text>

        <Text style={styles.label}>Job Description *</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Describe the role and responsibilities..." value={form.description} onChangeText={(v) => update("description", v)} multiline numberOfLines={4} />

        <Text style={styles.label}>Requirements (optional)</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Experience, qualifications, languages..." value={form.requirements} onChangeText={(v) => update("requirements", v)} multiline numberOfLines={3} />

        <Text style={styles.label}>Company Logo or Photo (optional)</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickAndUpload} disabled={imageUploading}>
          {imageUploading ? (
            <ActivityIndicator color="#2A6F97" />
          ) : form.imageUrl ? (
            <Image source={{ uri: form.imageUrl }} style={styles.imagePreview} resizeMode="cover" />
          ) : (
            <View style={styles.imagePickerEmpty}>
              <Ionicons name="image-outline" size={32} color="#2A6F97" />
              <Text style={styles.imagePickerText}>Tap to upload a photo</Text>
            </View>
          )}
        </TouchableOpacity>
        {form.imageUrl ? (
          <TouchableOpacity onPress={() => update("imageUrl", "")} style={styles.removeImageBtn}>
            <Ionicons name="close-circle" size={16} color="#E63946" />
            <Text style={styles.removeImageText}>Remove photo</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.sectionHeader}>Listing Type</Text>
        <View style={styles.chipRow}>
          {JOB_TYPES.map((t) => (
            <TouchableOpacity key={t} style={[styles.chip, form.type === t && styles.chipSelected]} onPress={() => update("type", t)}>
              <Text style={[styles.chipText, form.type === t && styles.chipTextSelected]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionHeader}>How to Apply</Text>
        <View style={styles.chipRow}>
          {[["whatsapp", "WhatsApp"], ["email", "Email"]].map(([val, label]) => (
            <TouchableOpacity key={val} style={[styles.chip, form.applyMethod === val && styles.chipSelected]} onPress={() => update("applyMethod", val)}>
              <Text style={[styles.chipText, form.applyMethod === val && styles.chipTextSelected]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>{form.applyMethod === "whatsapp" ? "WhatsApp Number *" : "Email Address *"}</Text>
        <TextInput
          style={styles.input}
          placeholder={form.applyMethod === "whatsapp" ? "+960 xxx xxxx" : "hr@resort.com"}
          value={form.applyContact}
          onChangeText={(v) => update("applyContact", v)}
          keyboardType={form.applyMethod === "whatsapp" ? "phone-pad" : "email-address"}
          autoCapitalize="none"
        />

        <TouchableOpacity style={[styles.btn, createJob.isPending && styles.btnDisabled]} onPress={handleSubmit} disabled={createJob.isPending}>
          {createJob.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Post Job</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FBF8F1" },
  content: { padding: 20 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  pageTitle: { fontSize: 18, fontWeight: "700", color: "#1C4E6B" },
  errorBox: { backgroundColor: "#FEE2E2", borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { color: "#991B1B", fontSize: 14, textAlign: "center" },
  sectionHeader: { fontSize: 15, fontWeight: "700", color: "#1C4E6B", marginTop: 20, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: "#E4DCC8", paddingBottom: 8 },
  label: { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#E4DCC8", padding: 13, fontSize: 15, color: "#111" },
  textArea: { height: 100, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E4DCC8" },
  chipSelected: { backgroundColor: "#2A6F97", borderColor: "#2A6F97" },
  chipText: { fontSize: 13, color: "#555", fontWeight: "500" },
  chipTextSelected: { color: "#fff", fontWeight: "700" },
  btn: { backgroundColor: "#2A6F97", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 28 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  imagePicker: { borderRadius: 12, borderWidth: 1.5, borderColor: "#E4DCC8", borderStyle: "dashed", backgroundColor: "#fff", overflow: "hidden", marginTop: 4, minHeight: 120, justifyContent: "center", alignItems: "center" },
  imagePickerEmpty: { alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  imagePickerText: { color: "#2A6F97", fontSize: 14, fontWeight: "500" },
  imagePreview: { width: "100%", height: 160 },
  removeImageBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  removeImageText: { color: "#E63946", fontSize: 13 },
});
