import { type ReactNode, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { Layout } from '@/components/layout';

import Home from '@/pages/home';
import Jobs from '@/pages/jobs';
import JobDetail from '@/pages/job-detail';
import Employers from '@/pages/employers';
import Companies from '@/pages/companies';
import CompanyDetail from '@/pages/company-detail';
import About from '@/pages/about';
import PrivacyPolicy from '@/pages/privacy-policy';
import TermsAndConditions from '@/pages/terms-and-conditions';
import EmployerTerms from '@/pages/employer-terms';
import CandidateDataConsent from '@/pages/candidate-data-consent';
import Contact from '@/pages/contact';

import AdminSignIn from '@/pages/admin/sign-in';
import AdminDashboard from '@/pages/admin/dashboard';
import AdminEmployers from '@/pages/admin/employers';
import AdminJobs from '@/pages/admin/jobs';
import AdminCandidates from '@/pages/admin/candidates';
import AdminApplications from '@/pages/admin/applications';
import AdminAuditLog from '@/pages/admin/audit';
import AdminRecruitmentRequests from '@/pages/admin/recruitment-requests';
import AdminRecruitmentRequestDetail from '@/pages/admin/recruitment-request-detail';
import AdminOutreach from '@/pages/admin/outreach';
import { AdminLayout } from '@/components/admin/admin-layout';

import EmployerLogin from '@/pages/employer/login';
import EmployerDashboard from '@/pages/employer/dashboard';
import EmployerVacancies from '@/pages/employer/vacancies';
import EmployerApplications from '@/pages/employer/applications';
import EmployerRecruitmentRequests from '@/pages/employer/recruitment-requests';
import NewEmployerRecruitmentRequest from '@/pages/employer/recruitment-requests/new';
import EmployerRecruitmentRequestDetail from '@/pages/employer/recruitment-requests/detail';
import EmployerCompany from '@/pages/employer/company';
import EmployerTalentSearch from '@/pages/employer/talent';
import EmployerTalentDetail from '@/pages/employer/talent/detail';
import CandidateSignIn from '@/pages/candidate/sign-in';
import CandidatePassport from '@/pages/candidate/passport';
import CandidateApplications from '@/pages/candidate/applications';
import CandidateSavedJobs from '@/pages/candidate/saved-jobs';
import CandidateMyCareer from '@/pages/candidate/my-career';

import { ClerkProvider, useAuth, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import SignInPage from '@/pages/auth/sign-in';
import SignUpPage from '@/pages/auth/sign-up';
import CandidateSignUp from '@/pages/candidate/sign-up';

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/images/logo_final.png`,
  },
  variables: {
    colorPrimary: "hsl(215, 60%, 20%)",
    colorForeground: "hsl(215, 30%, 15%)",
    colorMutedForeground: "hsl(215, 16%, 47%)",
    colorDanger: "hsl(0, 84%, 60%)",
    colorBackground: "hsl(0, 0%, 100%)",
    colorInput: "hsl(0, 0%, 100%)",
    colorInputForeground: "hsl(215, 30%, 15%)",
    colorNeutral: "hsl(214, 32%, 91%)",
    fontFamily: "Plus Jakarta Sans, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-md border border-border",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-display tracking-tight text-foreground font-bold",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium text-sm",
    footerActionLink: "!hidden",
    footerActionText: "!hidden",
    dividerText: "text-muted-foreground bg-white px-2",
    identityPreviewEditButton: "text-primary hover:text-primary/90",
    formFieldSuccessText: "text-emerald-600",
    alertText: "text-foreground text-sm font-medium",
    logoBox: "mb-2",
    logoImage: "w-12 h-12 object-contain",
    socialButtonsBlockButton: "border border-border bg-white hover:bg-muted/50 transition-colors",
    formButtonPrimary: "bg-primary text-white hover:bg-primary/90 shadow-sm transition-colors !text-white disabled:!text-white disabled:opacity-50",
    formFieldInput: "bg-white border-border text-foreground focus:ring-1 focus:ring-ring focus:border-ring",
    footerAction: "!hidden",
    dividerLine: "bg-border",
    alert: "bg-destructive/10 border-destructive/20 text-destructive",
    otpCodeFieldInput: "border-border text-foreground focus:ring-1 focus:ring-ring focus:border-ring",
    formFieldRow: "mb-4",
    main: "px-6 py-8",
  },
};

// Helps user's webview stay up-to-date when the signed-in user changes by invalidating the QueryClient cache.
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

// Scroll to top on route change component
function ScrollToTop() {
  const [pathname] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Redirect({ to, replace = true }: { to: string; replace?: boolean }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(`${to}${window.location.search}`, { replace });
  }, [to, replace, setLocation]);
  return null;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <ScrollToTop />
      <Switch>
        {/* Admin Authentication */}
        <Route path="/admin/sign-in/*?" component={AdminSignIn} />

        {/* Employer Authentication */}
        <Route path="/employer/login/*?" component={EmployerLogin} />
        <Route path="/employer/sign-up/*?">
          <Layout><div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12"><SignUpPage authPath="/employer/sign-up" signInPath="/employer/login" /></div></Layout>
        </Route>

        {/* Candidate Authentication */}
        <Route path="/candidate/sign-in/*?" component={CandidateSignIn} />
        <Route path="/candidate/sign-up/*?" component={CandidateSignUp} />

        {/* Legacy Recruiter Authentication (redirects to employer login if used) */}
        <Route path="/sign-in/*?">
          <Layout><div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12"><SignInPage /></div></Layout>
        </Route>
        <Route path="/sign-up/*?">
          <Layout><div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12"><SignUpPage /></div></Layout>
        </Route>

        {/* Compatibility Redirects for Recruiter Workspace */}
        <Route path="/recruiter/talent/:id">
          {(params) => <Redirect to={`/employer/talent/${params.id}`} />}
        </Route>
        <Route path="/recruiter/talent">
          <Redirect to="/employer/talent" />
        </Route>
        <Route path="/recruiter/applications/:id">
          {(params) => <Redirect to={`/employer/applications/${params.id}`} />}
        </Route>
        <Route path="/recruiter/applications">
          <Redirect to="/employer/applications" />
        </Route>
        <Route path="/recruiter/jobs">
          <Redirect to="/employer/vacancies" />
        </Route>
        <Route path="/recruiter/company">
          <Redirect to="/employer/company" />
        </Route>
        <Route path="/recruiter">
          <Redirect to="/employer/dashboard" />
        </Route>

        <Route path="/employer/overview">
          <Redirect to="/employer/dashboard" />
        </Route>
        <Route path="/employer">
          <Redirect to="/employer/dashboard" />
        </Route>

        {/* Protected Employer Workspace */}
        <Route path="/employer/dashboard" component={EmployerDashboard} />
        <Route path="/employer/vacancies/:id" component={EmployerVacancies} />
        <Route path="/employer/vacancies" component={EmployerVacancies} />
        <Route path="/employer/applications/:id" component={EmployerApplications} />
        <Route path="/employer/applications" component={EmployerApplications} />
        <Route path="/employer/talent/:id" component={EmployerTalentDetail} />
        <Route path="/employer/talent" component={EmployerTalentSearch} />
        <Route path="/employer/recruitment-requests/new" component={NewEmployerRecruitmentRequest} />
        <Route path="/employer/recruitment-requests/:id" component={EmployerRecruitmentRequestDetail} />
        <Route path="/employer/recruitment-requests" component={EmployerRecruitmentRequests} />
        <Route path="/employer/company" component={EmployerCompany} />

        {/* Protected Admin Routes */}
        <Route path="/admin">
          <AdminLayout><AdminDashboard /></AdminLayout>
        </Route>
        <Route path="/admin/employers">
          <AdminLayout><AdminEmployers /></AdminLayout>
        </Route>
        <Route path="/admin/jobs">
          <AdminLayout><AdminJobs /></AdminLayout>
        </Route>
        <Route path="/admin/candidates">
          <AdminLayout><AdminCandidates /></AdminLayout>
        </Route>
        <Route path="/admin/applications">
          <AdminLayout><AdminApplications /></AdminLayout>
        </Route>
        <Route path="/admin/audit">
          <AdminLayout><AdminAuditLog /></AdminLayout>
        </Route>
        <Route path="/admin/recruitment-requests/:id">
          <AdminLayout><AdminRecruitmentRequestDetail /></AdminLayout>
        </Route>
        <Route path="/admin/recruitment-requests">
          <AdminLayout><AdminRecruitmentRequests /></AdminLayout>
        </Route>
        <Route path="/admin/outreach">
          <AdminLayout><AdminOutreach /></AdminLayout>
        </Route>

        {/* Public Routes - Fallback layout */}
        <Route>
          <Layout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/jobs" component={Jobs} />
              <Route path="/jobs/:id" component={JobDetail} />
              <Route path="/employers" component={Employers} />
              <Route path="/companies" component={Companies} />
               <Route path="/companies/:id" component={CompanyDetail} />
              <Route path="/about" component={About} />
              <Route path="/why-jobsmv" component={About} />
               <Route path="/privacy-policy" component={PrivacyPolicy} />
               <Route path="/terms-and-conditions" component={TermsAndConditions} />
               <Route path="/employer-terms" component={EmployerTerms} />
               <Route path="/candidate-data-consent" component={CandidateDataConsent} />
               <Route path="/contact" component={Contact} />
              <Route path="/passport" component={CandidatePassport} />
               <Route path="/my-career" component={CandidateMyCareer} />
              <Route path="/applications" component={CandidateApplications} />
              <Route path="/saved-jobs" component={CandidateSavedJobs} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </Route>
      </Switch>
    </RoutedErrorBoundary>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to your account",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
