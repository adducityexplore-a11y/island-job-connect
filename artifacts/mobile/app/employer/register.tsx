import { useSignUp, useAuth } from '@clerk/expo'
import { Link, useRouter } from 'expo-router'
import React from 'react'
import { Pressable, StyleSheet, TextInput, View, Text, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native'
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getGetCompanyProfileQueryKey, useRegisterRecruiter } from '@workspace/api-client-react'
import { useQueryClient } from "@tanstack/react-query";

export default function EmployerRegisterScreen() {
  const insets = useSafeAreaInsets();
  const { signUp, errors, fetchStatus } = useSignUp()
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const registerRecruiter = useRegisterRecruiter()

  const [form, setForm] = React.useState({ email: "", password: "", companyName: "", contactName: "", phone: "" })
  const [showPassword, setShowPassword] = React.useState(false)
  const [code, setCode] = React.useState('')
  const [localError, setLocalError] = React.useState('')

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function registrationErrorMessage(error: unknown): string {
    if (!error || typeof error !== "object" || !("data" in error)) {
      return "Your account was verified, but the employer profile could not be created. Please try again."
    }
    const data = error.data
    if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
      return data.error
    }
    return "Your account was verified, but the employer profile could not be created. Please try again."
  }

  const completeEmployerRegistration = async () => {
    setLocalError("")
    try {
      await registerRecruiter.mutateAsync({
        data: {
          companyName: form.companyName.trim(),
          contactName: form.contactName.trim(),
          ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        }
      })
      await queryClient.invalidateQueries({ queryKey: getGetCompanyProfileQueryKey() })
      router.replace('/employer/dashboard')
    } catch (error) {
      setLocalError(registrationErrorMessage(error))
    }
  }

  const handleSubmit = async () => {
    if (!isLoaded) return;
    if (form.companyName.trim().length < 2 || form.contactName.trim().length < 2) {
      setLocalError("Company Name and Contact Name are required");
      return;
    }
    setLocalError('');
    const { error } = await signUp.password({
      emailAddress: form.email,
      password: form.password,
    })
    if (error) {
      console.error(JSON.stringify(error, null, 2))
      return
    }

    if (!error) await signUp.verifications.sendEmailCode()
  }

  const handleVerify = async () => {
    if (!isLoaded) return;
    setLocalError('')
    const verification = await signUp.verifications.verifyEmailCode({ code })
    if (verification.error) return
    if (signUp.status === 'complete') {
      await signUp.finalize({
        navigate: async ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            setLocalError("Please complete the remaining account verification step.")
            return
          }
          await completeEmployerRegistration()
        },
      })
    } else {
      setLocalError("Email verification is not complete. Check the code and try again.")
    }
  }

  if (isSignedIn) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, styles.signedInContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="business" size={36} color="#0077B6" />
          </View>
          <Text style={styles.title}>Finish your employer profile</Text>
          <Text style={styles.subtitle}>Your email is verified. Add the company details candidates should see with your vacancies.</Text>
        </View>
        {localError ? <View style={styles.errorBox}><Text style={styles.errorText}>{localError}</Text></View> : null}
        <View style={styles.form}>
          {[
            { label: "Resort / Company Name *", field: "companyName", placeholder: "e.g. One&Only Reethi Rah" },
            { label: "Contact Name *", field: "contactName", placeholder: "HR Manager name" },
            { label: "Phone (optional)", field: "phone", placeholder: "+960 xxx xxxx", keyboardType: "phone-pad" as const },
          ].map(({ label, field, placeholder, keyboardType }) => (
            <View key={field}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                value={(form as any)[field]}
                onChangeText={(value) => update(field, value)}
                keyboardType={keyboardType}
                autoCapitalize="words"
                autoCorrect={false}
                testID={`input-employer-${field}`}
              />
            </View>
          ))}
          <Pressable
            style={[styles.btn, registerRecruiter.isPending && styles.btnDisabled]}
            onPress={completeEmployerRegistration}
            disabled={registerRecruiter.isPending}
            testID="button-finish-employer-registration"
          >
            {registerRecruiter.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Continue to dashboard</Text>}
          </Pressable>
        </View>
      </ScrollView>
    )
  }

  if (
    signUp?.status === 'missing_requirements' &&
    signUp?.unverifiedFields.includes('email_address') &&
    signUp?.missingFields.length === 0
  ) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.container, { padding: 24, paddingTop: insets.top + 20 }]}>
          <Pressable style={styles.backBtn} onPress={() => signUp.reset()}>
            <Ionicons name="arrow-back" size={24} color="#0077B6" />
          </Pressable>
          <Text style={styles.title}>Verify your account</Text>
          <Text style={styles.subtitle}>Enter the code sent to {form.email}</Text>
          <TextInput
            style={styles.input}
            value={code}
            placeholder="Enter your verification code"
            placeholderTextColor="#666666"
            onChangeText={(code) => setCode(code)}
            keyboardType="numeric"
          />
          {errors?.fields?.code && (
            <Text style={styles.errorText}>{errors.fields.code.message}</Text>
          )}
          {localError ? <View style={styles.errorBox}><Text style={styles.errorText}>{localError}</Text></View> : null}
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              fetchStatus === 'fetching' && styles.btnDisabled,
            ]}
            onPress={handleVerify}
            disabled={fetchStatus === 'fetching' || registerRecruiter.isPending}
          >
            {fetchStatus === 'fetching' || registerRecruiter.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Verify</Text>}
          </Pressable>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => signUp.verifications.sendEmailCode()}
          >
            <Text style={styles.secondaryBtnText}>I need a new code</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0077B6" />
        </Pressable>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="business" size={36} color="#0077B6" />
          </View>
          <Text style={styles.title}>Create Employer Account</Text>
          <Text style={styles.subtitle}>Start posting jobs for your resort</Text>
        </View>

        {localError ? <View style={styles.errorBox}><Text style={styles.errorText}>{localError}</Text></View> : null}

        <View style={styles.form}>
          {[
            { label: "Resort / Company Name *", field: "companyName", placeholder: "e.g. One&Only Reethi Rah" },
            { label: "Contact Name *", field: "contactName", placeholder: "HR Manager name" },
            { label: "Work Email *", field: "email", placeholder: "hr@yourresort.com", keyboardType: "email-address" as const, autoCapitalize: "none" as const },
            { label: "Phone (optional)", field: "phone", placeholder: "+960 xxx xxxx", keyboardType: "phone-pad" as const },
          ].map(({ label, field, placeholder, keyboardType, autoCapitalize }) => (
            <View key={field}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                value={(form as any)[field]}
                onChangeText={(v) => update(field, v)}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize || "words"}
                autoCorrect={false}
              />
              {field === 'email' && errors?.fields?.emailAddress && (
                <Text style={styles.errorText}>{errors.fields.emailAddress.message}</Text>
              )}
            </View>
          ))}

          <Text style={styles.label}>Password * (min 8 characters)</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Create a strong password"
              value={form.password}
              onChangeText={(v) => update("password", v)}
              secureTextEntry={!showPassword}
            />
            <Pressable style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#888" />
            </Pressable>
          </View>
          {errors?.fields?.password && (
            <Text style={styles.errorText}>{errors.fields.password.message}</Text>
          )}

          <Pressable style={[styles.btn, fetchStatus === 'fetching' && styles.btnDisabled]} onPress={handleSubmit} disabled={fetchStatus === 'fetching'}>
            {fetchStatus === 'fetching' ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
          </Pressable>

          <Pressable style={styles.linkBtn} onPress={() => router.push("/employer/login")}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Log in</Text></Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7FF" },
  content: { padding: 24 },
  backBtn: { marginBottom: 16 },
  header: { alignItems: "center", marginBottom: 28 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#E0F2FE", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "700", color: "#003A6B", marginBottom: 6 },
  subtitle: { fontSize: 15, color: "#555", textAlign: "center", marginBottom: 16 },
  errorBox: { backgroundColor: "#FEE2E2", borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { color: "#991B1B", fontSize: 14, textAlign: "center", marginTop: 4 },
  form: {},
  signedInContent: { flexGrow: 1, justifyContent: "center" },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#D1E9FF", padding: 14, fontSize: 15, color: "#111" },
  passwordRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  eyeBtn: { padding: 14, backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#D1E9FF", height: 50 },
  btn: { backgroundColor: "#0077B6", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryBtn: { borderWidth: 1.5, borderColor: "#0077B6", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 16 },
  secondaryBtnText: { color: "#0077B6", fontSize: 15, fontWeight: "600" },
  linkBtn: { alignItems: "center", marginTop: 20 },
  linkText: { color: "#555", fontSize: 14 },
  linkBold: { color: "#0077B6", fontWeight: "700" },
});