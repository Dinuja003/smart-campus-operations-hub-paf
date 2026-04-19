import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  Bell,
  LogIn,
  UserPlus,
  ArrowRight,
  CalendarCheck2,
  Building2,
  Ticket,
  TrendingUp,
  Clock,
  Shield,
  Zap,
  Users,
  Star,
  Menu,
  X,
  CheckCircle2,
  MapPin,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"

export default function HomePage() {
  const navigate = useNavigate()
  const token = localStorage.getItem("token")
  const email = localStorage.getItem("email") || ""
  const isLoggedIn = !!token

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef(null)

  const SLIDE_INTERVAL = 5000

  const slides = [
    {
      image:
        "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1920&q=80&fit=crop",
      badge: "Smart Campus Operations",
      heading: "Book Campus Resources",
      highlight: "Smarter & Faster",
      sub: "Reserve labs, seminar rooms and sports facilities with real-time availability and instant confirmation workflows.",
    },
    {
      image:
        "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1920&q=80&fit=crop",
      badge: "Collaborative Learning",
      heading: "Empower Every",
      highlight: "Student & Faculty",
      sub: "Role-based access ensures Students, Admins and Technicians each get a workspace perfectly tailored to their needs.",
    },
    {
      image:
        "https://images.unsplash.com/photo-1562774053-701939374585?w=1920&q=80&fit=crop",
      badge: "Campus-Wide Management",
      heading: "Manage All Resources",
      highlight: "Across the Campus",
      sub: "Track availability, monitor maintenance status and view booking analytics from one unified command centre.",
    },
    {
      image:
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&q=80&fit=crop",
      badge: "Intelligent Ticketing",
      heading: "Resolve Issues",
      highlight: "Before They Escalate",
      sub: "Submit maintenance tickets, track incidents and give technicians an organised queue with priority assignments.",
    },
  ]

  const goToSlide = useCallback(
    (idx) => setActiveSlide((idx + slides.length) % slides.length),
    [slides.length]
  )
  const nextSlide = useCallback(() => goToSlide(activeSlide + 1), [activeSlide, goToSlide])
  const prevSlide = useCallback(() => goToSlide(activeSlide - 1), [activeSlide, goToSlide])

  useEffect(() => {
    if (isPaused) return
    intervalRef.current = window.setInterval(nextSlide, SLIDE_INTERVAL)
    return () => window.clearInterval(intervalRef.current)
  }, [isPaused, nextSlide, SLIDE_INTERVAL])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const displayName = email
    ? email
        .split("@")[0]
        .split(/[._-]+/)
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ")
    : "User"

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const features = [
    {
      icon: CalendarCheck2,
      color: "bg-[#f45e2b]/10 text-[#f45e2b]",
      title: "Smart Booking System",
      desc: "Reserve labs, seminar rooms, sports facilities and more with real-time availability. Instant confirmation or approval workflows.",
    },
    {
      icon: Users,
      color: "bg-[#001d45]/10 text-[#001d45]",
      title: "Role-Based Management",
      desc: "Distinct experiences for Students, Admins, and Technicians. Each role sees exactly what they need — nothing more.",
    },
    {
      icon: TrendingUp,
      color: "bg-[#f45e2b]/15 text-[#c04015]",
      title: "Analytics Dashboard",
      desc: "Track peak usage hours, booking trends and resource utilisation with beautiful visual charts and live reports.",
    },
    {
      icon: Ticket,
      color: "bg-[#001d45]/10 text-[#001d45]",
      title: "Ticketing & Incidents",
      desc: "Submit maintenance requests and track resolutions. Technicians get organised queues with priority assignments.",
    },
    {
      icon: Shield,
      color: "bg-red-100 text-red-500",
      title: "Secure Access Control",
      desc: "JWT-based authentication with Google OAuth2. Enterprise-grade security keeps your campus data protected.",
    },
    {
      icon: Zap,
      color: "bg-orange-100 text-orange-500",
      title: "Real-Time Updates",
      desc: "Live booking status, instant notifications and up-to-the-minute resource availability across the entire campus.",
    },
  ]

  const steps = [
    {
      step: "01",
      icon: UserPlus,
      color: "bg-[#001d45]",
      shadow: "shadow-[0_8px_24px_rgba(0,29,69,0.35)]",
      title: "Create Your Account",
      desc: "Sign up with your university email or use Google OAuth. Your role is automatically provisioned.",
    },
    {
      step: "02",
      icon: MapPin,
      color: "bg-brand",
      shadow: "shadow-[0_8px_24px_rgba(244,94,43,0.35)]",
      title: "Browse & Book Resources",
      desc: "Explore available labs, rooms and facilities. Check real-time availability and submit bookings in seconds.",
    },
    {
      step: "03",
      icon: CheckCircle2,
      color: "bg-[#001d45]",
      shadow: "shadow-[0_8px_24px_rgba(0,29,69,0.35)]",
      title: "Track & Manage",
      desc: "Get instant confirmation, receive notifications and manage your entire schedule from one dashboard.",
    },
  ]

  const stats = [
    { value: "2,500+", label: "Bookings Processed", icon: CalendarCheck2, iconBg: "bg-[#f45e2b]/25", iconColor: "text-[#f45e2b]" },
    { value: "50+", label: "Campus Resources", icon: Building2, iconBg: "bg-white/15", iconColor: "text-white" },
    { value: "300+", label: "Active Users", icon: Users, iconBg: "bg-[#f45e2b]/25", iconColor: "text-[#f45e2b]" },
    { value: "98%", label: "Satisfaction Rate", icon: Star, iconBg: "bg-white/15", iconColor: "text-white" },
  ]

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── Navbar ── */}
      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white shadow-[0_2px_20px_rgba(0,29,69,0.12)] backdrop-blur-md"
            : "bg-white shadow-[0_1px_6px_rgba(0,29,69,0.07)]"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="flex items-center gap-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#001d45] shadow-[0_4px_12px_rgba(0,29,69,0.35)]">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-extrabold text-[#001d45]">UniSlot</span>
            </button>

            {/* Desktop Nav Links */}
            <nav className="hidden items-center gap-7 md:flex">
              {[
                { label: "Features", href: "#features" },
                { label: "How it Works", href: "#how-it-works" },
                { label: "About", href: "#stats" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-[#475569] transition-colors hover:text-[#001d45]"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Auth Controls */}
            <div className="hidden items-center gap-3 md:flex">
              {isLoggedIn ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(244,94,43,0.35)] transition-all hover:bg-brand/90 hover:shadow-[0_6px_20px_rgba(244,94,43,0.45)]"
                  >
                    Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/notifications")}
                    className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-[#475569] transition-colors hover:border-brand/30 hover:text-brand"
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4" />
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-orange-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand transition-colors hover:bg-brand/20"
                    aria-label="Profile"
                  >
                    {initials}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="rounded-lg border-2 border-[#001d45] px-4 py-2 text-sm font-semibold text-[#001d45] transition-all hover:bg-[#001d45] hover:text-white"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/signup")}
                    className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(244,94,43,0.35)] transition-all hover:bg-brand/90"
                  >
                    Sign Up Free
                  </button>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              type="button"
              className="rounded-lg p-2 text-[#475569] hover:bg-slate-100 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-4 shadow-lg md:hidden">
            <div className="mb-3 flex flex-col gap-1">
              {["Features", "How it Works", "About"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-[#475569] hover:bg-slate-50 hover:text-brand"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="w-full rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-[#475569]"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/signup")}
                    className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white"
                  >
                    Sign Up Free
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── Hero Slider ── */}
      <section
        className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Keyframe styles */}
        <style>{`
          @keyframes kb {
            from { transform: scale(1) translate(0, 0); }
            to   { transform: scale(1.10) translate(-1.5%, -1%); }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(28px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes progressFill {
            from { width: 0%; }
            to   { width: 100%; }
          }
          .hero-img  { animation: kb 7s ease-out forwards; }
          .hero-text { opacity: 0; animation: slideUp 0.65s ease-out forwards; }
          .hero-progress { animation: progressFill linear forwards; }
        `}</style>

        {/* ── Slide panels (crossfade) ── */}
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className="absolute inset-0 transition-opacity duration-[900ms] ease-in-out"
            style={{ opacity: idx === activeSlide ? 1 : 0 }}
          >
            {/* Background image — Ken Burns restarts each time this slide becomes active */}
            <div
              key={`kb-${idx}-${activeSlide === idx ? "on" : "off"}`}
              className="hero-img absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            {/* Layered overlays: left-heavy gradient + bottom vignette */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        ))}

        {/* ── Slide content — remounts on change to restart slide-up anim ── */}
        <div className="relative z-10 flex h-full items-center">
          <div className="mx-auto w-full max-w-7xl px-20 sm:px-24 lg:px-28">
            <div key={activeSlide} className="max-w-2xl">
              {/* Badge */}
              <div
                className="hero-text mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm"
                style={{ animationDelay: "0ms" }}
              >
                <Sparkles className="h-3.5 w-3.5 text-[#f45e2b]" />
                {slides[activeSlide].badge}
              </div>

              {/* Heading */}
              <h1
                className="hero-text mb-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]"
                style={{ animationDelay: "90ms" }}
              >
                {slides[activeSlide].heading}
                <span className="block text-[#f45e2b]">{slides[activeSlide].highlight}</span>
              </h1>

              {/* Sub */}
              <p
                className="hero-text mb-8 max-w-xl text-lg leading-relaxed text-white/80"
                style={{ animationDelay: "180ms" }}
              >
                {slides[activeSlide].sub}
              </p>

              {/* CTAs */}
              <div
                className="hero-text flex flex-wrap gap-3"
                style={{ animationDelay: "270ms" }}
              >
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="group flex items-center gap-2 rounded-xl bg-brand px-7 py-3.5 text-base font-semibold text-white shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all hover:-translate-y-0.5 hover:bg-brand/90"
                  >
                    Open Dashboard
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate("/signup")}
                      className="group flex items-center gap-2 rounded-xl bg-brand px-7 py-3.5 text-base font-semibold text-white shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all hover:-translate-y-0.5 hover:bg-brand/90"
                    >
                      Get Started Free
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/12 px-7 py-3.5 text-base font-medium text-white backdrop-blur-sm transition-all hover:bg-white/22"
                    >
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Prev / Next arrows ── */}
        <button
          type="button"
          onClick={prevSlide}
          className="absolute left-4 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/25 text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:left-6"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={nextSlide}
          className="absolute right-4 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/25 text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:right-6"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* ── Bottom HUD: counter · dots · stats + progress bar ── */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="mx-auto max-w-7xl px-6 pb-7 sm:px-8 lg:px-12">
            <div className="flex items-end justify-between gap-4">
              {/* Slide counter */}
              <div className="flex items-baseline gap-1 text-white/60 select-none">
                <span className="text-2xl font-bold leading-none text-white">
                  {String(activeSlide + 1).padStart(2, "0")}
                </span>
                <span className="text-sm">/ {String(slides.length).padStart(2, "0")}</span>
              </div>

              {/* Dot indicators */}
              <div className="flex items-center gap-2">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => goToSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: idx === activeSlide ? "2rem" : "0.5rem",
                      height: "0.5rem",
                      background: idx === activeSlide ? "#f45e2b" : "rgba(255,255,255,0.35)",
                    }}
                  />
                ))}
              </div>

              {/* Quick stats */}
              <div className="hidden gap-6 sm:flex">
                {[
                  { value: "500+", label: "Students" },
                  { value: "50+", label: "Resources" },
                  { value: "24/7", label: "Available" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-sm font-bold text-white">{s.value}</p>
                    <p className="text-[10px] text-white/55">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress bar — restarts on slide change */}
            <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-white/15">
              <div
                key={`prog-${activeSlide}-${isPaused ? "p" : "r"}`}
                className="hero-progress h-full rounded-full bg-[#f45e2b]"
                style={{
                  animationDuration: `${SLIDE_INTERVAL}ms`,
                  animationPlayState: isPaused ? "paused" : "running",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Strip ── */}
      <section className="bg-navy py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {[
              { icon: CalendarCheck2, text: "Instant Booking" },
              { icon: Shield, text: "Role-Based Access" },
              { icon: TrendingUp, text: "Usage Analytics" },
              { icon: Ticket, text: "Ticketing System" },
              { icon: Clock, text: "Real-Time Availability" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-white/75">
                <Icon className="h-4 w-4 text-[#f45e2b]" />
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-brand">
              Platform Features
            </p>
            <h2 className="mb-4 text-3xl font-bold text-navy sm:text-4xl">
              Everything you need to manage
              <br />
              your campus efficiently
            </h2>
            <p className="mx-auto max-w-xl text-[#64748b]">
              From instant bookings to maintenance tickets — UniSlot handles all operational
              workflows in one unified platform.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(0,29,69,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,29,69,0.10)]"
                >
                  <div
                    className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-navy">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-[#64748b]">{f.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
                    Learn more <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Dashboard Preview ── */}
      <section className="bg-[#f5f4f1] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-brand">
                Powerful Dashboard
              </p>
              <h2 className="mb-4 text-3xl font-bold text-navy sm:text-4xl">
                Your campus operations,
                <br />
                all in one view
              </h2>
              <p className="mb-6 leading-relaxed text-[#64748b]">
                The UniSlot dashboard gives you a real-time command centre — live metrics,
                booking calendars, resource status and smart shortcuts tailored to your role.
              </p>
              <ul className="mb-8 space-y-3">
                {[
                  "Live booking metrics and occupancy stats",
                  "Role-specific smart shortcuts",
                  "Interactive calendar with booking highlights",
                  "Pending alerts and notification digest",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-[#475569]">
                    <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-brand" />
                    {item}
                  </li>
                ))}
              </ul>
              {!isLoggedIn && (
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="group flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(244,94,43,0.35)] transition-all hover:-translate-y-0.5"
                >
                  Try it now
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              )}
            </div>

            {/* Mock dashboard UI */}
            <div className="relative">
              <div className="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-[0_24px_80px_rgba(0,29,69,0.15)]">
                {/* Fake browser bar */}
                <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <div className="mx-3 flex-1 rounded-md bg-slate-200 px-3 py-1 text-[9px] text-slate-400">
                    unislot.campus.local
                  </div>
                </div>
                {/* Fake dashboard content */}
                <div className="bg-[#f5f4f1] p-4">
                  {/* Promo banner mock */}
                  <div className="mb-3 rounded-xl bg-gradient-to-r from-brand to-navy px-5 py-4">
                    <div className="mb-1 h-1.5 w-16 rounded-full bg-white/30" />
                    <div className="mb-1 h-4 w-40 rounded-full bg-white/80" />
                    <div className="h-2.5 w-28 rounded-full bg-white/40" />
                  </div>
                  {/* Metric cards */}
                  <div className="mb-3 grid grid-cols-4 gap-2">
                    {[
                      { bg: "bg-brand", val: "24", lbl: "Bookings" },
                      { bg: "bg-emerald-500", val: "8", lbl: "Upcoming" },
                      { bg: "bg-[#f45e2b]", val: "3", lbl: "Pending" },
                      { bg: "bg-navy", val: "12", lbl: "Resources" },
                    ].map((c) => (
                      <div
                        key={c.lbl}
                        className="rounded-xl border border-white/70 bg-white p-2.5 shadow-sm"
                      >
                        <div className={`mb-1.5 h-5 w-5 rounded-md ${c.bg}`} />
                        <p className="text-xs font-bold text-navy">{c.val}</p>
                        <p className="text-[9px] text-slate-400">{c.lbl}</p>
                      </div>
                    ))}
                  </div>
                  {/* Table mock */}
                  <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-3 py-2.5">
                      <div className="h-2.5 w-28 rounded-full bg-slate-200" />
                    </div>
                    {[1, 2, 3].map((row) => (
                      <div
                        key={row}
                        className="flex items-center gap-2.5 border-b border-slate-50 px-3 py-2"
                      >
                        <div className="h-6 w-6 rounded-lg bg-brand/15" />
                        <div className="flex-1 space-y-1">
                          <div className="h-2 w-20 rounded-full bg-slate-200" />
                          <div className="h-1.5 w-12 rounded-full bg-slate-100" />
                        </div>
                        <div className="h-4 w-12 rounded-full bg-emerald-100" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 rounded-xl border border-white bg-white px-4 py-3 shadow-[0_8px_24px_rgba(0,29,69,0.12)]">
                <p className="text-xs font-bold text-navy">Live Dashboard</p>
                <p className="text-[10px] text-slate-400">Updates in real-time</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section id="how-it-works" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-brand">
              How It Works
            </p>
            <h2 className="mb-4 text-3xl font-bold text-navy sm:text-4xl">
              Get started in 3 simple steps
            </h2>
            <p className="mx-auto max-w-xl text-[#64748b]">
              UniSlot makes campus resource management effortless for everyone.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            {steps.map((step, idx) => {
              const Icon = step.icon
              return (
                <div key={step.step} className="relative flex flex-col items-center text-center">
                  {idx < steps.length - 1 && (
                    <div className="absolute left-[calc(50%+3rem)] top-8 hidden h-px w-[calc(100%-6rem)] bg-gradient-to-r from-brand/30 to-transparent md:block" />
                  )}
                  <div className="relative mb-5">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl text-white ${step.color} ${step.shadow}`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-navy">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-[#64748b]">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section id="stats" className="bg-gradient-to-br from-navy to-[#000000] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Trusted across campus
            </h2>
            <p className="mt-3 text-white/60">Numbers that speak for themselves</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => {
              const Icon = s.icon
              return (
                <div
                  key={s.label}
                  className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/8 p-7 text-center backdrop-blur-sm transition-all hover:bg-white/12"
                >
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${s.iconBg}`}>
                    <Icon className={`h-6 w-6 ${s.iconColor}`} />
                  </div>
                  <p className="text-4xl font-bold text-white">{s.value}</p>
                  <p className="mt-1 text-sm text-white/60">{s.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonial / Quote ── */}
      <section className="bg-[#f5f4f1] py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6 flex justify-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-[#f45e2b] text-[#f45e2b]" />
            ))}
          </div>
          <blockquote className="mb-6 text-xl font-medium italic text-navy leading-relaxed">
            "UniSlot completely transformed how our faculty manages lab allocations. What used
            to take hours of back-and-forth emails now happens in seconds."
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 font-bold text-brand text-sm">
              DR
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-navy">Dr. Rangana Silva</p>
              <p className="text-xs text-slate-500">Faculty of Computing, SLIIT</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand to-[#001d45] px-8 py-16 text-center shadow-[0_24px_80px_rgba(0,29,69,0.25)]">
            {/* Decorative circles */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -left-8 bottom-0 h-40 w-40 rounded-full bg-[#f45e2b]/10" />
            <div className="pointer-events-none absolute right-1/4 bottom-8 h-20 w-20 rounded-full bg-white/5" />

            <div className="relative">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/60">
                Ready to transform your campus?
              </p>
              <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                Start using UniSlot today
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-lg text-white/70">
                Join hundreds of students and staff already using UniSlot to streamline campus
                resource management.
              </p>
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-navy shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Open Dashboard
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate("/signup")}
                    className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-navy shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    Start for Free
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-3.5 text-base font-medium text-white transition-all hover:bg-white/20"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-[#f5f4f1] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand">
                <Building2 className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-extrabold text-navy">UniSlot</span>
              <span className="text-sm text-slate-400">— Smart Campus Operations Hub</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <a href="#features" className="hover:text-brand transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-brand transition-colors">
                How it Works
              </a>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="hover:text-brand transition-colors"
              >
                Sign In
              </button>
            </div>
            <p className="text-sm text-slate-400">© 2025 UniSlot. Built for modern campuses.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
