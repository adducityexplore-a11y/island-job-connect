import { Stack, Redirect, useSegments } from "expo-router";
import { useAuth } from "@clerk/expo";
import { getGetCompanyProfileQueryKey, useGetCompanyProfile } from "@workspace/api-client-react";

export default function EmployerLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const companyProfile = useGetCompanyProfile({
    query: {
      queryKey: getGetCompanyProfileQueryKey(),
      enabled: isSignedIn === true,
      retry: false,
    },
  });

  if (!isLoaded) return null;

  const currentRoute = segments[segments.length - 1];
  const isAuthRoute = currentRoute === "login" || currentRoute === "register";

  if (!isSignedIn && !isAuthRoute) {
    return <Redirect href="/employer/login" />;
  }

  if (isSignedIn && companyProfile.isLoading) return null;

  if (isSignedIn && !companyProfile.isSuccess && currentRoute !== "register") {
    return <Redirect href="/employer/register" />;
  }

  if (isSignedIn && companyProfile.isSuccess && isAuthRoute) {
    return <Redirect href="/employer/dashboard" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="post-job" />
      <Stack.Screen name="edit-job" />
      <Stack.Screen name="applications" />
      <Stack.Screen name="application/[id]" />
    </Stack>
  );
}
