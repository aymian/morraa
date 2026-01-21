import { Outlet, useLocation } from "react-router-dom";
import Navbar from "@/components/noire/Navbar";
import FloatingSidebar from "@/components/noire/FloatingSidebar";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const AppLayout = () => {
    const [user, setUser] = useState<any>(null);
    const location = useLocation();
    const isMessagesPage = location.pathname.startsWith('/messages');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsubscribe();
    }, []);

    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden content-shift">
            {user && <FloatingSidebar />}
            <Navbar logoOnly={isMessagesPage} />
            <Outlet />
        </div>
    );
};

export default AppLayout;
