import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import AppLayout from "./layouts/AppLayout";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Suspense, lazy } from "react";

// Lazy Load Pages
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const EmailPhoneAuth = lazy(() => import("./pages/EmailPhoneAuth"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Profile = lazy(() => import("./pages/Profile"));
const Library = lazy(() => import("./pages/Library"));
const Moods = lazy(() => import("./pages/Moods"));
const Settings = lazy(() => import("./pages/Settings"));
const Create = lazy(() => import("./pages/Create"));
const PostEntry = lazy(() => import("./pages/PostEntry"));
const UserDetails = lazy(() => import("./pages/UserDetails"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Messages = lazy(() => import("./pages/Messages"));
const NotFound = lazy(() => import("./pages/NotFound"));
const StoryUpload = lazy(() => import("./pages/StoryUpload"));
const StoryShare = lazy(() => import("./pages/StoryShare"));
const StoryView = lazy(() => import("./pages/StoryView"));
const View = lazy(() => import("./pages/View"));
const FeedPreview = lazy(() => import("./pages/FeedPreview"));
const VideoCallSetup = lazy(() => import("./pages/VideoCallSetup"));
const CallPage = lazy(() => import("./pages/Call"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Deposit = lazy(() => import("./pages/Deposit"));
const Withdraw = lazy(() => import("./pages/Withdraw"));
const Manager = lazy(() => import("./pages/Manager"));
import { CallProvider } from "./components/calling/CallProvider";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CallProvider>
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-black">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          }>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/email-phone" element={<EmailPhoneAuth />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/story-upload" element={<StoryUpload />} />
              <Route path="/story-share" element={<StoryShare />} />
              <Route path="/view" element={<View />} />
              <Route path="/feed-preview" element={<FeedPreview />} />
              <Route path="/video-call-setup" element={<VideoCallSetup />} />
              <Route path="/call" element={<CallPage />} />
              {/* Protected / App Routes */}
              <Route element={<AppLayout />}>
                <Route path="/create" element={<Create />} />
                <Route path="/post-entry" element={<PostEntry />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/library" element={<Library />} />
                <Route path="/moods" element={<Moods />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/messages/:userId" element={<Messages />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/deposit" element={<Deposit />} />
                <Route path="/withdraw" element={<Withdraw />} />
                <Route path="/manager" element={<Manager />} />

                {/* Identity Routes (must be below specific segment routes) */}
                <Route path="/:username" element={<UserDetails />} />
              </Route>
            </Routes>
            <SpeedInsights />
          </Suspense>
        </CallProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
