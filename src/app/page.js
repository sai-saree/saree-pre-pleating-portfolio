"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// Saree/Dress Hanger pleating loader component
const LuxuryDrapeLoader = ({ text = "Please wait..." }) => (
  <span className="flex items-center justify-center gap-2">
    <svg className="w-5 h-5 animate-pulse text-accent-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      {/* Premium Hanger shape */}
      <path d="M12 6a2 2 0 1 1-2-2h1.5v3" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 11l8-4 8 4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 11h16" strokeWidth="1.5" />
      {/* Pleated dress drape */}
      <path d="M7 11l1 8h8l1-8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-pink" />
      {/* Pleat lines */}
      <path d="M10 11v8M12 11v8M14 11v8" strokeWidth="1.5" strokeDasharray="2 2" className="text-brand-pink/70" strokeLinecap="round" />
    </svg>
    <span className="text-[10px] tracking-widest uppercase font-bold text-accent-gold animate-pulse">{text}</span>
  </span>
);

export default function Home() {
  // Authentication & Session state
  const [user, setUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [authMode, setAuthMode] = useState(null); // 'login' | 'signup' | null
  const [authError, setAuthError] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "" });

  // Events & Bookings state
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [adminRegistrations, setAdminRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approvingPayment, setApprovingPayment] = useState(null); // `${eventId}-${userId}`
  const [selectedRegs, setSelectedRegs] = useState([]); // Array of strings: `${eventId}-${userId}`
  const [adminEventFilter, setAdminEventFilter] = useState("all");
  const [toast, setToast] = useState({ message: "", type: "" }); // type: 'success' | 'error'

  // Admin New Event Form
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    meet_link: "",
    drive_folder_id: "",
  });

  // Fetch initial data
  useEffect(() => {
    fetchEvents();
    checkSession();
  }, []);

  useEffect(() => {
    if (user) {
      fetchMyRegistrations();
      if (user.role === "admin") {
        fetchAdminRegistrations();
      }
    } else {
      setMyRegistrations([]);
      setAdminRegistrations([]);
    }
  }, [user]);

  // Toast Helper
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 5000);
  };

  // Auth Operations
  const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (e) {
      console.log("No active session found.");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setLoading("auth");
    
    try {
      if (authMode === "signup") {
        // Step 1: Sign up
        const signupRes = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const signupData = await signupRes.json();
        if (!signupRes.ok) throw new Error(signupData.message || "Signup failed");

        // Step 2: Auto-login after signup
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.message || "Auto-login failed");

        setUser(loginData.user);
        setAuthMode(null);
        setFormData({ name: "", email: "", phone: "", password: "" });
        showToast(`Welcome, ${loginData.user.name}!`);
      } else {
        // Login directly
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");

        setUser(data.user);
        setAuthMode(null);
        setFormData({ name: "", email: "", phone: "", password: "" });
        showToast(`Welcome back, ${data.user.name}!`);
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout request failed:", e);
    }
    setUser(null);
    showToast("Logged out successfully");
    window.location.reload();
  };

  // API Calls - User
  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  const fetchMyRegistrations = async () => {
    try {
      const res = await fetch("/api/events/my-registrations");
      if (res.ok) {
        const data = await res.json();
        setMyRegistrations(data);
      }
    } catch (err) {
      console.error("Error fetching my registrations:", err);
    }
  };

  const handleRegister = async (eventId) => {
    if (!user) {
      setAuthMode("login");
      return;
    }
    setLoading(eventId);
    try {
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      showToast("Successfully registered! Awaiting payment approval.");
      fetchMyRegistrations();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(null);
    }
  };

  // API Calls - Admin
  const fetchAdminRegistrations = async () => {
    try {
      const res = await fetch("/api/admin/events/viewregistrtations");
      if (res.ok) {
        const data = await res.json();
        setAdminRegistrations(data);
      }
    } catch (err) {
      console.error("Error fetching admin registrations:", err);
    }
  };

  const handleApprovePayment = async (eventId, userId) => {
    const key = `${eventId}-${userId}`;
    setApprovingPayment(key);
    try {
      const res = await fetch("/api/admin/events/approve-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, user_ids: [userId] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      if (data.emails && data.emails.some(e => e.status === "success_no_meet")) {
        showToast("Payment approved successfully! (General confirmation email sent)");
      } else {
        showToast("Payment approved successfully! (Google Meet details emailed)");
      }
      await fetchAdminRegistrations();
      await fetchMyRegistrations();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setApprovingPayment(null);
    }
  };

  const handleMarkAttendance = async (eventId, userId, status) => {
    try {
      const res = await fetch("/api/admin/events/mark-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          attendance: [{ user_id: userId, status }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast(`Attendance marked as ${status}!`);
      fetchAdminRegistrations();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleSendCertificates = async (eventId) => {
    try {
      const res = await fetch("/api/admin/events/send-certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast(`Certificates dispatched to ${data.processed_count} present users!`);
      fetchAdminRegistrations();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleGrantDriveAccess = async (eventId) => {
    try {
      const res = await fetch("/api/admin/events/grant-drive-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast(`Drive recording access shared with ${data.processed_count || 0} users!`);
      fetchAdminRegistrations();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Batch actions for Admin Dashboard
  const handleBatchApprovePayments = async () => {
    if (selectedRegs.length === 0) return;
    setLoading("batch-approve");
    try {
      const groups = {};
      selectedRegs.forEach(key => {
        const [eventId, userId] = key.split("-").map(Number);
        if (!groups[eventId]) groups[eventId] = [];
        groups[eventId].push(userId);
      });

      let totalSuccess = 0;
      for (const [eventId, userIds] of Object.entries(groups)) {
        const res = await fetch("/api/admin/events/approve-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_id: Number(eventId), user_ids: userIds }),
        });
        if (res.ok) {
          totalSuccess += userIds.length;
        }
      }

      showToast(`Successfully approved ${totalSuccess} payments!`);
      setSelectedRegs([]);
      await fetchAdminRegistrations();
      await fetchMyRegistrations();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(null);
    }
  };

  const handleBatchMarkAttendance = async (status) => {
    if (selectedRegs.length === 0) return;
    setLoading("batch-attendance");
    try {
      const groups = {};
      selectedRegs.forEach(key => {
        const [eventId, userId] = key.split("-").map(Number);
        if (!groups[eventId]) groups[eventId] = [];
        groups[eventId].push({ user_id: userId, status });
      });

      let totalSuccess = 0;
      for (const [eventId, attendanceRecords] of Object.entries(groups)) {
        const res = await fetch("/api/admin/events/mark-attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_id: Number(eventId), attendance: attendanceRecords }),
        });
        if (res.ok) {
          totalSuccess += attendanceRecords.length;
        }
      }

      showToast(`Successfully marked attendance for ${totalSuccess} participants!`);
      setSelectedRegs([]);
      await fetchAdminRegistrations();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(null);
    }
  };

  const handleBatchSendCertificates = async () => {
    if (selectedRegs.length === 0) return;
    setLoading("batch-certificate");
    try {
      const groups = {};
      selectedRegs.forEach(key => {
        const [eventId, userId] = key.split("-").map(Number);
        if (!groups[eventId]) groups[eventId] = [];
        groups[eventId].push(userId);
      });

      let totalProcessed = 0;
      for (const [eventId, userIds] of Object.entries(groups)) {
        const res = await fetch("/api/admin/events/send-certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_id: Number(eventId), user_ids: userIds }),
        });
        if (res.ok) {
          const data = await res.json();
          totalProcessed += data.processed_count || 0;
        }
      }

      showToast(`Successfully completed certificate processing for ${totalProcessed} participants!`);
      setSelectedRegs([]);
      await fetchAdminRegistrations();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(null);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setLoading("create-event");
    try {
      const res = await fetch("/api/admin/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEvent,
          images: [],
          date: new Date(newEvent.date).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast("New event created successfully!");
      setShowEventModal(false);
      fetchEvents();
      setNewEvent({ title: "", description: "", date: "", time: "", location: "", meet_link: "", drive_folder_id: "" });
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(null);
    }
  };

  const handleSimulateAdminLogin = () => {
    setFormData({ name: "Admin Manager", email: "admin@saisaree.com", phone: "9876543210", password: "adminpassword" });
    setAuthMode("signup");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative font-sans selection:bg-brand-pink/20">
      
      {/* Toast Notification */}
      {toast.message && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border transition-all duration-300 transform translate-y-0 scale-100 ${
          toast.type === "error" ? "bg-white border-red-200 text-red-700" : "bg-white border-brand-pink/20 text-[#2C2623]"
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full ${toast.type === "error" ? "bg-red-500 animate-pulse" : "bg-brand-pink animate-pulse"}`} />
          <span className="text-xs font-semibold tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* Navigation Header */}
      <header className="border-b border-accent-gold/10 glass-header sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-pink flex items-center justify-center shadow-lg shadow-brand-pink/15 border border-brand-pink/10 relative overflow-hidden">
              <span className="text-white font-serif font-bold text-2xl relative z-10">S</span>
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-pink-dark to-brand-pink opacity-80" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-black tracking-wider text-brand-pink-dark uppercase">SAI SAREE</h1>
              <p className="text-[9px] tracking-widest text-accent-gold uppercase font-bold">Pre-Pleating & Academy</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-10 text-xs uppercase tracking-widest font-bold text-foreground/80">
            <a href="#about" className="hover:text-brand-pink transition-colors relative after:absolute after:bottom-[-6px] after:left-0 after:w-0 after:h-[2px] after:bg-brand-pink hover:after:w-full after:transition-all">Art of Pleating</a>
            <a href="#gallery" className="hover:text-brand-pink transition-colors relative after:absolute after:bottom-[-6px] after:left-0 after:w-0 after:h-[2px] after:bg-brand-pink hover:after:w-full after:transition-all">Portfolio</a>
            <a href="#workshops" className="hover:text-brand-pink transition-colors relative after:absolute after:bottom-[-6px] after:left-0 after:w-0 after:h-[2px] after:bg-brand-pink hover:after:w-full after:transition-all">Workshops</a>
            {!initialLoading && user && <a href="#dashboard" className="text-brand-pink hover:text-brand-pink-dark font-black tracking-widest relative">Dashboard</a>}
          </nav>

          <div className="flex items-center gap-4">
            {initialLoading ? (
              <div className="flex items-center gap-3 bg-white/40 border border-accent-gold/5 px-4 py-2 rounded-2xl animate-pulse">
                <div className="w-6 h-6 rounded-lg bg-accent-gold/10" />
                <div className="w-16 h-3 bg-accent-gold/10 rounded" />
              </div>
            ) : user ? (
              <div className="flex items-center gap-4 bg-white/60 border border-accent-gold/10 px-4 py-2 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blush-pink border border-brand-pink/20 flex items-center justify-center">
                    <span className="text-brand-pink font-bold text-xs">{user.name[0]}</span>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-gray-800 leading-tight">{user.name}</span>
                    <span className="text-[9px] text-gray-400 capitalize">{user.role}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-[10px] uppercase tracking-wider text-red-500 hover:text-red-700 font-bold ml-2 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAuthMode("login")}
                  className="px-5 py-2 text-xs uppercase tracking-widest text-[#2C2623] hover:text-brand-pink font-bold transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthMode("signup")}
                  className="px-6 py-3 rounded-xl bg-brand-pink text-white text-xs uppercase tracking-widest font-bold hover:bg-brand-pink-dark hover:shadow-xl hover:shadow-brand-pink/20 transition-all duration-300 border border-brand-pink/10"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1">
        
        {/* Hero Section */}
        <section id="about" className="py-20 lg:py-28 relative overflow-hidden bg-[#FAF7F5]">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-pink/5 rounded-full filter blur-3xl opacity-70 -z-10" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-accent-gold/5 rounded-full filter blur-3xl opacity-70 -z-10" />
          
          <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7 flex flex-col gap-8 text-left">
              <div className="flex items-center gap-2 bg-white/70 border border-accent-gold/15 px-4 py-1.5 rounded-full w-fit shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest text-accent-gold uppercase">
                  Premium Draping Studio & Academy
                </span>
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-7xl font-serif font-black leading-[1.05] text-[#2C2623]">
                The Fine Art of <br />
                <span className="luxury-gradient-text">
                  Saree Pleating
                </span>
              </h2>
              
              <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-xl font-medium">
                Save hours of dressing time and step out in absolute luxury. Master the delicate crafts of precision pre-pleating, luxury box folding, and professional press styling designed to hold perfect folds indefinitely.
              </p>
              
              <div className="flex flex-wrap items-center gap-5 mt-4">
                <a
                  href="#workshops"
                  className="px-8 py-4.5 rounded-xl bg-[#2C2623] hover:bg-brand-pink hover:shadow-2xl hover:shadow-brand-pink/20 text-white font-bold text-xs uppercase tracking-widest transition-all duration-300"
                >
                  Explore Workshops
                </a>
                
                {!initialLoading && !user && (
                  <button
                    onClick={handleSimulateAdminLogin}
                    className="px-8 py-4.5 rounded-xl border border-accent-gold/30 hover:border-brand-pink text-accent-gold hover:text-brand-pink font-bold text-xs uppercase tracking-widest transition-all duration-300 bg-white/40 backdrop-blur-sm"
                  >
                    Simulate Admin (Demo)
                  </button>
                )}
              </div>

              {/* Trust markers */}
              <div className="grid grid-cols-3 gap-6 pt-10 border-t border-accent-gold/10 mt-6 max-w-md">
                <div>
                  <h4 className="font-serif font-black text-2xl text-brand-pink-dark">1,200+</h4>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-1">Students Taught</p>
                </div>
                <div>
                  <h4 className="font-serif font-black text-2xl text-accent-gold">4.9 ★</h4>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-1">Academy Rating</p>
                </div>
                <div>
                  <h4 className="font-serif font-black text-2xl text-brand-pink-dark">100%</h4>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-1">Crisp Folds Guarantee</p>
                </div>
              </div>
            </div>
            
            {/* Gallery teaser */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
              <div className="relative w-80 h-[440px] md:w-96 md:h-[480px] rounded-3xl overflow-hidden shadow-2xl border border-accent-gold/20 p-2 bg-white/70">
                <div className="w-full h-full rounded-2xl overflow-hidden relative">
                  <Image
                    src="/saree_pleating_silk.png"
                    alt="Mannequin wearing a beautifully pleated magenta silk saree"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: "cover" }}
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 text-white text-left">
                    <span className="text-[9px] uppercase tracking-widest font-black text-accent-gold bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-sm">Signature Draping</span>
                    <h5 className="font-serif font-bold text-lg mt-1">Classic Silk Silhouette</h5>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-8 -left-8 w-56 h-56 rounded-3xl border border-accent-gold/20 p-2 bg-white shadow-2xl hidden sm:block transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="w-full h-full rounded-2xl overflow-hidden relative">
                  <Image
                    src="/saree_folding_box.png"
                    alt="Neatly folded box pleat ready for packaging"
                    fill
                    sizes="(max-width: 768px) 100vw, 30vw"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section id="gallery" className="py-24 bg-white border-t border-accent-gold/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-20 flex flex-col gap-4">
              <span className="text-[10px] font-bold text-accent-gold tracking-widest uppercase bg-gold-light/40 px-3 py-1 rounded-full w-fit mx-auto border border-accent-gold/15">The Portfolio</span>
              <h3 className="text-3xl md:text-4xl font-serif font-black text-[#2C2623]">Crafting Crisp Silhouettes</h3>
              <p className="text-xs text-gray-500 font-medium">
                Explore our signature pre-pleating designs and luxury box fold packaging styles that guarantee easy wearability under 2 minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
              
              <div className="group rounded-3xl overflow-hidden bg-white border border-accent-gold/10 shadow-sm hover:shadow-2xl transition-all duration-500">
                <div className="aspect-[4/3] w-full relative overflow-hidden">
                  <Image
                    src="/saree_pleating_silk.png"
                    alt="Perfect pre-pleating"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{ objectFit: "cover" }}
                    className="group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-8 border-t border-accent-gold/10 text-left">
                  <span className="text-[9px] uppercase tracking-widest font-black text-brand-pink">Art of Draping</span>
                  <h4 className="font-serif font-bold text-xl text-[#2C2623] mt-1">Flawless Silk Draping</h4>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed font-medium">
                    Pre-pleated, structured, and steam pressed to keep the pallu and waist pleats razor-sharp and aligned.
                  </p>
                </div>
              </div>

              <div className="group rounded-3xl overflow-hidden bg-white border border-accent-gold/10 shadow-sm hover:shadow-2xl transition-all duration-500">
                <div className="aspect-[4/3] w-full relative overflow-hidden">
                  <Image
                    src="/saree_folding_box.png"
                    alt="Box folding delivery"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{ objectFit: "cover" }}
                    className="group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-8 border-t border-accent-gold/10 text-left">
                  <span className="text-[9px] uppercase tracking-widest font-black text-accent-gold">Luxury Storage</span>
                  <h4 className="font-serif font-bold text-xl text-[#2C2623] mt-1">Luxury Box Folding</h4>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed font-medium">
                    Saree folded into an ultra-portable, lightweight box format, ready to wear immediately without ironing.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Dynamic Workshops Section */}
        <section id="workshops" className="py-24 bg-blush-pink/20 border-t border-accent-gold/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-16">
              <div>
                <span className="text-[10px] font-bold text-accent-gold tracking-widest uppercase bg-white border border-accent-gold/10 px-3 py-1 rounded-full w-fit">Academy Enrollment</span>
                <h3 className="text-3xl md:text-4xl font-serif font-black text-[#2C2623] mt-3">Upcoming Masterclasses</h3>
              </div>
              {user?.role === "admin" && (
                <button
                  onClick={() => setShowEventModal(true)}
                  className="px-6 py-3.5 bg-brand-pink hover:bg-brand-pink-dark text-white rounded-xl text-xs uppercase tracking-widest font-bold transition-all shadow-lg shadow-brand-pink/15 flex items-center gap-2 hover:scale-[1.02]"
                >
                  <span className="text-lg leading-none">+</span> Create Event
                </button>
              )}
            </div>

            {events.length === 0 ? (
              <div className="bg-white border border-accent-gold/15 rounded-3xl p-16 text-center max-w-md mx-auto shadow-sm">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">No workshops scheduled currently. Check back soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map((event) => {
                  const isRegistered = myRegistrations.some((r) => r.event_id === event.id);
                  return (
                    <div key={event.id} className="bg-white rounded-3xl border border-accent-gold/10 p-8 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-300 relative group">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-6">
                          <span className="text-[9px] uppercase font-black text-brand-pink bg-blush-pink px-3 py-1 rounded-full border border-brand-pink/10">
                            {event.time || "TBA"}
                          </span>
                          <span className="text-xs text-accent-gold font-bold">
                            {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                        <h4 className="text-xl font-serif font-bold text-[#2C2623] group-hover:text-brand-pink transition-colors">{event.title}</h4>
                        <p className="text-xs text-gray-500 mt-3 line-clamp-3 leading-relaxed font-medium">{event.description}</p>
                        
                        <div className="mt-6 flex flex-col gap-2.5 text-xs text-gray-500 border-t border-accent-gold/5 pt-4">
                          <div className="flex items-center gap-2">
                            <span>📍</span>
                            <span className="font-semibold text-gray-700">{event.location || "Online"}</span>
                          </div>
                          {event.meet_link && (
                            <div className="flex items-center gap-2">
                              <span>🔗</span>
                              <span className="font-bold text-brand-pink text-[11px]">Google Meet Configured</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-accent-gold/5">
                        {user?.role === "admin" ? (
                          <a
                            href="#dashboard"
                            className="w-full py-3.5 rounded-xl bg-accent-gold hover:bg-gold-dark text-white text-xs uppercase tracking-widest font-bold transition-all shadow-md text-center block"
                          >
                            Manage Registrations
                          </a>
                        ) : isRegistered ? (
                          <button
                            disabled
                            className="w-full py-3.5 rounded-xl bg-green-50 text-green-700 text-xs uppercase tracking-widest font-black border border-green-200 cursor-default flex items-center justify-center gap-1.5"
                          >
                            ✓ Booked
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRegister(event.id)}
                            disabled={loading === event.id}
                            className="w-full py-3.5 rounded-xl bg-brand-pink hover:bg-brand-pink-dark text-white text-xs uppercase tracking-widest font-bold transition-all shadow-md shadow-brand-pink/10 hover:shadow-lg flex items-center justify-center"
                          >
                            {loading === event.id ? (
                              <LuxuryDrapeLoader text="Booking..." />
                            ) : (
                              "Book Masterclass"
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Dashboards Section */}
        {user && (
          <section id="dashboard" className="py-24 bg-white border-t border-accent-gold/10">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              
              {/* User Participant Dashboard */}
              {user.role !== "admin" && (
                <div className="mb-20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
                  <div>
                    <span className="text-[10px] font-bold text-accent-gold tracking-widest uppercase bg-gold-light/40 px-3 py-1 rounded-full border border-accent-gold/15">Student Portal</span>
                    <h3 className="text-3xl font-serif font-black text-[#2C2623] mt-3">My Academy Schedule</h3>
                  </div>
                  <button 
                    onClick={fetchMyRegistrations}
                    className="text-xs text-brand-pink hover:text-brand-pink-dark font-black tracking-wider uppercase border-b-2 border-brand-pink/20 hover:border-brand-pink pb-1 transition-all"
                  >
                    Refresh Dashboard
                  </button>
                </div>

                {myRegistrations.length === 0 ? (
                  <div className="bg-blush-pink/10 border border-dashed border-brand-pink/20 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">You are not enrolled in any upcoming masterclasses.</p>
                    <a href="#workshops" className="inline-block mt-4 px-6 py-2.5 bg-brand-pink hover:bg-brand-pink-dark text-white text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all">Book A Workshop</a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {myRegistrations.map((reg) => (
                      <div key={reg.event_id} className="bg-white rounded-3xl border border-accent-gold/15 p-8 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all duration-300">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-4">
                            <span className="text-[9px] uppercase font-black text-accent-gold bg-gold-light/40 px-2.5 py-1 rounded-full border border-accent-gold/10">
                              {reg.event_time}
                            </span>
                            <span className="text-xs text-gray-400 font-bold">
                              {new Date(reg.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </div>
                          
                          <h4 className="font-serif font-bold text-xl text-[#2C2623]">{reg.event_title}</h4>
                          
                          <div className="grid grid-cols-2 gap-6 my-6 bg-blush-pink/10 p-5 rounded-2xl border border-brand-pink/5">
                            <div>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Payment Status</p>
                              <span className={`text-xs font-black inline-block mt-2 px-2.5 py-1 rounded-lg ${
                                reg.payment_status === "COMPLETED" ? "bg-green-50 text-green-700 border border-green-150" : "bg-amber-50 text-amber-700 border border-amber-150"
                              }`}>
                                {reg.payment_status}
                              </span>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Attendance</p>
                              <span className="text-xs font-black text-[#2C2623] mt-2 block">
                                {reg.attendance_status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-accent-gold/5">
                          {reg.payment_status === "PENDING" && (
                            <div className="text-[11px] text-amber-700 bg-amber-50/50 px-4 py-3 rounded-xl border border-amber-100 flex items-start gap-2 text-left font-medium">
                              <span className="mt-0.5">ℹ️</span>
                              <span>Payment is pending admin verification. Google Meet details will be shared via email once approved.</span>
                            </div>
                          )}
                          {reg.payment_status === "COMPLETED" && reg.meet_link && (
                            <a
                              href={reg.meet_link}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full py-3 bg-[#2C2623] hover:bg-brand-pink text-white rounded-xl text-center text-xs uppercase tracking-widest font-black transition-all shadow-md"
                            >
                              Join Google Meet
                            </a>
                          )}
                          {reg.certificate_sent && (
                            <div className="text-[11px] text-green-700 bg-green-50/50 px-4 py-3 rounded-xl border border-green-150 flex items-start gap-2 text-left font-medium">
                              <span className="mt-0.5">🎓</span>
                              <span>Your professional pre-pleating completion certificate has been emailed!</span>
                            </div>
                          )}
                          {reg.has_drive_access && reg.drive_folder_link ? (
                            <a
                              href={reg.drive_folder_link}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full py-3 border-2 border-accent-gold text-gold-dark hover:bg-accent-gold/5 rounded-xl text-center text-xs uppercase tracking-widest font-black transition-colors"
                            >
                              📂 Open Drive Recordings
                            </a>
                          ) : (
                            <button
                              disabled
                              className="w-full py-3 bg-gray-50 border border-gray-150 text-gray-400 rounded-xl text-center text-xs font-bold cursor-default flex items-center justify-center gap-2"
                            >
                              🔒 Video Recordings Locked
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}

              {/* Admin Control Center */}
              {user.role === "admin" && (
                <div className="bg-white rounded-3xl border border-accent-gold/15 p-8 lg:p-10 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-pink/5 rounded-full filter blur-xl -z-10" />
                  
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-accent-gold/10 pb-6 text-left">
                    <div>
                      <span className="text-[9px] uppercase font-black text-brand-pink bg-blush-pink px-2.5 py-1 rounded-full border border-brand-pink/10">Administrator</span>
                      <h3 className="text-2xl font-serif font-black text-[#2C2623] mt-3">Academy Registrar & Control Panel</h3>
                      <p className="text-xs text-gray-500 mt-1 font-medium">Verify payments, mark participant attendance, dispatch graduation certificates, and grant lecture access.</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <select
                        value={adminEventFilter}
                        onChange={(e) => {
                          setAdminEventFilter(e.target.value);
                          setSelectedRegs([]); // Reset selection on filter change
                        }}
                        className="px-4 py-2.5 bg-white border border-accent-gold/30 hover:border-brand-pink text-xs font-bold text-[#2C2623] rounded-xl focus:outline-none transition-colors cursor-pointer"
                      >
                        <option value="all">All Workshops</option>
                        {events.map((evt) => (
                          <option key={evt.id} value={evt.id}>{evt.title}</option>
                        ))}
                      </select>
                      <button
                        onClick={fetchAdminRegistrations}
                        className="px-6 py-2.5 bg-white border border-accent-gold/30 hover:border-brand-pink hover:bg-brand-pink/5 rounded-xl text-xs font-bold text-accent-gold hover:text-brand-pink uppercase tracking-wider transition-colors w-fit"
                      >
                        Refresh Registrations
                      </button>
                    </div>
                  </div>

                  {/* Premium Batch Actions Panel */}
                  {selectedRegs.length > 0 && (
                    <div className="mb-6 p-4 bg-brand-pink/5 border border-brand-pink/20 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-300 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-brand-pink text-white font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {selectedRegs.length} Selected
                        </span>
                        <p className="text-xs text-brand-pink-dark font-bold">Perform bulk actions for selected participants:</p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        <button
                          onClick={handleBatchApprovePayments}
                          disabled={loading === "batch-approve"}
                          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading === "batch-approve" ? <LuxuryDrapeLoader text="Approving..." /> : "✓ Verify Payment"}
                        </button>
                        <button
                          onClick={() => handleBatchMarkAttendance("PRESENT")}
                          disabled={loading === "batch-attendance"}
                          className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading === "batch-attendance" ? <LuxuryDrapeLoader text="Marking..." /> : "👥 Mark Present"}
                        </button>
                        <button
                          onClick={() => handleBatchMarkAttendance("ABSENT")}
                          disabled={loading === "batch-attendance"}
                          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading === "batch-attendance" ? <LuxuryDrapeLoader text="Marking..." /> : "❌ Mark Absent"}
                        </button>
                        <button
                          onClick={handleBatchSendCertificates}
                          disabled={loading === "batch-certificate"}
                          className="px-3.5 py-2 bg-brand-pink hover:bg-brand-pink-dark text-white rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading === "batch-certificate" ? <LuxuryDrapeLoader text="Sending..." /> : "🎓 Send Certificates"}
                        </button>
                        <button
                          onClick={() => setSelectedRegs([])}
                          className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {adminRegistrations.length === 0 ? (
                    <div className="p-12 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200 uppercase tracking-widest font-bold">
                      No registrations recorded in the database.
                    </div>
                  ) : (
                    (() => {
                      const filteredAdminRegistrations = adminRegistrations.filter((reg) => {
                        if (adminEventFilter === "all") return true;
                        return reg.event_id === Number(adminEventFilter);
                      });

                      if (filteredAdminRegistrations.length === 0) {
                        return (
                          <div className="p-12 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200 uppercase tracking-widest font-bold">
                            No registrations match the selected workshop filter.
                          </div>
                        );
                      }

                      return (
                        <div className="overflow-x-auto rounded-2xl border border-accent-gold/10">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-[#FAF7F5] border-b border-accent-gold/10 text-[#2C2623] font-bold uppercase tracking-wider text-[10px]">
                                <th className="py-4.5 px-4 text-center w-12">
                                  <input
                                    type="checkbox"
                                    checked={filteredAdminRegistrations.length > 0 && filteredAdminRegistrations.every(reg => selectedRegs.includes(`${reg.event_id}-${reg.user_id}`))}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        const allKeys = filteredAdminRegistrations.map(reg => `${reg.event_id}-${reg.user_id}`);
                                        setSelectedRegs(prev => Array.from(new Set([...prev, ...allKeys])));
                                      } else {
                                        const filteredKeys = filteredAdminRegistrations.map(reg => `${reg.event_id}-${reg.user_id}`);
                                        setSelectedRegs(prev => prev.filter(key => !filteredKeys.includes(key)));
                                      }
                                    }}
                                    className="rounded border-accent-gold/30 text-brand-pink focus:ring-brand-pink w-4 h-4 cursor-pointer"
                                  />
                                </th>
                                <th className="py-4.5 px-4 font-black">Student Details</th>
                                <th className="py-4.5 px-4 font-black">Workshop</th>
                                <th className="py-4.5 px-4 font-black">Tuition Status</th>
                                <th className="py-4.5 px-4 font-black">Attendance Status</th>
                                <th className="py-4.5 px-4 font-black">Recording Access</th>
                                <th className="py-4.5 px-4 font-black text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-accent-gold/5 bg-white">
                              {filteredAdminRegistrations.map((reg) => (
                                <tr key={`${reg.user_id}-${reg.event_id}`} className="hover:bg-[#FAF7F5]/50 transition-colors">
                                  <td className="py-4.5 px-4 text-center">
                                    <input
                                      type="checkbox"
                                      checked={selectedRegs.includes(`${reg.event_id}-${reg.user_id}`)}
                                      onChange={(e) => {
                                        const key = `${reg.event_id}-${reg.user_id}`;
                                        if (e.target.checked) {
                                          setSelectedRegs(prev => [...prev, key]);
                                        } else {
                                          setSelectedRegs(prev => prev.filter(k => k !== key));
                                        }
                                      }}
                                      className="rounded border-accent-gold/30 text-brand-pink focus:ring-brand-pink w-4 h-4 cursor-pointer"
                                    />
                                  </td>
                                  <td className="py-4.5 px-4 text-left">
                                    <div className="font-bold text-[#2C2623]">{reg.user.name}</div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">{reg.user.email}</div>
                                  </td>
                                  <td className="py-4.5 px-4 text-left">
                                    <span className="font-medium text-gray-700">{reg.event.title}</span>
                                  </td>
                                  <td className="py-4.5 px-4 text-left">
                                    {reg.payment_status === "PENDING" ? (
                                      <button
                                        onClick={() => handleApprovePayment(reg.event_id, reg.user_id)}
                                        disabled={approvingPayment === `${reg.event_id}-${reg.user_id}`}
                                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {approvingPayment === `${reg.event_id}-${reg.user_id}` ? "Approving..." : "Approve Payment"}
                                      </button>
                                    ) : (
                                      <span className="text-green-600 font-bold bg-green-50 border border-green-100 px-2.5 py-1 rounded-md">✓ Completed</span>
                                    )}
                                  </td>
                                  <td className="py-4.5 px-4 text-left">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-gray-700 min-w-16">{reg.attendance_status}</span>
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => handleMarkAttendance(reg.event_id, reg.user_id, "PRESENT")}
                                          className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded font-semibold text-[9px] transition-colors"
                                        >
                                          Present
                                        </button>
                                        <button
                                          onClick={() => handleMarkAttendance(reg.event_id, reg.user_id, "ABSENT")}
                                          className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded font-semibold text-[9px] transition-colors"
                                        >
                                          Absent
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4.5 px-4 text-left text-gray-500 font-medium">
                                    {reg.drive_access_expiry
                                      ? new Date(reg.drive_access_expiry).toLocaleDateString()
                                      : "None"}
                                  </td>
                                  <td className="py-4.5 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => handleSendCertificates(reg.event_id)}
                                        disabled={reg.payment_status !== "COMPLETED" || reg.attendance_status !== "PRESENT"}
                                        title="Send Certificate"
                                        className="px-3 py-1.5 bg-white hover:bg-brand-pink hover:text-white border border-brand-pink/20 text-brand-pink font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all disabled:opacity-40 disabled:pointer-events-none"
                                      >
                                        🎓 Certificate
                                      </button>
                                      <button
                                        onClick={() => handleGrantDriveAccess(reg.event_id)}
                                        disabled={reg.payment_status !== "COMPLETED" || reg.attendance_status !== "PRESENT"}
                                        title="Share Drive Recordings"
                                        className="px-3 py-1.5 bg-accent-gold text-white hover:bg-gold-dark font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all disabled:opacity-40 disabled:pointer-events-none border border-accent-gold/10"
                                      >
                                        📂 Share Drive
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#2C2623] text-[#FAF7F5]/80 py-16 border-t border-accent-gold/15 mt-20 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
          <div>
            <h5 className="font-serif font-black text-xl text-white tracking-wide">Sai Saree Academy</h5>
            <p className="text-xs text-gray-400 mt-4 max-w-xs leading-relaxed font-medium">
              Premium saree pre-pleating, luxury box folding, and professional draping classes in Hyderabad.
            </p>
          </div>
          <div>
            <h6 className="font-bold text-[10px] uppercase tracking-widest text-accent-gold">Quick Links</h6>
            <ul className="text-xs space-y-3 mt-4 font-semibold">
              <li><a href="#about" className="hover:text-brand-pink transition-colors">Art of Pleating</a></li>
              <li><a href="#gallery" className="hover:text-brand-pink transition-colors">Portfolio Gallery</a></li>
              <li><a href="#workshops" className="hover:text-brand-pink transition-colors">Workshops & Masterclasses</a></li>
            </ul>
          </div>
          <div>
            <h6 className="font-bold text-[10px] uppercase tracking-widest text-accent-gold">Location & Contact</h6>
            <p className="text-xs text-gray-400 mt-4 font-semibold">📍 Banjara Hills, Hyderabad, TS, India</p>
            <p className="text-xs text-gray-400 mt-2 font-semibold">📞 +91 98765 43210</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 border-t border-white/5 mt-12 pt-8 text-center text-xs text-gray-500 font-bold uppercase tracking-wider">
          <p>© {new Date().getFullYear()} Sai Saree Pre-Pleating Academy. All rights reserved.</p>
        </div>
      </footer>

      {/* Auth Modal */}
      {authMode && (
        <div className="fixed inset-0 z-50 bg-[#2C2623]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl border border-accent-gold/20 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Top Close */}
            <button
              onClick={() => {
                setAuthMode(null);
                setAuthError("");
              }}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 font-bold text-base leading-none transition-colors"
            >
              ✕
            </button>

            <h4 className="text-2xl font-serif font-black text-brand-pink-dark mb-2 text-center uppercase tracking-wide">
              {authMode === "login" ? "Welcome Back" : "Create Account"}
            </h4>
            <p className="text-xs text-gray-400 text-center mb-8 font-medium">
              {authMode === "login" ? "Enter credentials to access your dashboard" : "Sign up as a student or admin manager"}
            </p>

            {authError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold text-left flex items-start gap-2">
                <span>⚠️</span>
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-5 text-left">
              {authMode === "signup" && (
                <div>
                  <label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl border border-accent-gold/25 bg-[#FAF7F5] text-[#2C2623] text-xs font-bold tracking-wider placeholder:text-gray-400 focus:outline-none focus:border-brand-pink focus:bg-white transition-colors"
                  />
                </div>
              )}
              
              <div>
                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-accent-gold/25 bg-[#FAF7F5] text-[#2C2623] text-xs font-bold tracking-wider placeholder:text-gray-400 focus:outline-none focus:border-brand-pink focus:bg-white transition-colors"
                />
              </div>

              {authMode === "signup" && (
                <div>
                  <label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Phone Number (10 Digits)</label>
                  <input
                    type="tel"
                    required
                    maxLength="10"
                    placeholder="Enter 10-digit number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl border border-accent-gold/25 bg-[#FAF7F5] text-[#2C2623] text-xs font-bold tracking-wider placeholder:text-gray-400 focus:outline-none focus:border-brand-pink focus:bg-white transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-accent-gold/25 bg-[#FAF7F5] text-[#2C2623] text-xs font-bold tracking-wider placeholder:text-gray-400 focus:outline-none focus:border-brand-pink focus:bg-white transition-colors"
                />
              </div>

              {authMode === "signup" && (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="adminRoleCheckbox"
                    onChange={(e) => setFormData({ ...formData, role: e.target.checked ? "admin" : "user" })}
                    className="rounded border-accent-gold/30 text-brand-pink focus:ring-brand-pink w-4 h-4"
                  />
                  <label htmlFor="adminRoleCheckbox" className="text-xs text-gray-500 font-bold cursor-pointer select-none">
                    Register as Admin Manager
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading === "auth"}
                className="w-full py-4 mt-2 rounded-xl bg-brand-pink hover:bg-brand-pink-dark text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-brand-pink/15 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading === "auth" ? (
                  <LuxuryDrapeLoader text={authMode === "login" ? "Signing In..." : "Creating Account..."} />
                ) : (
                  authMode === "login" ? "Sign In" : "Create Account"
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-xs">
              <span className="text-gray-400 font-medium">
                {authMode === "login" ? "New to Sai Saree Academy?" : "Already have an account?"}
              </span>{" "}
              <button
                onClick={() => {
                  setAuthMode(authMode === "login" ? "signup" : "login");
                  setAuthError("");
                }}
                className="text-brand-pink font-bold hover:underline"
              >
                {authMode === "login" ? "Register here" : "Sign in here"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Create Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-[#2C2623]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl border border-accent-gold/20 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowEventModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 font-bold text-base leading-none transition-colors"
            >
              ✕
            </button>

            <h4 className="text-2xl font-serif font-black text-brand-pink-dark mb-6 text-left">Create New Masterclass</h4>
            
            <form onSubmit={handleCreateEvent} className="grid grid-cols-2 gap-5 text-left">
              <div className="col-span-2">
                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Workshop Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saree Box Folding Masterclass"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-accent-gold/25 bg-[#FAF7F5] text-[#2C2623] text-xs font-bold tracking-wider placeholder:text-gray-400 focus:outline-none focus:border-brand-pink focus:bg-white transition-colors"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Description</label>
                <textarea
                  required
                  placeholder="Details on pleating techniques, materials provided, and curriculum..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-accent-gold/25 bg-[#FAF7F5] text-[#2C2623] text-xs font-bold tracking-wider placeholder:text-gray-400 focus:outline-none focus:border-brand-pink focus:bg-white transition-colors h-24 resize-none"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Scheduled Date</label>
                <input
                  type="date"
                  required
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-accent-gold/25 bg-[#FAF7F5] text-[#2C2623] text-xs font-bold tracking-wider placeholder:text-gray-400 focus:outline-none focus:border-brand-pink focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Class Time</label>
                <input
                  type="text"
                  placeholder="e.g. 11:00 AM - 2:00 PM"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-accent-gold/25 bg-[#FAF7F5] text-[#2C2623] text-xs font-bold tracking-wider placeholder:text-gray-400 focus:outline-none focus:border-brand-pink focus:bg-white transition-colors"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Location / Venue</label>
                <input
                  type="text"
                  placeholder="e.g. Hyderabad Studio / Online"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-accent-gold/25 bg-[#FAF7F5] text-[#2C2623] text-xs font-bold tracking-wider placeholder:text-gray-400 focus:outline-none focus:border-brand-pink focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Google Meet link</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={newEvent.meet_link}
                  onChange={(e) => setNewEvent({ ...newEvent, meet_link: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-accent-gold/25 bg-[#FAF7F5] text-[#2C2623] text-xs font-bold tracking-wider placeholder:text-gray-400 focus:outline-none focus:border-brand-pink focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Drive Folder ID</label>
                <input
                  type="text"
                  placeholder="Google Drive Folder ID"
                  value={newEvent.drive_folder_id}
                  onChange={(e) => setNewEvent({ ...newEvent, drive_folder_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-accent-gold/25 bg-[#FAF7F5] text-[#2C2623] text-xs font-bold tracking-wider placeholder:text-gray-400 focus:outline-none focus:border-brand-pink focus:bg-white transition-colors"
                />
              </div>

              <div className="col-span-2 mt-4">
                <button
                  type="submit"
                  disabled={loading === "create-event"}
                  className="w-full py-4 bg-[#2C2623] hover:bg-brand-pink text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading === "create-event" ? (
                    <LuxuryDrapeLoader text="Creating..." />
                  ) : (
                    "Create Workshop"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
