import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, Home, Compass, Music2, Library as LibraryIcon, Bell, Heart, User, PanelLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NoireLogo from "./NoireLogo";
import UserDropdown from "./UserDropdown";
import SearchModal from "./SearchModal";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { Plus } from "lucide-react";
import StoryTray from "./StoryTray";

interface NavbarProps {
  onAuthClick?: (action: "login" | "signup") => void;
  adminMode?: boolean;
  logoOnly?: boolean;
  showStories?: boolean;
}

const Navbar = ({ onAuthClick, adminMode, logoOnly, showStories }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [activeStories, setActiveStories] = useState<any[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('morraa-sidebar-collapsed') === 'true';
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 's' &&
        !isSearchOpen &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  useEffect(() => {
    let unsubNotifs: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch user data
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        // Real-time notification count (pending requests)
        const q = query(
          collection(db, "notifications"),
          where("toUserId", "==", currentUser.uid),
          where("status", "==", "pending")
        );
        unsubNotifs = onSnapshot(q, (snapshot) => {
          setNotificationCount(snapshot.size);
        });
      } else {
        setUserData(null);
        setNotificationCount(0);
        if (unsubNotifs) unsubNotifs();
      }
    });

    const handleToggle = () => {
      const newState = !(localStorage.getItem('morraa-sidebar-collapsed') === 'true');
      setIsSidebarCollapsed(newState);
    };

    window.addEventListener('morraa:toggleSidebar', handleToggle);

    return () => {
      unsubscribe();
      if (unsubNotifs) unsubNotifs();
      window.removeEventListener('morraa:toggleSidebar', handleToggle);
    };
  }, []);

  const guestNavItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  const handleAuthClick = (action: "login" | "signup") => {
    if (onAuthClick) {
      onAuthClick(action);
    } else {
      window.location.href = `/login?action=${action}`;
    }
  };

  const adminUser = {
    displayName: "Yves",
    email: "yves@noire.pro",
    photoURL: null
  };

  const adminData = {
    username: "yves2008",
    fullName: "Yves Admin",
    isPro: true
  };

  return (
    <>
      {/* Primary Logo Section - Detached Bubble */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-6 left-6 z-50 hidden md:flex"
      >
        <div className="glass-noire rounded-full px-4 py-2 border border-border/30 hover:border-primary/50 transition-colors group flex-shrink-0 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
          <button onClick={() => navigate("/")} className="flex items-center">
            <NoireLogo size={28} showText={!logoOnly} />
          </button>
        </div>
      </motion.div>

      {/* Center Story Tray */}
      {showStories && !logoOnly && (
        <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-40 hidden md:block"
        >
            <div className="glass-noire rounded-full px-6 py-1 border border-border/30 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                <StoryTray />
            </div>
        </motion.div>
      )}

      {/* Right-side Navigation */}
      {!logoOnly && (
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-6 right-6 z-50 hidden md:flex"
        >
          <div className="glass-noire rounded-full px-2 py-2 flex items-center gap-1 border border-border/30 relative">
            {!adminMode && guestNavItems.map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                onMouseEnter={() => setHoveredItem(item.label)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={(e) => {
                  if (item.href.startsWith("/")) {
                    e.preventDefault();
                    navigate(item.href);
                  }
                }}
                className="relative px-5 py-2 text-sm font-body text-muted-foreground hover:text-foreground transition-colors duration-300 rounded-full cursor-pointer z-10"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
              >
                {hoveredItem === item.label && (
                  <motion.div
                    layoutId="nav-glow"
                    className="absolute inset-0 bg-primary/10 rounded-full -z-10 border border-primary/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                  />
                )}
                {item.label}
              </motion.a>
            ))}

            {!adminMode && (
              <div className="flex items-center gap-0.5">
                <motion.button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/30"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Search className="w-4 h-4" />
                </motion.button>

                <motion.button
                  onClick={() => navigate("/notifications")}
                  className="p-3 text-muted-foreground hover:text-white transition-colors rounded-full hover:bg-white/10 relative"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <div className="absolute -top-3 -right-5 flex items-center gap-1.5 bg-[#FF3B30] px-3.5 py-1.5 rounded-full rounded-bl-sm shadow-[0_0_20px_rgba(255,59,48,0.4)] border border-white/20 animate-in zoom-in duration-300 z-50">
                      <User className="w-4 h-4 text-white fill-white" />
                      <span className="text-sm font-black text-white leading-none">
                        {notificationCount}
                      </span>
                    </div>
                  )}
                </motion.button>
              </div>
            )}

            <div className="w-px h-6 bg-border/50" />

            <div className="flex items-center gap-2">
              {adminMode ? (
                <UserDropdown user={adminUser as any} userData={adminData} />
              ) : user ? (
                <UserDropdown user={user} userData={userData} />
              ) : (
                <>
                  <button
                    onClick={() => handleAuthClick("login")}
                    className="px-4 py-2 text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => handleAuthClick("signup")}
                    className="px-5 py-2 text-sm font-body font-medium bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/20"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.nav>
      )}

      {/* Mobile Top Navbar */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 md:hidden"
      >
        <div className="glass-noire px-4 py-3 flex items-center justify-between border-b border-border/20">
          <button onClick={() => navigate("/")}>
            <NoireLogo size={26} showText={!logoOnly} />
          </button>

          {user && !logoOnly && (
            <div className="flex-1 flex justify-center px-4 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2">
                {activeStories.slice(0, 5).map((group) => (
                  <div key={group.userId} className={`w-9 h-9 rounded-full p-[1.5px] ${group.hasUnseen ? 'bg-[#FBBF24]' : 'bg-white/10'}`}>
                    <div
                      className="w-full h-full rounded-full bg-black overflow-hidden cursor-pointer"
                      onClick={() => navigate(`/stories/@${group.username}`)}
                    >
                      {group.userAvatar ? (
                        <img src={group.userAvatar} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold bg-zinc-800 text-white/40">
                          {group.userName?.[0]}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!logoOnly && (
            <div className="flex items-center gap-1">
              <motion.button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-foreground rounded-full hover:bg-muted/30"
                whileTap={{ scale: 0.9 }}
              >
                <Search className="w-5 h-5" />
              </motion.button>

              <motion.button
                onClick={() => navigate("/notifications")}
                className="p-2.5 text-muted-foreground rounded-full hover:bg-white/10 relative"
                whileTap={{ scale: 0.9 }}
              >
                <Bell className="w-6 h-6" />
                {notificationCount > 0 && (
                  <div className="absolute -top-2 -right-4 flex items-center gap-2 bg-[#FF3B30] px-4 py-2 rounded-full rounded-bl-sm shadow-[0_0_25px_rgba(255,59,48,0.5)] border-2 border-white/20 z-50">
                    <User className="w-5 h-5 text-white fill-white" />
                    <span className="text-base font-black text-white leading-none">
                      {notificationCount}
                    </span>
                  </div>
                )}
              </motion.button>
            </div>
          )}
        </div>
      </motion.nav>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Navbar;

