import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, Home, Compass, Music2, Library as LibraryIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NoireLogo from "./NoireLogo";
import UserDropdown from "./UserDropdown";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

/**
 * Morra Navbar - Cinematic Top Bar
 */

interface NavbarProps {
  onAuthClick?: (action: "login" | "signup") => void;
  adminMode?: boolean;
}

const Navbar = ({ onAuthClick, adminMode }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } else {
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const guestNavItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  const proNavItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Compass, label: "Discovery", path: "/discovery" },
    { icon: Music2, label: "Moods", path: "/moods" },
    { icon: LibraryIcon, label: "Library", path: "/library" },
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
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-6 left-6 z-50 hidden md:flex"
      >
        <div className="glass-noire rounded-full px-4 py-2 border border-border/30 hover:border-primary/50 transition-colors group">
          <button onClick={() => navigate("/")} className="flex items-center">
            <NoireLogo size={28} showText={true} />
          </button>
        </div>
      </motion.div>

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
            <motion.button
              className="p-2.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/30"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Search className="w-4 h-4" />
            </motion.button>
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

      {/* Mobile Top Navbar */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 md:hidden"
      >
        <div className="glass-noire px-4 py-3 flex items-center justify-between border-b border-border/20">
          <button onClick={() => navigate("/")}>
            <NoireLogo size={26} showText={true} />
          </button>

          <motion.button
            className="p-2 text-foreground rounded-full hover:bg-muted/30"
            whileTap={{ scale: 0.9 }}
          >
            <Search className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.nav>
    </>
  );
};

export default Navbar;
