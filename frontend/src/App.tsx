
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

import {
  Activity,
  Bell,
  Cpu,
  LayoutDashboard,
  MapPin,
  Search,
  Settings2,
  Zap,
  Sun,
  Menu,
  LogOut,
  UserRound,
  Settings,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

import {
  getLocations,
  getDevices,
  getEnergy,
  getMeasurements,
  getAlerts,
  getCurrentRole,
} from "./Api";

import "./App.css";

import type {
  Location,
  Device,
  EnergyRow,
  Measurement,
  Alert,
} from "./types";

import Dashboard from "./pages/Dashboard";
import Locations from "./pages/Locations";
import Devices from "./pages/Devices";
import Measurements from "./pages/Measurements";
import Alerts from "./pages/Alerts";
import EnergyAnalytics from "./pages/EnergyAnalytics";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Locații", icon: MapPin },
  { label: "Dispozitive", icon: Cpu },
  { label: "Măsurători", icon: Activity },
  { label: "Alerte", icon: Bell },
];

function getInitials(fullName: string, email = ""): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return (
      parts[0].charAt(0) + parts[1].charAt(0)
    ).toUpperCase();
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return email.slice(0, 2).toUpperCase() || "GE";
}

function App() {
  const [initials, setInitials] = useState("GE");
  const [role, setRole] = useState<"admin" | "user">("user");
  const isAdmin = role === "admin";
  const [profileOpen, setProfileOpen] = useState(false);
  const [accountPage, setAccountPage] = useState("");

  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
  });

  const [locations, setLocations] = useState<Location[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [energy, setEnergy] = useState<EnergyRow[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const [selectedLocation, setSelectedLocation] = useState("all");
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UTILIZATOR AUTENTIFICAT
  useEffect(() => {
    let mounted = true;

    const updateUserInfo = (
      user: {
        email?: string;
        user_metadata?: Record<string, any>;
      } | null
    ) => {
      if (!mounted) return;

      if (!user) {
        setInitials("GE");
        setUserInfo({ name: "", email: "" });
        return;
      }

      const metadata = user.user_metadata || {};

      const fullName =
        metadata.full_name ||
        metadata.name ||
        [metadata.last_name, metadata.first_name]
          .filter(Boolean)
          .join(" ") ||
        "";

      setInitials(
        getInitials(fullName, user.email || "")
      );

      setUserInfo({
        name: fullName || "Utilizator",
        email: user.email || "",
      });
    };

    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error(
          "Eroare la preluarea utilizatorului:",
          error
        );
        return;
      }

      updateUserInfo(data.user);
    };

    loadUser();

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          updateUserInfo(session?.user || null);
        }
      );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Rolul este confirmat de backend; implicit utilizatorul are doar citire.
  useEffect(() => {
    let mounted = true;
    const loadRole = async () => {
      try {
        const currentRole = await getCurrentRole();
        if (mounted) setRole(currentRole);
      } catch (error) {
        console.error("Nu s-a putut verifica rolul:", error);
        if (mounted) setRole("user");
      }
    };
    loadRole();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setRole("user");
      else window.setTimeout(loadRole, 0);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  // ÎNCĂRCARE DATE
  const refreshData = async () => {
    try {
      const [
        locationData,
        deviceData,
        energyData,
        measurementData,
        alertData,
      ] = await Promise.all([
        getLocations(),
        getDevices(),
        getEnergy(),
        getMeasurements(),
        getAlerts(),
      ]);

      setLocations(locationData);
      setDevices(deviceData);
      setEnergy(energyData);
      setMeasurements(measurementData);
      setAlerts(alertData);
      setError("");
    } catch (err) {
      console.error(
        "Eroare la încărcarea datelor:",
        err
      );

      setError(
        "Nu s-au putut încărca datele din Supabase."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // DECONECTARE
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(
        "Eroare la deconectare:",
        error
      );

      alert(
        "Nu s-a putut realiza deconectarea."
      );
      return;
    }

    window.location.replace("/login");
  };

  // NAVIGARE
  const navigateToPage = (page: string) => {
    setActivePage(page);
    setAccountPage("");
    setSidebarOpen(false);
    setProfileOpen(false);
  };

  const navigateToAccount = (page: string) => {
    setAccountPage(page);
    setProfileOpen(false);
    setSidebarOpen(false);
  };

  const pageProps = {
    locations,
    devices,
    measurements,
    energy,
    alerts,
    selectedLocation,
    onRefresh: refreshData,
    isAdmin,
  };

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return <Dashboard {...pageProps} />;

      case "Locații":
        return <Locations {...pageProps} />;

      case "Dispozitive":
        return <Devices {...pageProps} />;

      case "Măsurători":
        return <Measurements {...pageProps} />;

      case "Alerte":
        return <Alerts {...pageProps} />;

      case "Energy Analytics":
        return <EnergyAnalytics {...pageProps} />;

      default:
        return <Dashboard {...pageProps} />;
    }
  };

  return (
    <div className="dashboard-shell">

      {/* MENIU LATERAL */}
      <aside
        className={`sidebar ${
          sidebarOpen ? "open" : ""
        }`}
      >
        <div className="brand">
          <div className="brand-icon">
            <Zap
              size={23}
              fill="currentColor"
            />
          </div>

          <div>
            <strong>
              GREEN<span>ENERGY</span>
            </strong>

            <small>
              MONITORING SYSTEM
            </small>
          </div>
        </div>

        <div className="sidebar-section">
          WORKSPACE
        </div>

        <nav className="sidebar-nav">
          {navigation.map(
            ({ label, icon: Icon }) => (
              <button
                key={label}
                className={`nav-link ${
                  !accountPage &&
                  activePage === label
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  navigateToPage(label)
                }
              >
                <Icon size={18} />

                <span>{label}</span>

                {!accountPage &&
                  activePage === label && (
                    <span className="nav-indicator" />
                  )}
              </button>
            )
          )}
        </nav>

        <div className="sidebar-section secondary-title">
          SYSTEM
        </div>

        <button
          className={`system-link ${
            !accountPage &&
            activePage === "Energy Analytics"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            navigateToPage("Energy Analytics")
          }
        >
          <Settings2 size={18} />
          <span>Energy Analytics</span>
        </button>

        <div className="sidebar-bottom">
          <div className="sidebar-bottom-icon">
            <Sun size={25} />
          </div>

          <strong>
            Energy Intelligence
          </strong>

          <p>
            Monitorizare inteligentă a energiei.
          </p>

          <span>
            GREEN ENERGY / 2026
          </span>
        </div>
      </aside>

      {/* SPAȚIU PRINCIPAL */}
      <div className="workspace">

        {/* BARA DE SUS */}
        <header className="topbar">
          <div className="topbar-left">

            <button
              className="mobile-menu icon-button"
              onClick={() =>
                setSidebarOpen(!sidebarOpen)
              }
              aria-label="Deschide meniul"
            >
              <Menu size={21} />
            </button>

            <div className="breadcrumb">
              Workspace <span>/</span>{" "}
              {accountPage || activePage}
            </div>
          </div>

          <div className="topbar-right">

            <div className="search-display">
              <Search size={16} />
              <span>
                Energy monitoring
              </span>
            </div>

            <div className="topbar-divider" />

            {/* MENIU PROFIL */}
            <div className="profile-container">

              <button
                type="button"
                className="profile-trigger"
                onClick={() =>
                  setProfileOpen(!profileOpen)
                }
                aria-expanded={profileOpen}
                aria-label="Deschide meniul contului"
              >
                <span className="profile-avatar">
                  {initials}
                </span>

                <ChevronDown size={15} />
              </button>

              {profileOpen && (
                <div className="profile-dropdown">

                  <div className="profile-dropdown-header">
                    <div className="profile-avatar profile-avatar-large">
                      {initials}
                    </div>

                    <div className="profile-user-details">
                      <strong>
                        {userInfo.name}
                      </strong>

                      <small>
                        {userInfo.email}
                      </small>
                    </div>
                  </div>

                  <div className="profile-dropdown-divider" />

                  <button
                    className="profile-dropdown-item"
                    onClick={() =>
                      navigateToAccount(
                        "Informații cont"
                      )
                    }
                  >
                    <UserRound size={18} />
                    <span>
                      Informații cont
                    </span>
                  </button>

                  <button
                    className="profile-dropdown-item"
                    onClick={() =>
                      navigateToAccount(
                        "Setări cont"
                      )
                    }
                  >
                    <Settings size={18} />
                    <span>
                      Setări cont
                    </span>
                  </button>

                  <button
                    className="profile-dropdown-item"
                    onClick={() =>
                      navigateToAccount(
                        "Securitate"
                      )
                    }
                  >
                    <ShieldCheck size={18} />
                    <span>
                      Securitate
                    </span>
                  </button>

                  <div className="profile-dropdown-divider" />

                  <button
                    className="profile-dropdown-item logout-item"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />
                    <span>
                      Deconectare
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONȚINUT PAGINĂ */}
        <main className="dashboard-content">

          {/* ANTETUL ENERGY APARE DOAR PE PAGINILE APLICAȚIEI */}
          {!accountPage && (
            <div className="page-heading">

              <div>
                <div className="section-kicker">
                  ENERGY ANALYTICS / OVERVIEW
                </div>

                <h1>
                  {activePage === "Dashboard"
                    ? "Energy Overview"
                    : activePage}
                </h1>

                <p>
                  Monitorizarea producției și
                  consumului de energie
                </p>
              </div>

              <div className="page-actions">

                <div className="live-status">
                  <span className="live-dot" />
                  API conectat
                </div>

                <select
                  value={selectedLocation}
                  onChange={(event) =>
                    setSelectedLocation(
                      event.target.value
                    )
                  }
                  className="location-select"
                  aria-label="Selectează locația"
                >
                  <option value="all">
                    Toate locațiile
                  </option>

                  {locations.map(
                    (location) => (
                      <option
                        key={location.id}
                        value={location.id}
                      >
                        {location.name}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          )}

          {/* PAGINILE PERSONALE */}
          {accountPage ? (
            <div className="account-panel">

              <button
                className="profile-dropdown-item"
                onClick={() =>
                  navigateToPage("Dashboard")
                }
              >
                ← Înapoi la Dashboard
              </button>

              <h2>{accountPage}</h2>

              {accountPage ===
                "Informații cont" && (
                <div>
                  <p>
                    <strong>Nume:</strong>{" "}
                    {userInfo.name}
                  </p>

                  <p>
                    <strong>Email:</strong>{" "}
                    {userInfo.email}
                  </p>
                </div>
              )}

              {accountPage ===
                "Setări cont" && (
                <p>
                  Setările contului vor fi
                  disponibile aici.
                </p>
              )}

              {accountPage ===
                "Securitate" && (
                <p>
                  Opțiunile de securitate vor fi
                  disponibile aici.
                </p>
              )}
            </div>
          ) : (
            <>
              {loading && (
                <div className="message">
                  Se încarcă datele...
                </div>
              )}

              {error && (
                <div className="message error">
                  {error}
                </div>
              )}

              {!loading &&
                !error &&
                renderPage()}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
