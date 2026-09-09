import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import Head from "expo-router/head";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { JobAlertsProvider } from "@/contexts/JobAlertsContext";
import { PostedJobsProvider } from "@/contexts/PostedJobsContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { SavedJobsProvider } from "@/contexts/SavedJobsContext";

import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

const domain = process.env.EXPO_PUBLIC_DOMAIN;
if (domain) setBaseUrl(`https://${domain}`);

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const proxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function ApiAuthSetup({ children }: React.PropsWithChildren) {
  const { getToken } = useAuth();
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    setIsReady(true);
    return () => {
      setAuthTokenGetter(null);
    };
  }, [getToken]);

  if (!isReady) return null;
  return children;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="job/[id]"
        options={{
          title: "Job Details",
          headerStyle: { backgroundColor: "#0077B6" },
          headerTintColor: "#ffffff",
          headerTitleStyle: { fontFamily: "Inter_600SemiBold" },
        }}
      />
      <Stack.Screen name="employer" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
  const siteUrl = domain ? `https://${domain}` : "https://thejobsmv.com";
  const ogImage = `${siteUrl}/assets/images/hero_banner.png`;

  return (
    <SafeAreaProvider>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0077B6" />
        <meta name="robots" content="index, follow" />
        <meta property="og:site_name" content="The Jobs MV" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@thejobsmv" />
        <meta name="twitter:image" content={ogImage} />
        <link rel="canonical" href={siteUrl} />
      </Head>
      <ErrorBoundary>
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache} proxyUrl={proxyUrl}>
          <ClerkLoaded>
            <QueryClientProvider client={queryClient}>
              <ApiAuthSetup>
                <ProfileProvider>
                  <PostedJobsProvider>
                    <SavedJobsProvider>
                      <JobAlertsProvider>
                        <GestureHandlerRootView>
                          <KeyboardProvider>
                            <RootLayoutNav />
                          </KeyboardProvider>
                        </GestureHandlerRootView>
                      </JobAlertsProvider>
                    </SavedJobsProvider>
                  </PostedJobsProvider>
                </ProfileProvider>
              </ApiAuthSetup>
            </QueryClientProvider>
          </ClerkLoaded>
        </ClerkProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
