import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  CloudSun,
  Droplets,
  Leaf,
  LocateFixed,
  MapPin,
  Menu,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  UserRound,
  Wind,
  X,
} from "lucide-react";
import CityMap3D from "./CityMap3D.jsx";
import ProfilePage from "./Profile.jsx";
import "./App.css";

const heilbronn = [49.1402, 9.2193];
const defaultUser = [49.1378, 9.2234];
const heilbronnBounds = [
  [49.087, 9.038],
  [49.216, 9.309],
];

function CityBoundary() {
  const [boundary, setBoundary] = useState(null);

  useEffect(() => {
    fetch("/data/heilbronn-boundary.geojson")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load Heilbronn boundary");
        return response.json();
      })
      .then(setBoundary)
      .catch((error) => console.error(error.message));
  }, []);

  if (!boundary) return null;
  return <CityBoundaryOverlay boundary={boundary} />;
}

function CityBoundaryOverlay({ boundary }) {
  const map = useMap();
  const [frame, setFrame] = useState({ width: 0, height: 0, cityPath: "" });

  useEffect(() => {
    const updatePath = () => {
      const size = map.getSize();
      const points = boundary.geometry.coordinates[0].map(
        ([longitude, latitude]) =>
          map.latLngToContainerPoint([latitude, longitude]),
      );
      const area = points.reduce((sum, point, index) => {
        const next = points[(index + 1) % points.length];
        return sum + point.x * next.y - next.x * point.y;
      }, 0);
      // The outside rectangle winds clockwise on screen; wind the city hole counter-clockwise.
      const holePoints = area > 0 ? [...points].reverse() : points;
      const pathFor = (ring) =>
        ring
          .map(
            (point, index) =>
              `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
          )
          .join(" ") + " Z";
      const cityPath = pathFor(points);
      const holePath = pathFor(holePoints);
      setFrame({ width: size.x, height: size.y, cityPath, holePath });
    };

    updatePath();
    map.on("moveend zoomend resize", updatePath);
    return () => map.off("moveend zoomend resize", updatePath);
  }, [boundary, map]);

  if (!frame.width || !frame.height || !frame.cityPath || !frame.holePath)
    return null;

  return (
    <>
      <svg
        className="city-boundary-defs"
        width={frame.width}
        height={frame.height}
        viewBox={`0 0 ${frame.width} ${frame.height}`}
        aria-hidden="true"
      >
        <defs>
          <mask
            id="outside-city-mask"
            x="0"
            y="0"
            width={frame.width}
            height={frame.height}
            maskUnits="userSpaceOnUse"
            style={{ maskType: "luminance" }}
          >
            <rect width={frame.width} height={frame.height} fill="white" />
            <path d={frame.cityPath} fill="black" />
          </mask>
        </defs>
        <path
          d={frame.cityPath}
          fill="none"
          stroke="#ca5745"
          strokeWidth="3.5"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="city-outside-blur" />
    </>
  );
}

const buildingStyle = (feature) => ({
  color: "#285d42",
  weight: 0.7,
  opacity: 0.8,
  fillColor:
    feature.properties.building === "apartments" ||
    feature.properties.building === "commercial"
      ? "#7d9d65"
      : feature.properties.building === "industrial"
        ? "#aaa99d"
        : "#bd745e",
  fillOpacity: 0.95,
  lineJoin: "round",
});

function BuildingFootprints() {
  const [buildings, setBuildings] = useState(null);

  useEffect(() => {
    fetch("/data/heilbronn-buildings.geojson")
      .then((response) => response.json())
      .then(setBuildings)
      .catch((error) =>
        console.error("Could not load building outlines", error),
      );
  }, []);

  return buildings ? (
    <GeoJSON
      data={buildings}
      style={buildingStyle}
      bubblingMouseEvents={false}
    />
  ) : null;
}

const demoSensors = [
  {
    id: 1,
    name: "Neckar riverside",
    type: "air",
    label: "Air quality",
    value: "24 AQI",
    detail: "Very good · PM2.5 4 μg/m³",
    position: [49.1458, 9.2074],
    tone: "mint",
  },
  {
    id: 2,
    name: "Marktplatz",
    type: "air",
    label: "Air quality",
    value: "31 AQI",
    detail: "Good · PM2.5 7 μg/m³",
    position: [49.1402, 9.2193],
    tone: "mint",
  },
  {
    id: 3,
    name: "Hauptbahnhof",
    type: "air",
    label: "Air quality",
    value: "42 AQI",
    detail: "Good · PM2.5 11 μg/m³",
    position: [49.1422, 9.2078],
    tone: "mint",
  },
  {
    id: 4,
    name: "Allee",
    type: "air",
    label: "Air quality",
    value: "47 AQI",
    detail: "Moderate · PM2.5 13 μg/m³",
    position: [49.144, 9.224],
    tone: "mint",
  },
  {
    id: 5,
    name: "Stadtgarten",
    type: "green",
    label: "Tree canopy",
    value: "78%",
    detail: "Canopy coverage · 2.4 ha",
    position: [49.1381, 9.2138],
    tone: "green",
  },
  {
    id: 6,
    name: "Pfühlpark",
    type: "green",
    label: "Tree canopy",
    value: "84%",
    detail: "Canopy coverage · 9.1 ha",
    position: [49.1385, 9.233],
    tone: "green",
  },
  {
    id: 7,
    name: "Alter Friedhof",
    type: "green",
    label: "Tree canopy",
    value: "71%",
    detail: "Canopy coverage · 3.2 ha",
    position: [49.145, 9.2275],
    tone: "green",
  },
  {
    id: 8,
    name: "Wertwiesenpark",
    type: "water",
    label: "Water quality",
    value: "Good",
    detail: "Neckar · 18.4°C",
    position: [49.1326, 9.2137],
    tone: "blue",
  },
  {
    id: 9,
    name: "Neckarbogen",
    type: "water",
    label: "Water quality",
    value: "Excellent",
    detail: "Neckar · 18.1°C · pH 7.6",
    position: [49.1505, 9.205],
    tone: "blue",
  },
  {
    id: 10,
    name: "Alter Neckar",
    type: "water",
    label: "Water quality",
    value: "Fair",
    detail: "Low flow · 19.2°C",
    position: [49.147, 9.203],
    tone: "blue",
  },
  {
    id: 11,
    name: "Sülmerstraße",
    type: "noise",
    label: "Noise level",
    value: "58 dB",
    detail: "Within daily limits",
    position: [49.1451, 9.2184],
    tone: "amber",
  },
  {
    id: 12,
    name: "Weinsberger Straße",
    type: "noise",
    label: "Noise level",
    value: "66 dB",
    detail: "Busy road · above daytime target",
    position: [49.1418, 9.23],
    tone: "amber",
  },
  {
    id: 13,
    name: "Neckar cleanup",
    type: "task",
    label: "Task",
    value: "+50 XP",
    detail: "Collect litter along the riverbank · Sat 10:00",
    position: [49.1437, 9.2112],
    tone: "task",
  },
  {
    id: 14,
    name: "Plant a tree",
    type: "task",
    label: "Task",
    value: "+60 XP",
    detail: "Help plant 12 trees in Stadtgarten · Sun 14:00",
    position: [49.1392, 9.2165],
    tone: "task",
  },
  {
    id: 15,
    name: "Bike counting",
    type: "task",
    label: "Task",
    value: "+30 XP",
    detail: "Count bikes at the station for one hour",
    position: [49.1414, 9.2101],
    tone: "task",
  },
  {
    id: 16,
    name: "Report a broken streetlight",
    type: "task",
    label: "Task",
    value: "+20 XP",
    detail: "Photograph and report it · any time",
    position: [49.1428, 9.2205],
    tone: "task",
  },
  {
    id: 17,
    name: "Neckar water sample",
    type: "task",
    label: "Task",
    value: "+80 XP",
    detail: "Take a sample with a city kit · Wed 17:00",
    position: [49.149, 9.207],
    tone: "task",
  },
  {
    id: 18,
    name: "Bird count in Pfühlpark",
    type: "task",
    label: "Task",
    value: "+40 XP",
    detail: "Count birds for 30 minutes · Sat 08:00",
    position: [49.1378, 9.231],
    tone: "task",
  },
  {
    id: 19,
    name: "Südstadt recycling day",
    type: "task",
    label: "Task",
    value: "+100 XP",
    detail: "Help sort recycling all morning · Sun 09:00",
    position: [49.131, 9.221],
    tone: "task",
  },
];

const filters = [
  { id: "all", label: "All layers" },
  { id: "air", label: "Air quality" },
  { id: "green", label: "Green spaces" },
  { id: "water", label: "Water" },
  { id: "noise", label: "Noise" },
  { id: "task", label: "Tasks" },
];

const environmentFilters = [
  { id: "all", label: "All sensors" },
  { id: "air", label: "Air quality" },
  { id: "temperature", label: "Temperature" },
  { id: "humidity", label: "Humidity" },
  { id: "uv", label: "UV" },
  { id: "wind", label: "Wind" },
  { id: "pollen", label: "Pollen" },
  { id: "task", label: "Tasks" },
];

const legendItems = [
  { id: "air", label: "Air", tone: "mint" },
  { id: "green", label: "Green", tone: "green" },
  { id: "water", label: "Water", tone: "blue" },
  { id: "noise", label: "Noise", tone: "amber" },
  { id: "task", label: "Tasks", tone: "task" },
];

const environmentLegendItems = [
  { id: "air", label: "Air", tone: "mint" },
  { id: "temperature", label: "Temperature", tone: "amber" },
  { id: "humidity", label: "Humidity", tone: "blue" },
  { id: "uv", label: "UV", tone: "task" },
  { id: "wind", label: "Wind", tone: "green" },
  { id: "pollen", label: "Pollen", tone: "amber" },
  { id: "task", label: "Tasks", tone: "task" },
];

const sensorColors = {
  mint: "#62aa7c",
  green: "#85a956",
  blue: "#63a6d2",
  amber: "#dda950",
  task: "#ca826b",
};

const metricDetails = {
  pm2_5: ["Air quality · PM2.5", "air", "mint"],
  pm10: ["Air quality · PM10", "air", "mint"],
  nitrogen_dioxide: ["Air quality · NO₂", "air", "mint"],
  ozone: ["Air quality · Ozone", "air", "mint"],
  european_aqi: ["European air quality index", "air", "mint"],
  temperature: ["Temperature", "temperature", "amber"],
  relative_humidity: ["Humidity", "humidity", "blue"],
  uv_intensity: ["UV intensity", "uv", "task"],
  wind_speed: ["Wind speed", "wind", "green"],
  precipitation: ["Precipitation", "wind", "green"],
  cloud_cover: ["Cloud cover", "wind", "green"],
  alder_pollen: ["Alder pollen", "pollen", "amber"],
  birch_pollen: ["Birch pollen", "pollen", "amber"],
  grass_pollen: ["Grass pollen", "pollen", "amber"],
  mugwort_pollen: ["Mugwort pollen", "pollen", "amber"],
  olive_pollen: ["Olive pollen", "pollen", "amber"],
  ragweed_pollen: ["Ragweed pollen", "pollen", "amber"],
};

function sensorsFromEnvironment(environment) {
  const stations = new Map(
    environment.stations.map((station) => [station.box_id, station]),
  );
  const latestBySensorMetric = new Map();

  for (const evidence of environment.evidence) {
    const details = metricDetails[evidence.metric];
    const coordinates = evidence.geometry?.coordinates;
    if (!details || evidence.value == null || !coordinates || coordinates.length < 2)
      continue;
    if (["historical", "unavailable"].includes(evidence.data_type)) continue;
    if (evidence.quality_flags?.some((flag) =>
      ["indoor", "exposure_unknown", "outside_demo_area", "expired_model"].includes(flag),
    )) continue;

    const stationId = evidence.source.url.match(/\/boxes\/([^/?]+)/)?.[1];
    const station = stations.get(stationId);
    const key = `${stationId ?? evidence.source.name}:${evidence.metric}`;
    const existing = latestBySensorMetric.get(key);
    const observedAt = evidence.observed_at ?? evidence.valid_from ?? evidence.fetched_at;
    if (existing && new Date(existing.observedAt) >= new Date(observedAt)) continue;

    const [label, type, tone] = details;
    latestBySensorMetric.set(key, {
      id: evidence.id,
      name: station?.name || evidence.source.name,
      type,
      label,
      value: `${Number(evidence.value.toFixed(2))} ${evidence.unit}`.trim(),
      detail: `${evidence.data_type === "observation" ? "Observed" : "Model estimate"} · ${new Date(observedAt).toLocaleString()}`,
      position: [coordinates[1], coordinates[0]],
      tone,
      observedAt,
    });
  }

  return [...latestBySensorMetric.values()];
}

function CoordinatesTracker({ onChange }) {
  useMapEvents({
    mousemove(event) {
      onChange(event.latlng);
    },
    click(event) {
      onChange(event.latlng);
    },
  });
  return null;
}

function sensorIcon(tone) {
  return L.divIcon({
    className: "sensor-icon-wrap",
    html: `<span class="sensor-pin sensor-pin--${tone}"><i></i></span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

const currentPage = () => {
  if (window.location.hash === "#profile") return "profile";
  if (window.location.hash === "#marketplace") return "marketplace";
  return "dashboard";
};

function MarketplacePage() {
  return (
    <div className="page-content">
      <section className="page-heading">
        <div>
          <p className="eyebrow page-eyebrow">HEILBRONN REGION</p>
          <h1>Marketplace</h1>
          <p className="heading-subtitle">
            Explore local offers and community listings.
          </p>
        </div>
      </section>
      <section className="marketplace-empty" aria-label="Marketplace listings">
        <span className="marketplace-empty-icon">
          <ShoppingBag size={22} />
        </span>
        <h2>Local marketplace</h2>
        <p>Listings for Heilbronn will appear here.</p>
      </section>
    </div>
  );
}

function MarketplaceIcon() {
  return (
    <svg
      aria-hidden="true"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.4" />
      <rect x="14" y="3" width="7" height="7" rx="1.4" />
      <rect x="3" y="14" width="7" height="7" rx="1.4" />
      <rect x="14" y="14" width="7" height="7" rx="1.4" />
    </svg>
  );
}

function App() {
  const [page, setPage] = useState(currentPage);
  const [activeFilter, setActiveFilter] = useState("all");
  const [environmentSensors, setEnvironmentSensors] = useState(null);
  const [environmentStatus, setEnvironmentStatus] = useState("loading");
  const [coordinates, setCoordinates] = useState(heilbronn);
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [is3D, setIs3D] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const loadEnvironment = async () => {
      try {
        const requestEnvironment = () =>
          fetch("/api/v1/moment/environment", { credentials: "include" });
        let response = await requestEnvironment();
        if (response.status === 401) {
          const sessionResponse = await fetch("/api/v1/session", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ language: "en" }),
          });
          if (!sessionResponse.ok)
            throw new Error("Could not create a data session");
          response = await requestEnvironment();
        }
        if (!response.ok) throw new Error("Environment API is unavailable");
        const payload = await response.json();
        const liveSensors = sensorsFromEnvironment(payload.data);
        if (!cancelled) {
          setEnvironmentSensors(liveSensors);
          setEnvironmentStatus("connected");
        }
      } catch (error) {
        if (!cancelled) {
          setEnvironmentStatus("demo");
          console.info("Showing demo map data:", error.message);
        }
      }
    };
    loadEnvironment();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const next = currentPage();
      setPage((previous) => {
        if (previous !== next) window.scrollTo(0, 0);
        return next;
      });
      setMobileMenuOpen(false);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const liveMode = environmentStatus === "connected";
  const mapSensors = liveMode
    ? [...environmentSensors, ...demoSensors.filter((sensor) => sensor.type === "task")]
    : demoSensors;
  const mapFilters = liveMode ? environmentFilters : filters;
  const mapLegendItems = liveMode ? environmentLegendItems : legendItems;
  const visibleSensors = useMemo(
    () =>
      mapSensors.filter((sensor) => {
        const matchesFilter =
          activeFilter === "all" || sensor.type === activeFilter;
        const matchesSearch = `${sensor.name} ${sensor.label}`
          .toLowerCase()
          .includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
      }),
    [activeFilter, search, mapSensors],
  );

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? "sidebar--open" : ""}`}>
        <a className="brand" href="#overview" aria-label="Heil G home">
          <span className="brand-mark">
            <Leaf size={19} strokeWidth={2.2} />
          </span>
          <span>
            Heil <span className="brand-light">G</span>
            <small>CITY DASHBOARD</small>
          </span>
        </a>
        <div className="sidebar-city">
          <span className="eyebrow">YOUR CITY</span>
          <button type="button" className="city-select">
            Heilbronn, DE <ChevronDown size={15} />
          </button>
        </div>
        <nav className="side-nav" aria-label="Main navigation">
          <span className="eyebrow nav-heading">WORKSPACE</span>
          <a
            className={`nav-item ${page === "dashboard" ? "nav-item--active" : ""}`}
            href="#overview"
          >
            <Activity size={17} /> Overview
            {page === "dashboard" && <span className="nav-dot" />}
          </a>
          <a
            className={`nav-item ${page === "marketplace" ? "nav-item--active" : ""}`}
            href="#marketplace"
          >
            <MarketplaceIcon /> Marketplace
          </a>
          <a className="nav-item" href="#map">
            <MapPin size={17} /> Live map
          </a>
          <a className="nav-item" href="#insights">
            <Leaf size={17} /> City insights
          </a>
          <a className="nav-item" href="#alerts">
            <Bell size={17} /> Alerts <span className="alert-count">3</span>
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-weather">
            <div className="weather-icon">
              <CloudSun size={21} />
            </div>
            <div>
              <strong>18°</strong>
              <span>Partly cloudy</span>
            </div>
            <span className="weather-location">HEILBRONN</span>
          </div>
          <div className="profile">
            <div className="avatar">AK</div>
            <div className="profile-copy">
              <strong>Alex Kim</strong>
              <span>City analyst</span>
            </div>
            <ChevronDown size={16} />
          </div>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <button
            type="button"
            className="mobile-menu"
            aria-label="Toggle navigation"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="breadcrumb">
            Workspace <span>/</span>{" "}
            <strong>
              {page === "profile"
                ? "Profile"
                : page === "marketplace"
                  ? "Marketplace"
                  : "Overview"}
            </strong>
          </div>
          <div className="topbar-actions">
            <span className="sync-status">
              <i /> SAMPLE DATA
            </span>
            <button
              type="button"
              className="icon-button"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <i />
            </button>
            <a
              className="top-avatar"
              href="#profile"
              aria-label="Open user profile"
            >
              <UserRound size={18} />
            </a>
          </div>
        </header>

        {page === "profile" ? (
          <ProfilePage />
        ) : page === "marketplace" ? (
          <MarketplacePage />
        ) : (
          <div className="page-content">
            <section className="page-heading">
              <div>
                <p className="eyebrow page-eyebrow">
                  TUESDAY, 27 OCTOBER 2026 <span>·</span> HEILBRONN REGION
                </p>
                <h1>
                  Good morning, Alex <span>✳</span>
                </h1>
                <p className="heading-subtitle">
                  Here’s what’s happening across your city today.
                </p>
              </div>
              <button type="button" className="date-button">
                <span className="date-icon">27</span>
                <span>
                  Today <small>October 2026</small>
                </span>
                <ChevronDown size={15} />
              </button>
            </section>

            <section className="metric-grid" aria-label="City indicators">
              <article className="metric-card">
                <div className="metric-top">
                  <span>Air quality</span>
                  <span className="metric-icon icon-mint">
                    <Wind size={17} />
                  </span>
                </div>
                <div className="metric-value">
                  28 <span>AQI</span>
                </div>
                <div className="metric-foot">
                  <span className="status-pill status-good">
                    <i /> Good
                  </span>
                  <span className="metric-trend">
                    <ArrowDownRight size={14} /> 8% <small>vs. yesterday</small>
                  </span>
                </div>
                <div className="sparkline sparkline--mint">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </article>
              <article className="metric-card">
                <div className="metric-top">
                  <span>Urban greenery</span>
                  <span className="metric-icon icon-green">
                    <Leaf size={17} />
                  </span>
                </div>
                <div className="metric-value">
                  64.8<span>%</span>
                </div>
                <div className="metric-foot">
                  <span className="metric-trend trend-up">
                    <ArrowUpRight size={14} /> 2.4% <small>this month</small>
                  </span>
                  <span className="metric-note">+12 new trees</span>
                </div>
                <div className="sparkline sparkline--green">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </article>
              <article className="metric-card">
                <div className="metric-top">
                  <span>Water quality</span>
                  <span className="metric-icon icon-blue">
                    <Droplets size={17} />
                  </span>
                </div>
                <div className="metric-value metric-word">Excellent</div>
                <div className="metric-foot">
                  <span className="status-pill status-blue">
                    <i /> Neckar river
                  </span>
                  <span className="metric-note">
                    18.4°C <small>· normal</small>
                  </span>
                </div>
                <div className="sparkline sparkline--blue">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </article>
              <article className="metric-card">
                <div className="metric-top">
                  <span>Active sensors</span>
                  <span className="metric-icon icon-amber">
                    <Activity size={17} />
                  </span>
                </div>
                <div className="metric-value">
                  142 <span>/ 148</span>
                </div>
                <div className="metric-foot">
                  <span className="metric-trend trend-up">
                    <span className="online-dot" /> 96% <small>uptime</small>
                  </span>
                  <span className="metric-note">6 need attention</span>
                </div>
                <div className="sensor-progress">
                  <span />
                </div>
              </article>
            </section>

            <section className="map-section" id="map">
              <div className="section-heading">
                <div>
                  <div className="section-title-line">
                    <h2>City overview</h2>
                    <span className="live-badge">
                      <i /> {environmentStatus === "loading" ? "CONNECTING" : liveMode ? "LIVE DATA" : "DEMO DATA"}
                    </span>
                  </div>
                  <p>Explore the Heilbronn city boundary</p>
                </div>
                <button
                  type="button"
                  className="filter-button"
                  onClick={() =>
                    document.querySelector(".map-filter-bar")?.scrollIntoView({
                      behavior: "smooth",
                      block: "nearest",
                    })
                  }
                >
                  <SlidersHorizontal size={15} /> Filters
                </button>
              </div>
              <div className="map-card">
                <div className="map-world-badge">
                  <span className="map-world-icon">
                    <Leaf size={14} />
                  </span>
                  <span>
                    <strong>HEILBRONN</strong>
                    <small>CITY LIMITS</small>
                  </span>
                  <i />
                </div>
                <div className="map-filter-bar">
                  {mapFilters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      className={`map-filter ${activeFilter === filter.id ? "map-filter--active" : ""}`}
                      onClick={() => setActiveFilter(filter.id)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                <div className="map-search">
                  <Search size={16} />
                  <input
                    aria-label="Search map"
                    placeholder="Find a place or sensor..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <kbd>⌘ K</kbd>
                </div>
                {is3D ? (
                  <CityMap3D
                    ref={mapRef}
                    sensors={visibleSensors}
                    user={defaultUser}
                    bounds={heilbronnBounds}
                    onSelect={setSelectedSensor}
                    onCoordinates={(lngLat) =>
                      setCoordinates([lngLat.lat, lngLat.lng])
                    }
                  />
                ) : (
                  <MapContainer
                    ref={mapRef}
                    center={[49.1514, 9.1733]}
                    zoom={11}
                    minZoom={10}
                    maxZoom={17}
                    maxBounds={heilbronnBounds}
                    maxBoundsViscosity={1}
                    scrollWheelZoom
                    className="leaflet-map"
                    zoomControl={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      maxZoom={20}
                    />
                    <CoordinatesTracker
                      onChange={(latlng) =>
                        setCoordinates([latlng.lat, latlng.lng])
                      }
                    />
                    <CityBoundary />
                    <BuildingFootprints />
                    <Marker
                      position={defaultUser}
                      icon={L.divIcon({
                        className: "user-marker-wrap",
                        html: '<span class="user-marker"><i></i></span>',
                        iconSize: [24, 24],
                        iconAnchor: [12, 12],
                      })}
                    >
                      <Tooltip direction="top" offset={[0, -9]}>
                        You are here · sample location
                      </Tooltip>
                    </Marker>
                    {visibleSensors.map((sensor) => (
                      <CircleMarker
                        key={sensor.id}
                        center={sensor.position}
                        radius={11}
                        pathOptions={{
                          color: sensorColors[sensor.tone] ?? "#62aa7c",
                          fillColor: sensorColors[sensor.tone] ?? "#62aa7c",
                          fillOpacity: 0.32,
                          weight: 2,
                        }}
                        eventHandlers={{
                          click: () => setSelectedSensor(sensor),
                        }}
                      >
                        <Marker
                          position={sensor.position}
                          icon={sensorIcon(sensor.tone)}
                          eventHandlers={{
                            click: () => setSelectedSensor(sensor),
                          }}
                        >
                          <Tooltip
                            direction="top"
                            offset={[0, -12]}
                            className="sensor-tooltip"
                          >
                            <strong>{sensor.name}</strong>
                            <br />
                            {sensor.label}:{" "}
                            <span
                              className={
                                sensor.type === "task"
                                  ? "tooltip-xp"
                                  : undefined
                              }
                            >
                              {sensor.value}
                            </span>
                            <br />
                            <small>{sensor.detail}</small>
                          </Tooltip>
                        </Marker>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                )}
                {is3D && (
                  <div className="map-3d-hint">
                    Right-drag or Ctrl + drag to tilt and rotate
                  </div>
                )}
                {selectedSensor && (
                  <div className="sensor-detail">
                    <button
                      type="button"
                      aria-label="Close sensor details"
                      onClick={() => setSelectedSensor(null)}
                    >
                      <X size={15} />
                    </button>
                    <span
                      className={`detail-dot detail-dot--${selectedSensor.tone}`}
                    />
                    <div>
                      <strong>{selectedSensor.name}</strong>
                      <small>
                        {selectedSensor.label} · {selectedSensor.value}
                      </small>
                      <small>{selectedSensor.detail}</small>
                    </div>
                  </div>
                )}
                <div className="map-controls">
                  <button
                    type="button"
                    className="map-3d-toggle"
                    aria-pressed={is3D}
                    aria-label={is3D ? "Switch to 2D map" : "Switch to 3D map"}
                    onClick={() => setIs3D(!is3D)}
                  >
                    {is3D ? "2D" : "3D"}
                  </button>
                  <span />
                  <button
                    type="button"
                    aria-label="Show my location"
                    onClick={() => {
                      mapRef.current?.setView(defaultUser, 15);
                      setCoordinates(defaultUser);
                    }}
                  >
                    <LocateFixed size={17} />
                  </button>
                  <span />
                  <button
                    type="button"
                    aria-label="Zoom in"
                    onClick={() => mapRef.current?.zoomIn()}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    aria-label="Zoom out"
                    onClick={() => mapRef.current?.zoomOut()}
                  >
                    −
                  </button>
                </div>
                <div className="map-legend">
                  {mapLegendItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`legend-item ${activeFilter === item.id ? "legend-item--active" : ""}`}
                      aria-pressed={activeFilter === item.id}
                      onClick={() =>
                        setActiveFilter(
                          activeFilter === item.id ? "all" : item.id,
                        )
                      }
                    >
                      <i className={`legend-dot legend-dot--${item.tone}`} />{" "}
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="map-coordinates">
                  <MapPin size={12} /> {coordinates[0].toFixed(5)}° N,{" "}
                  {coordinates[1].toFixed(5)}° E
                </div>
                <div className="map-attribution">
                  <a
                    href="https://www.openstreetmap.org/copyright"
                    target="_blank"
                    rel="noreferrer"
                  >
                    © OpenStreetMap contributors
                  </a>
                </div>
              </div>
              <div className="map-caption">
                <span>
                  <i /> {visibleSensors.length} sensors visible
                </span>
                <span>Outside the red line is beyond the city limits</span>
              </div>
            </section>

            <section className="bottom-grid" id="insights">
              <article className="insight-card">
                <div className="section-heading compact-heading">
                  <div>
                    <h2>City pulse</h2>
                    <p>Community & environment</p>
                  </div>
                  <button type="button" className="more-button">
                    •••
                  </button>
                </div>
                <div className="pulse-row">
                  <span className="pulse-icon">
                    <Leaf size={16} />
                  </span>
                  <div>
                    <strong>Green cover is growing</strong>
                    <small>12 trees planted near Neckarbogen</small>
                  </div>
                  <span className="pulse-time">12m</span>
                </div>
                <div className="pulse-row">
                  <span className="pulse-icon pulse-icon--blue">
                    <Droplets size={16} />
                  </span>
                  <div>
                    <strong>Neckar quality looks great</strong>
                    <small>All readings within healthy range</small>
                  </div>
                  <span className="pulse-time">48m</span>
                </div>
              </article>
              <article className="insight-card activity-card" id="alerts">
                <div className="section-heading compact-heading">
                  <div>
                    <h2>Air quality trend</h2>
                    <p>Average AQI · last 7 days</p>
                  </div>
                  <button type="button" className="period-select">
                    7 days <ChevronDown size={13} />
                  </button>
                </div>
                <div className="chart">
                  <div className="chart-guides">
                    <span>50</span>
                    <span>35</span>
                    <span>20</span>
                  </div>
                  <div className="chart-plot">
                    <div className="chart-gridline chart-gridline--one" />
                    <div className="chart-gridline chart-gridline--two" />
                    <div className="chart-gridline chart-gridline--three" />
                    <svg
                      viewBox="0 0 420 110"
                      preserveAspectRatio="none"
                      aria-label="Air quality trend chart"
                    >
                      <defs>
                        <linearGradient
                          id="chartFill"
                          x1="0"
                          x2="0"
                          y1="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#55a985"
                            stopOpacity=".2"
                          />
                          <stop
                            offset="100%"
                            stopColor="#55a985"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0 50 C28 44 31 30 63 38 S104 68 126 57 S166 38 188 48 S224 62 250 42 S285 36 311 44 S340 31 359 39 S394 49 420 24 L420 110 L0 110Z"
                        fill="url(#chartFill)"
                      />
                      <path
                        d="M0 50 C28 44 31 30 63 38 S104 68 126 57 S166 38 188 48 S224 62 250 42 S285 36 311 44 S340 31 359 39 S394 49 420 24"
                        fill="none"
                        stroke="#55a985"
                        strokeWidth="2.5"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                    <div className="chart-labels">
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span>Sun</span>
                      <span>Mon</span>
                      <span>Tue</span>
                    </div>
                  </div>
                </div>
              </article>
            </section>
            <footer className="page-footer">
              <span>
                GREEN CITY <i>·</i> HEILBRONN
              </span>
              <span>Last updated just now</span>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
