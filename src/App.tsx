import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import AppLayout from "./layouts/AppLayout";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import EmailPhoneAuth from "./pages/EmailPhoneAuth";
import VerifyEmail from "./pages/VerifyEmail";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import Library from "./pages/Library";
import Moods from "./pages/Moods";
import Settings from "./pages/Settings";
import Create from "./pages/Create";
import PostEntry from "./pages/PostEntry";
import UserDetails from "./pages/UserDetails";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import StoryUpload from "./pages/StoryUpload";
import StoryShare from "./pages/StoryShare";
import StoryView from "./pages/StoryView";
import View from "./pages/View";
import VideoCallSetup from "./pages/VideoCallSetup";
import CallPage from "./pages/Call";
import Wallet from "./pages/Wallet";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Manager from "./pages/Manager";
import { CallProvider } from "./components/calling/CallProvider";
import "@stream-io/video-react-sdk/dist/css/styles.css";



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CallProvider>
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
        </CallProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
