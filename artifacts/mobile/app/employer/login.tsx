import { useSignIn, useAuth } from '@clerk/expo'
import { useRouter } from 'expo-router'
import React from 'react'
import { Pressable, StyleSheet, TextInput, View, Text, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native'
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function EmployerLoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, errors, fetchStatus } = useSignIn()
  const { isLoaded } = useAuth()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [localError, setLocalError] = React.useState('')

  const handleSubmit = async () => {
    if (!isLoaded) return;
    
    if (!emailAddress.trim()) {
      setLocalError('Please enter your work email');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password');
      return;
    }
    
    setLocalError('');
    
    try {
      const { error } = await signIn.password({
        identifier: emailAddress,
        password,
      })
      
      if (error) {
        console.error(JSON.stringify(error, null, 2))
        return
      }

      if (signIn.status === 'complete') {
        await signIn.finalize({
          navigate: ({ session }) => {
            if (session?.currentTask) {
              console.log(session?.currentTask)
              return
            }
            router.replace('/employer/dashboard')
          },
        })
      } else {
        console.error('Sign-in attempt not complete:', signIn)
      }
    } catch (err: any) {
      setLocalError(err.errors?.[0]?.message || 'An error occurred during sign in');
    }
  }

  const displayError = localError || errors?.fields?.identifier?.message || errors?.fields?.password?.message;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Header Vibe */}
          <View style={[styles.headerSection, { paddingTop: insets.top + 20 }]}>
            <View style={styles.headerBackground} />
            <Pressable 
              style={styles.backBtn} 
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>

            <View style={styles.brandingContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="business" size={28} color="#14294a" />
              </View>
              <View style={styles.employerBadge}>
                <Text style={styles.employerBadgeText}>EMPLOYER PORTAL</Text>
              </View>
            </View>
            
            <Text style={styles.title}>Find the perfect talent.</Text>
            <Text style={styles.subtitle}>Sign in to manage your resort job listings.</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>Welcome back</Text>

            {!!displayError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={20} color="#991B1B" />
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            )}

            <View style={styles.form}>
              <Text style={styles.label}>Work Email</Text>
              <TextInput
                style={styles.input}
                placeholder="hr@yourresort.com"
                placeholderTextColor="#94A3B8"
                value={emailAddress}
                onChangeText={(text) => {
                  setEmailAddress(text);
                  setLocalError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Work Email"
                returnKeyType="next"
              />

              <Text style={styles.label}>Password</Text>
              <View style={[styles.input, styles.passwordRow]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setLocalError('');
                  }}
                  secureTextEntry={!showPassword}
                  accessibilityLabel="Password"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                <Pressable 
                  style={styles.eyeBtn} 
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  accessibilityRole="button"
                >
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#64748B" />
                </Pressable>
              </View>

              <Pressable 
                style={({ pressed }) => [
                  styles.btn, 
                  fetchStatus === 'fetching' && styles.btnDisabled,
                  pressed && styles.btnPressed
                ]} 
                onPress={handleSubmit} 
                disabled={fetchStatus === 'fetching'}
                accessibilityRole="button"
                accessibilityState={{ disabled: fetchStatus === 'fetching' }}
              >
                {fetchStatus === 'fetching' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Log In</Text>
                )}
              </Pressable>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>New to The Jobs MV?</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable 
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && styles.secondaryBtnPressed
                ]} 
                onPress={() => router.push("/employer/register")}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryBtnText}>Create an Employer Account</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  headerSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    backgroundColor: "#14294a",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#14294a",
  },
  backBtn: { 
    marginBottom: 24,
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  brandingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  iconCircle: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: "#FFFFFF", 
    alignItems: "center", 
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  employerBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  employerBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  title: { 
    fontSize: 32, 
    fontWeight: "800", 
    color: "#FFFFFF", 
    marginBottom: 8,
    lineHeight: 40,
  },
  subtitle: { 
    fontSize: 16, 
    color: "rgba(255, 255, 255, 0.8)", 
    lineHeight: 24,
  },
  formSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 24,
  },
  errorBox: { 
    backgroundColor: "#FEF2F2", 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: { 
    color: "#991B1B", 
    fontSize: 14, 
    fontWeight: "500",
    flex: 1,
  },
  form: {
    gap: 16,
  },
  label: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: "#334155", 
    marginBottom: -8,
  },
  input: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: "#E2E8F0", 
    paddingHorizontal: 16, 
    height: 56,
    fontSize: 16, 
    color: "#0F172A",
  },
  passwordRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 0,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#0F172A",
  },
  eyeBtn: { 
    paddingHorizontal: 16,
    height: "100%",
    justifyContent: "center",
  },
  btn: { 
    backgroundColor: "#14294a", 
    borderRadius: 12, 
    height: 56,
    alignItems: "center", 
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#14294a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  btnDisabled: { 
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: { 
    color: "#FFFFFF", 
    fontSize: 16, 
    fontWeight: "700",
  },
  divider: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 16, 
    marginVertical: 16 
  },
  dividerLine: { 
    flex: 1, 
    height: 1, 
    backgroundColor: "#E2E8F0" 
  },
  dividerText: { 
    color: "#64748B", 
    fontSize: 14,
    fontWeight: "500",
  },
  secondaryBtn: { 
    backgroundColor: "transparent",
    borderWidth: 2, 
    borderColor: "#E2E8F0", 
    borderRadius: 12, 
    height: 56,
    alignItems: "center", 
    justifyContent: "center",
  },
  secondaryBtnPressed: {
    backgroundColor: "#F1F5F9",
  },
  secondaryBtnText: { 
    color: "#0F172A", 
    fontSize: 16, 
    fontWeight: "600" 
  },
});