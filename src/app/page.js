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
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" }); // type: 'success' | 'error'

  // Workshop details modal state
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);

  // Admin New Event Form
  const [editingEvent, setEditingEvent] = useState(null);
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

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!editingEvent || !editingEvent.id) return;
    setLoading(`edit-event-${editingEvent.id}`);
    try {
      const res = await fetch("/api/admin/events/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingEvent.id,
          title: editingEvent.title,
          description: editingEvent.description,
          date: new Date(editingEvent.date).toISOString(),
          time: editingEvent.time,
          location: editingEvent.location,
          meet_link: editingEvent.meet_link,
          drive_folder_id: editingEvent.drive_folder_id,
          images: editingEvent.images || [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast("Event updated successfully!");
      setEditingEvent(null);
      fetchEvents();
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
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border transition-all duration-300 transform translate-y-0 scale-100 ${toast.type === "error" ? "bg-white border-red-200 text-red-700" : "bg-white border-brand-pink/20 text-[#2C2623]"
          }`}>
          <div className={`w-2.5 h-2.5 rounded-full ${toast.type === "error" ? "bg-red-500 animate-pulse" : "bg-brand-pink animate-pulse"}`} />
          <span className="text-xs font-semibold tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* Navigation Header */}
      <header className="border-b border-accent-gold/10 glass-header sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-brand-pink/5 border border-accent-gold/15 relative overflow-hidden">
              <Image
                src="/favicon.ico"
                alt="Sai Saree Academy Logo"
                fill
                sizes="48px"
                style={{ objectFit: "contain", padding: "6px" }}
              />
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

        {/* Gallery & Services Section */}
        <section id="gallery" className="py-24 bg-white border-t border-accent-gold/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            {/* Gallery Header */}
            <div className="text-center max-w-xl mx-auto mb-16 flex flex-col gap-4">
              <span className="text-[10px] font-bold text-accent-gold tracking-widest uppercase bg-gold-light/40 px-3 py-1 rounded-full w-fit mx-auto border border-accent-gold/15">The Portfolio</span>
              <h3 className="text-3xl md:text-4xl font-serif font-black text-[#2C2623]">Crafting Crisp Silhouettes</h3>
              <p className="text-xs text-gray-500 font-medium">
                Explore our signature pre-pleating designs and luxury box fold packaging styles that guarantee easy wearability under 2 minutes.
              </p>
            </div>

            {/* Portfolio Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto mb-24">
              <div className="group rounded-3xl overflow-hidden bg-[#FAF7F5] border border-accent-gold/10 shadow-sm hover:shadow-2xl transition-all duration-500">
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
                <div className="p-8 text-left">
                  <span className="text-[9px] uppercase tracking-widest font-black text-brand-pink">Art of Draping</span>
                  <h4 className="font-serif font-bold text-xl text-[#2C2623] mt-1">Flawless Silk Draping</h4>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed font-medium">
                    Pre-pleated, structured, and steam pressed to keep the pallu and waist pleats razor-sharp and aligned.
                  </p>
                </div>
              </div>

              <div className="group rounded-3xl overflow-hidden bg-[#FAF7F5] border border-accent-gold/10 shadow-sm hover:shadow-2xl transition-all duration-500">
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
                <div className="p-8 text-left">
                  <span className="text-[9px] uppercase tracking-widest font-black text-accent-gold">Luxury Storage</span>
                  <h4 className="font-serif font-bold text-xl text-[#2C2623] mt-1">Luxury Box Folding</h4>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed font-medium">
                    Saree folded into an ultra-portable, lightweight box format, ready to wear immediately without ironing.
                  </p>
                </div>
              </div>
            </div>

            {/* Our Services Header */}
            <div className="text-center max-w-xl mx-auto mb-16 flex flex-col gap-4">
              <span className="text-[10px] font-bold text-accent-gold tracking-widest uppercase bg-gold-light/40 px-3 py-1 rounded-full w-fit mx-auto border border-accent-gold/15">Our Specialized Services</span>
              <h3 className="text-3xl md:text-4xl font-serif font-black text-[#2C2623]">Premium Styling Solutions</h3>
              <p className="text-xs text-gray-500 font-medium">
                Every saree has its own character. We customize our pre-pleating techniques to complement different fabrics, drapes, and body profiles.
              </p>
            </div>

            {/* Services Marquee */}
            <div className="w-full overflow-hidden mb-20 relative py-4">
              {/* Fade gradients on edges */}
              <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#FAF7F5] to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#FAF7F5] to-transparent z-10 pointer-events-none" />

              <div className="flex animate-marquee-ltr gap-8 w-max">
                {[
                  { name: "Box Folding", img: "/saree_folding_box.png" },
                  { name: "Semi Fluffy Pleats", img: "/saree_pleating_silk.png" },
                  { name: "Fluffy Pleats", img: "/saree_party.png" },
                  { name: "Fluffy Pleats (Hanger)", img: "/saree_party.png" },
                  { name: "Bridal", img: "/saree_bridal.png" },
                  { name: "Party Wear", img: "/saree_party.png" },
                  { name: "Daily Wear", img: "/saree_pleating_silk.png" },
                  { name: "Long-lasting Pleats", img: "/saree_pleating_silk.png" }
                ].concat([
                  { name: "Box Folding", img: "/saree_folding_box.png" },
                  { name: "Semi Fluffy Pleats", img: "/saree_pleating_silk.png" },
                  { name: "Fluffy Pleats", img: "/saree_party.png" },
                  { name: "Fluffy Pleats (Hanger)", img: "/saree_party.png" },
                  { name: "Bridal", img: "/saree_bridal.png" },
                  { name: "Party Wear", img: "/saree_party.png" },
                  { name: "Daily Wear", img: "/saree_pleating_silk.png" },
                  { name: "Long-lasting Pleats", img: "/saree_pleating_silk.png" }
                ]).map((service, idx) => (
                  <div
                    key={idx}
                    className="relative flex-shrink-0 w-64 h-80 rounded-[2rem] overflow-hidden border border-accent-gold/10 group bg-white shadow-lg hover:border-brand-pink/35 transition-all duration-500"
                  >
                    <div className="absolute inset-0">
                      <Image
                        src={service.img}
                        alt={service.name}
                        fill
                        sizes="256px"
                        style={{ objectFit: "cover" }}
                        className="group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-90 group-hover:opacity-95 transition-opacity duration-300" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
                      <span className="text-[8px] uppercase tracking-widest font-black text-accent-gold/90 block mb-0.5">Signature Service</span>
                      <h4 className="font-serif font-black text-lg text-white tracking-wide leading-tight">{service.name}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rapido Service Banner */}
            <div className="max-w-5xl mx-auto mb-16 bg-gradient-to-r from-brand-pink to-[#E05275] rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 text-left relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 animate-bounce">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.64 8.38m6.16 6.09a3.5 3.5 0 01-3.64-3.64m2.87-8.9a18.75 18.75 0 00-6.17 6.17m0 0a18.75 18.75 0 01-6.17-6.17m6.17 6.17l-4 4m-5.19 1.1l-1.32.9a1 1 0 00-.36 1.15l1.6 3.2a1 1 0 001.39.46l1.32-.9m-1.32-.91a2 2 0 011.83-1.83m-1.83 1.83l-4-4M19.5 4.5h.008v.008h-.008V4.5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-serif font-black text-xl tracking-wide uppercase">⚡ Rapido Service Available</h4>
                  <p className="text-xs text-white/90 mt-1 max-w-xl font-medium">In a rush? Get express pick-up and delivery for your sarees! We collect your sarees, pre-pleat them professionally, and deliver them back to your doorstep in Gudivada.</p>
                </div>
              </div>
              <a href="https://wa.me/919948423310" target="_blank" rel="noreferrer" className="px-6 py-3.5 bg-white text-brand-pink font-bold text-xs uppercase tracking-widest rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 whitespace-nowrap">Book Express Delivery</a>
            </div>

            {/* Business Contact Block & Instagram Link */}
            <div className="max-w-4xl mx-auto bg-[#FAF7F5] border border-accent-gold/15 rounded-3xl p-8 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-10 text-left items-center">
              <div>
                <span className="text-[9px] uppercase tracking-widest font-black text-accent-gold bg-gold-light/40 px-2.5 py-1 rounded-full border border-accent-gold/10">Studio Details</span>
                <h4 className="font-serif font-black text-2xl text-[#2C2623] mt-3">Sai Saree Pre-Pleating</h4>
                <div className="mt-5 space-y-3.5 text-xs text-gray-600 font-semibold">
                  <div className="flex items-center gap-3">
                    <span className="text-base">👤</span>
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Proprietor</p>
                      <p className="text-gray-800">T. Sai</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base">📞</span>
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Phone / WhatsApp</p>
                      <a href="tel:9948423310" className="text-brand-pink hover:underline">+91 99484 23310</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base">📍</span>
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Studio Location</p>
                      <p className="text-gray-800">Sri Ram Puram, Gudivada</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instagram QR Teaser */}
              <div className="flex flex-col items-center justify-center p-6 bg-white border border-accent-gold/10 rounded-2xl text-center group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center text-white mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.01 3.81.058 1.028.047 1.8.22 2.47.487a4.912 4.912 0 011.758 1.143 4.912 4.912 0 011.142 1.758c.267.67.44 1.442.488 2.47.047 1.025.058 1.38.058 3.81s-.01 2.784-.058 3.81c-.048 1.028-.22 1.8-.487 2.47a4.912 4.912 0 01-1.143 1.758 4.912 4.912 0 01-1.758 1.142c-.67.267-1.442.44-2.47.488-.1.047-1.38.058-3.81.058s-2.784-.01-3.81-.058c-1.028-.048-1.8-.22-2.47-.487a4.912 4.912 0 01-1.758-1.142 4.912 4.912 0 01-1.142-1.758c-.267-.67-.44-1.442-.488-2.47C2.01 14.82 2 14.465 2 12.031c0-2.43.01-2.784.058-3.81.047-1.028.22-1.8.487-2.47a4.912 4.912 0 011.142-1.758 4.912 4.912 0 011.758-1.143c.67-.267 1.442-.44 2.47-.488.101-.047 1.38-.058 3.81-.058zM12 6.865A5.135 5.135 0 1017.135 12 5.137 5.137 0 0012 6.865zm0 8.469a3.334 3.334 0 110-6.668 3.334 3.334 0 010 6.668zm5.29-8.471a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h5 className="font-serif font-bold text-lg text-[#2C2623]">Follow our Journey</h5>
                <p className="text-[10px] text-gray-500 mt-1 max-w-[200px] font-semibold">Latest updates, student stories, and pleating tutorials on Instagram</p>
                <a href="https://instagram.com/SAI_SAREE_PRE_PLEATING" target="_blank" rel="noreferrer" className="mt-4 px-6 py-2.5 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:shadow-lg transition-shadow">@SAI_SAREE_PRE_PLEATING</a>
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
                    <div 
                      key={event.id} 
                      onClick={() => setSelectedEventDetails(event)}
                      className="bg-white rounded-3xl border border-accent-gold/10 p-8 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-brand-pink/35 cursor-pointer transition-all duration-300 relative group text-left"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-6">
                          <span className="text-[9px] uppercase font-black text-brand-pink bg-blush-pink px-3 py-1 rounded-full border border-brand-pink/10">
                            {event.time || "TBA"}
                          </span>
                          <span className="text-xs text-accent-gold font-bold">
                            {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                        <h4 className="text-xl font-serif font-bold text-[#2C2623] group-hover:text-brand-pink transition-colors">
                          {event.title}
                        </h4>
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
                          <div className="flex gap-3">
                            <a
                              href="#dashboard"
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 py-3.5 rounded-xl bg-accent-gold hover:bg-gold-dark text-white text-xs uppercase tracking-widest font-bold transition-all shadow-md text-center block"
                            >
                              Manage
                            </a>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingEvent({
                                  ...event,
                                  date: event.date ? new Date(event.date).toISOString().split('T')[0] : ""
                                });
                              }}
                              className="px-4 py-3.5 rounded-xl border border-accent-gold/20 text-[#2C2623] hover:bg-gray-50 text-xs uppercase tracking-widest font-bold transition-all block text-center"
                            >
                              Edit
                            </button>
                          </div>
                        ) : isRegistered ? (
                          <button
                            disabled
                            onClick={(e) => e.stopPropagation()}
                            className="w-full py-3.5 rounded-xl bg-green-50 text-green-700 text-xs uppercase tracking-widest font-black border border-green-200 cursor-default flex items-center justify-center gap-1.5"
                          >
                            ✓ Booked
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRegister(event.id);
                            }}
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
                                <span className={`text-xs font-black inline-block mt-2 px-2.5 py-1 rounded-lg ${reg.payment_status === "COMPLETED" ? "bg-green-50 text-green-700 border border-green-150" : "bg-amber-50 text-amber-700 border border-amber-150"
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
                      <input
                        type="text"
                        placeholder="Search student name / email..."
                        value={adminSearchQuery}
                        onChange={(e) => setAdminSearchQuery(e.target.value)}
                        className="px-4 py-2.5 bg-white border border-accent-gold/30 hover:border-brand-pink text-xs font-bold text-[#2C2623] rounded-xl focus:outline-none placeholder:text-gray-400 transition-colors w-full md:w-56"
                      />
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
                        Refresh
                      </button>
                    </div>
                  </div>

                  {/* Event-Wide Bulk Actions Panel */}
                  {adminEventFilter !== "all" ? (
                    <div className="mb-8 p-5 bg-gradient-to-r from-brand-pink/5 via-white to-accent-gold/5 border border-accent-gold/15 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 text-left shadow-sm">
                      <div>
                        <h4 className="text-[11px] uppercase font-black text-[#2C2623] tracking-widest flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-brand-pink animate-pulse" />
                          Workshop Operations (Bulk)
                        </h4>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 max-w-md">
                          Run event operations in bulk. System targets only students with an <span className="text-[#2C2623] font-black">Approved Tuition</span> and marked <span className="text-[#2C2623] font-black">Present</span>.
                        </p>
                      </div>
                      <div className="flex gap-3 w-full md:w-auto">
                        <button
                          onClick={() => handleSendCertificates(Number(adminEventFilter))}
                          className="flex-1 md:flex-none px-5 py-3 bg-[#2C2623] hover:bg-brand-pink text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all duration-300 shadow-md flex items-center justify-center gap-1.5 hover:scale-[1.02]"
                        >
                          🎓 Send Certificates
                        </button>
                        <button
                          onClick={() => handleGrantDriveAccess(Number(adminEventFilter))}
                          className="flex-1 md:flex-none px-5 py-3 bg-[#2C2623] hover:bg-accent-gold text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all duration-300 shadow-md flex items-center justify-center gap-1.5 hover:scale-[1.02]"
                        >
                          📂 Give Drive Access
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-8 p-4 bg-blush-pink/10 border border-brand-pink/15 rounded-2xl text-left">
                      <p className="text-xs text-brand-pink-dark font-bold flex items-center gap-2">
                        <span>💡</span> Select a specific workshop from the dropdown to run bulk operations (dispatch certificates and grant drive access).
                      </p>
                    </div>
                  )}

                  {/* Batch Actions Panel for Checkboxes */}
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
                      let filteredAdminRegistrations = adminRegistrations.filter((reg) => {
                        if (adminEventFilter === "all") return true;
                        return reg.event_id === Number(adminEventFilter);
                      });

                      if (adminSearchQuery.trim() !== "") {
                        const q = adminSearchQuery.toLowerCase();
                        filteredAdminRegistrations = filteredAdminRegistrations.filter((reg) => 
                          (reg.user.name || "").toLowerCase().includes(q) || 
                          (reg.user.email || "").toLowerCase().includes(q)
                        );
                      }

                      if (filteredAdminRegistrations.length === 0) {
                        return (
                          <div className="p-12 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200 uppercase tracking-widest font-bold">
                            No registrations match the selected filters.
                          </div>
                        );
                      }

                      return (
                        <div className="overflow-x-auto rounded-3xl border border-accent-gold/15 shadow-md bg-white">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-[#FAF7F5] border-b border-accent-gold/15 text-[#2C2623] font-bold uppercase tracking-wider text-[10px]">
                                <th className="py-5 px-5 text-center w-12 border-r border-accent-gold/5">
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
                                <th className="py-5 px-5 font-black">Student Details</th>
                                <th className="py-5 px-5 font-black">Workshop</th>
                                <th className="py-5 px-5 font-black">Tuition Status</th>
                                <th className="py-5 px-5 font-black">Attendance</th>
                                <th className="py-5 px-5 font-black">Certificate</th>
                                <th className="py-5 px-5 font-black">Drive Access</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-accent-gold/10 bg-white">
                              {filteredAdminRegistrations.map((reg) => (
                                <tr key={`${reg.user_id}-${reg.event_id}`} className="hover:bg-[#FAF7F5]/60 transition-colors">
                                  <td className="py-5 px-5 text-center border-r border-accent-gold/5">
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
                                  <td className="py-5 px-5 text-left">
                                    <div className="font-bold text-[#2C2623] text-sm">{reg.user.name}</div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">{reg.user.email}</div>
                                    <div className="text-[9px] text-[#2C2623]/60 mt-0.5 font-bold">📞 {reg.user.phone}</div>
                                  </td>
                                  <td className="py-5 px-5 text-left font-serif font-bold text-gray-700 max-w-[150px] truncate" title={reg.event.title}>
                                    {reg.event.title}
                                  </td>
                                  <td className="py-5 px-5 text-left">
                                    {reg.payment_status === "PENDING" ? (
                                      <button
                                        onClick={() => handleApprovePayment(reg.event_id, reg.user_id)}
                                        disabled={approvingPayment === `${reg.event_id}-${reg.user_id}`}
                                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                                      >
                                        {approvingPayment === `${reg.event_id}-${reg.user_id}` ? "Approving..." : "Verify Payment"}
                                      </button>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-green-700 font-bold bg-green-50 border border-green-200 px-3 py-1 rounded-xl text-[10px]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        ✓ Approved
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-5 px-5 text-left">
                                    {reg.attendance_status === "NOT_MARKED" ? (
                                      <div className="flex gap-1.5">
                                        <button
                                          onClick={() => handleMarkAttendance(reg.event_id, reg.user_id, "PRESENT")}
                                          className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-xl font-black text-[10px] uppercase tracking-wider transition-colors hover:scale-[1.02]"
                                        >
                                          Present
                                        </button>
                                        <button
                                          onClick={() => handleMarkAttendance(reg.event_id, reg.user_id, "ABSENT")}
                                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-black text-[10px] uppercase tracking-wider transition-colors hover:scale-[1.02]"
                                        >
                                          Absent
                                        </button>
                                      </div>
                                    ) : reg.attendance_status === "PRESENT" ? (
                                      <span className="inline-flex items-center gap-1 text-green-700 font-bold bg-green-50 border border-green-200 px-3 py-1 rounded-xl text-[10px]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        ✓ Present
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-red-700 font-bold bg-red-50 border border-red-200 px-3 py-1 rounded-xl text-[10px]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        ✕ Absent
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-5 px-5 text-left">
                                    {reg.certificate_sent ? (
                                      <span className="inline-flex items-center gap-1 text-brand-pink font-bold bg-blush-pink border border-brand-pink/20 px-3 py-1 rounded-xl text-[10px]">
                                        🎓 Dispatched
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-gray-400 font-semibold bg-gray-50 border border-gray-200 px-3 py-1 rounded-xl text-[10px]">
                                        ✕ Not Sent
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-5 px-5 text-left">
                                    {reg.has_drive_access ? (
                                      <div className="flex flex-col">
                                        <span className="inline-flex items-center gap-1 text-accent-gold font-bold bg-gold-light/40 border border-accent-gold/20 px-3 py-1 rounded-xl text-[10px] w-fit">
                                          📂 Granted
                                        </span>
                                        {reg.drive_access_expiry && (
                                          <span className="text-[9px] text-gray-400 mt-1 font-semibold">
                                            Expires: {new Date(reg.drive_access_expiry).toLocaleDateString()}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-gray-400 font-semibold bg-gray-50 border border-gray-200 px-3 py-1 rounded-xl text-[10px]">
                                        ✕ No Access
                                      </span>
                                    )}
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
              Premium saree pre-pleating, luxury box folding, and professional draping classes in Gudivada.
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
            <p className="text-xs text-gray-400 mt-4 font-semibold">📍 Sri Ram Puram, Gudivada</p>
            <p className="text-xs text-gray-400 mt-2 font-semibold">📞 +91 99484 23310</p>
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
              {authMode === "login" ? "Enter credentials to access your dashboard" : "Sign up as a student to access workshops"}
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
                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Description (Syllabus: one topic per line)</label>
                <textarea
                  required
                  placeholder="Enter the syllabus topics, one topic per line (e.g.&#10;1. Product & Essential knowledge&#10;2. Box folding...)"
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
                  placeholder="e.g. Gudivada Studio / Online"
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

      {/* Workshop Details & Syllabus Modal */}
      {selectedEventDetails && (
        <div className="fixed inset-0 z-50 bg-[#2C2623]/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-6 md:p-10 shadow-2xl border border-accent-gold/25 relative animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            
            {/* Close button */}
            <button
              onClick={() => setSelectedEventDetails(null)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-blush-pink hover:bg-brand-pink text-[#2C2623] hover:text-white font-bold text-sm flex items-center justify-center transition-colors duration-300"
            >
              ✕
            </button>

            {/* Header info */}
            <div className="text-left border-b border-accent-gold/10 pb-6 mb-6">
              <span className="text-[9px] uppercase tracking-widest font-black text-brand-pink bg-blush-pink px-3 py-1 rounded-full border border-brand-pink/10">
                Workshop Details
              </span>
              <h4 className="text-2xl md:text-3xl font-serif font-black text-[#2C2623] mt-3 leading-snug">
                {selectedEventDetails.title}
              </h4>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="bg-blush-pink/40 p-3 rounded-2xl border border-brand-pink/5 text-center">
                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Date</span>
                  <span className="text-xs font-serif font-black text-[#2C2623] mt-1 block">
                    {new Date(selectedEventDetails.date).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="bg-blush-pink/40 p-3 rounded-2xl border border-brand-pink/5 text-center">
                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Timings</span>
                  <span className="text-xs font-serif font-black text-[#2C2623] mt-1 block">
                    {selectedEventDetails.time || "11AM to 2PM"}
                  </span>
                </div>
                <div className="bg-gold-light/40 p-3 rounded-2xl border border-accent-gold/10 text-center col-span-2">
                  <span className="text-[9px] uppercase font-bold text-accent-gold block">Offer Price</span>
                  <div className="flex items-center justify-center gap-1.5 mt-0.5">
                    <span className="text-xs text-gray-400 line-through font-bold">Rs. 1199</span>
                    <span className="text-sm font-serif font-black text-brand-pink-dark">Rs. 999/-</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detail sections layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 text-left">
              {/* Left Column: Syllabus */}
              <div className="flex flex-col gap-6">
                <div>
                  <h5 className="font-serif font-black text-base text-brand-pink-dark mb-3 flex items-center gap-2">
                    <span>✨</span> Course Syllabus
                  </h5>
                  <ul className="text-xs text-gray-600 font-semibold space-y-2">
                    {(selectedEventDetails.description || "")
                      .split("\n")
                      .map((line) => line.trim())
                      .filter((line) => line.length > 0)
                      .map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-accent-gold font-bold">{idx + 1}.</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    {!(selectedEventDetails.description || "").trim() && (
                      <li className="text-gray-400 italic">No syllabus topics listed.</li>
                    )}
                  </ul>
                </div>

                <div>
                  <h5 className="font-serif font-black text-base text-brand-pink-dark mb-3 flex items-center gap-2">
                    <span>🎁</span> Complimentary Syllabus
                  </h5>
                  <ul className="text-xs text-gray-600 font-semibold space-y-2">
                    {[
                      "How to start the business.",
                      "Social media tips & tricks.",
                      "Provide e-certificate.",
                      "Provide Recorded video (1 month access)."
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-brand-pink font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column: Requirements & Payment */}
              <div className="flex flex-col gap-6">
                <div>
                  <h5 className="font-serif font-black text-base text-[#2C2623] mb-3 flex items-center gap-2">
                    <span>📝</span> Requirements
                  </h5>
                  <p className="text-xs text-gray-600 font-bold bg-[#FAF7F5] px-4 py-2.5 rounded-xl border border-accent-gold/5 w-fit">
                    Notes & Pen
                  </p>
                </div>

                <div className="bg-[#FAF7F5] p-5 rounded-3xl border border-accent-gold/15">
                  <h5 className="font-serif font-black text-sm text-[#2C2623] mb-2.5 flex items-center gap-1.5">
                    <span>💳</span> Google Pay / PhonePe
                  </h5>
                  <p className="text-[11px] text-gray-700 font-bold leading-relaxed">
                    Number: <span className="text-brand-pink-dark text-xs font-black">9490923825</span><br />
                    Name: <span className="text-[#2C2623] font-black">Venkatesh tatavarthi</span>
                  </p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                    * Please pay to this number
                  </p>

                  <div className="mt-4 pt-4 border-t border-accent-gold/10">
                    <h5 className="font-serif font-black text-sm text-brand-pink-dark mb-1.5 flex items-center gap-1.5">
                      <span>💬</span> WhatsApp Registration
                    </h5>
                    <p className="text-[11px] text-gray-700 font-bold leading-relaxed">
                      After payment, message me on WhatsApp with your name:<br />
                      <a 
                        href="https://wa.me/918885245233" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-brand-pink hover:underline font-black text-xs"
                      >
                        +91 8885245233
                      </a>
                    </p>
                  </div>
                </div>

                <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 text-left">
                  <h6 className="text-[10px] font-black uppercase text-red-700 tracking-wider mb-1.5">Important Notes:</h6>
                  <ul className="text-[10px] text-gray-600 font-semibold space-y-1">
                    <li>• Amount is non-refundable.</li>
                    <li>• On any reason you will not be rescheduled to another batch.</li>
                    <li>• Class will be conducted via Google Meet.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer with Book Masterclass */}
            <div className="mt-10 pt-6 border-t border-accent-gold/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-500 font-medium text-left">
                Ready to transform your styling skills? Book now.
              </p>
              
              <div className="flex gap-4 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => setSelectedEventDetails(null)}
                  className="px-6 py-3.5 rounded-xl border border-accent-gold/20 text-[#2C2623] font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {myRegistrations.some((r) => r.event_id === selectedEventDetails.id) ? (
                  <button
                    disabled
                    className="px-8 py-3.5 rounded-xl bg-green-50 text-green-700 text-xs uppercase tracking-widest font-black border border-green-200 cursor-default flex items-center justify-center gap-1.5"
                  >
                    ✓ Booked
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const id = selectedEventDetails.id;
                      setSelectedEventDetails(null);
                      handleRegister(id);
                    }}
                    disabled={loading === selectedEventDetails.id}
                    className="px-8 py-3.5 rounded-xl bg-brand-pink hover:bg-brand-pink-dark text-white text-xs uppercase tracking-widest font-bold transition-all shadow-md shadow-brand-pink/15 hover:scale-[1.02]"
                  >
                    Book Masterclass
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Edit Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-[#2C2623]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl border border-accent-gold/20 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setEditingEvent(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 font-bold text-base leading-none transition-colors"
            >
              ✕
            </button>

            <h4 className="text-2xl font-serif font-black text-brand-pink-dark mb-6 text-left">Edit Masterclass</h4>
            
            <form onSubmit={handleUpdateEvent} className="grid grid-cols-2 gap-5 text-left">
              <div className="col-span-2">
                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Workshop Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saree Box Folding Masterclass"
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-accent-gold/25 bg-[#FAF7F5] text-[#2C2623] text-xs font-bold tracking-wider placeholder:text-gray-400 focus:outline-none focus:border-brand-pink focus:bg-white transition-colors"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Description (Syllabus: one topic per line)</label>
                <textarea
                  required
                  placeholder="Enter the syllabus topics, one topic per line (e.g.&#10;1. Product & Essential knowledge&#10;2. Box folding...)"
                  value={editingEvent.description || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-accent-gold/25 bg-[#FAF7F5] text-[#2C2623] text-xs font-bold tracking-wider placeholder:text-gray-400 focus:outline-none focus:border-brand-pink focus:bg-white transition-colors h-24 resize-none"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Scheduled Date</label>
                <input
                  type="date"
                  required
                  value={editingEvent.date}
                  onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-accent-gold/25 bg-[#FAF7F5] text-[#2C2623] text-xs font-bold tracking-wider placeholder:text-gray-400 focus:outline-none focus:border-brand-pink focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Class Time</label>
                <input
                  type="text"
                  placeholder="e.g. 11:00 AM - 2:00 PM"
                  value={editingEvent.time || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-accent-gold/25 bg-[#FAF7F5] text-[#2C2623] text-xs font-bold tracking-wider placeholder:text-gray-400 focus:outline-none focus:border-brand-pink focus:bg-white transition-colors"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Location / Venue</label>
                <input
                  type="text"
                  placeholder="e.g. Gudivada Studio / Online"
                  value={editingEvent.location || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-accent-gold/25 bg-[#FAF7F5] text-[#2C2623] text-xs font-bold tracking-wider placeholder:text-gray-400 focus:outline-none focus:border-brand-pink focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Google Meet link</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={editingEvent.meet_link || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, meet_link: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-accent-gold/25 bg-[#FAF7F5] text-[#2C2623] text-xs font-bold tracking-wider placeholder:text-gray-400 focus:outline-none focus:border-brand-pink focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Drive Folder ID</label>
                <input
                  type="text"
                  placeholder="Google Drive Folder ID"
                  value={editingEvent.drive_folder_id || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, drive_folder_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-accent-gold/25 bg-[#FAF7F5] text-[#2C2623] text-xs font-bold tracking-wider placeholder:text-gray-400 focus:outline-none focus:border-brand-pink focus:bg-white transition-colors"
                />
              </div>

              <div className="col-span-2 mt-4">
                <button
                  type="submit"
                  disabled={loading === `edit-event-${editingEvent.id}`}
                  className="w-full py-4 bg-[#2C2623] hover:bg-brand-pink text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading === `edit-event-${editingEvent.id}` ? (
                    <LuxuryDrapeLoader text="Updating..." />
                  ) : (
                    "Save Changes"
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
