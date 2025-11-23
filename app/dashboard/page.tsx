// app/dashboard/page.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl, { Map, Marker } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useProjects } from "@/app/context/ProjectsContext";
import { createSiteApi } from "@/app/sites/_lib/siteApi";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type PpdRow = {
  transaction_id: string;
  price: number;
  date: string;
  postcode: string;
  property_type: string | null;
  new_build: string | null;
  tenure: string | null;
  paon: string | null;
  saon: string | null;
  street: string | null;
  locality: string | null;
  town: string | null;
};

type PpdStatus = "idle" | "loading" | "ok" | "no-results" | "error";

type GeocodeFeature = {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
};

type DrawMode = "select" | "line" | "polygon";

const fontFamily =
  "-apple-system, BlinkMacSystemFont, system-ui, 'SF Pro Text', sans-serif";

function formatPropertyType(code: string | null): string {
  if (!code) return "";
  const map: Record<string, string> = {
    D: "detached house",
    S: "semi-detached house",
    T: "terraced house",
    F: "flat or maisonette",
    O: "other property",
  };
  return map[code] ?? code.toLowerCase();
}

function formatTenure(code: string | null): string {
  if (!code) return "";
  if (code === "F") return "Freehold";
  if (code === "L") return "Leasehold";
  return code;
}

/* ---------------- Account dropdown INSIDE the top nav ---------------- */
const AccountInNav: React.FC = () => {
  return (
    <details style={{ position: "relative" }}>
      <summary
        style={{
          listStyle: "none",
          cursor: "pointer",
          padding: "6px 14px",
          borderRadius: 999,
          border: "1px solid rgba(148,163,184,0.24)",
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(15,23,42,0.9))",
          color: "white",
          fontSize: 12.5,
          fontWeight: 600,
          boxShadow: "0 10px 22px rgba(15,23,42,0.7)",
          marginLeft: 8,
        }}
      >
        Account
      </summary>
      <div
        style={{
          position: "absolute",
          right: 0,
          top: "calc(100% + 8px)",
          minWidth: 190,
          background: "rgba(15,23,42,0.98)",
          border: "1px solid rgba(148,163,184,0.24)",
          borderRadius: 12,
          padding: 6,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 45px rgba(15,23,42,0.9)",
          zIndex: 100,
        }}
      >
        {/* Adjust these links when auth is wired */}
        <a href="/dashboard" style={menuItemStyle}>
          Dashboard
        </a>
        <a href="/clients" style={menuItemStyle}>
          Clients
        </a>
        <hr
          style={{
            border: "none",
            height: 1,
            background: "rgba(148,163,184,0.2)",
            margin: "6px 0",
          }}
        />
        <a href="/login" style={menuItemStyle}>
          Log in
        </a>
        <a href="/signup" style={menuItemStyle}>
          Sign up
        </a>
      </div>
    </details>
  );
};

const menuItemStyle: React.CSSProperties = {
  display: "block",
  padding: "10px 12px",
  borderRadius: 10,
  color: "white",
  textDecoration: "none",
  fontSize: 13,
  background: "transparent",
};

/* ---------------- Top-left nav (now includes Account) ---------------- */
const TopNav: React.FC = () => {
  const pathname = usePathname();

  const tabs = [
    { href: "/dashboard", label: "Explore" },
    { href: "/projects", label: "My Sites" },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/clients", label: "My Clients" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        left: 16,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: 4,
          borderRadius: 999,
          background: "rgba(15,23,42,0.94)",
          border: "1px solid rgba(30,64,175,0.6)",
          boxShadow: "0 12px 25px rgba(15,23,42,0.7)",
        }}
      >
        {tabs.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href === "/dashboard" && pathname === "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: 500,
                textDecoration: "none",
                background: active
                  ? "linear-gradient(135deg,#2563eb,#1d4ed8)"
                  : "transparent",
                color: active ? "white" : "rgba(226,232,240,0.9)",
                border: active
                  ? "1px solid rgba(191,219,254,0.9)"
                  : "1px solid transparent",
                boxShadow: active ? "0 10px 20px rgba(37,99,235,0.45)" : "none",
                transition:
                  "background 140ms ease, color 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
              }}
            >
              {tab.label}
            </Link>
          );
        })}

        {/* Account button integrated here */}
        <AccountInNav />
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);

  const [lng, setLng] = useState(-0.13425);
  const [lat, setLat] = useState(50.85452);
  const [zoom, setZoom] = useState(16);

  // PPD + selection
  const [ppdEnabled, setPpdEnabled] = useState(true);
  const [ppdStatus, setPpdStatus] = useState<PpdStatus>("idle");
  const [ppdSales, setPpdSales] = useState<PpdRow[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [ppdCollapsed, setPpdCollapsed] = useState(true);

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeFeature[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Draw tools
  const [drawMode, setDrawMode] = useState<DrawMode>("select");
  const drawModeRef = useRef<DrawMode>("select");
  const drawPointsRef = useRef<[number, number][]>([]);
  const DRAW_SOURCE_ID = "lh-draw-source";
  const DRAW_LAYER_ID = "lh-draw-layer";

  const { addSite } = useProjects(); // optional local context
  const router = useRouter();

  const font = fontFamily;

  useEffect(() => {
    drawModeRef.current = drawMode;
  }, [drawMode]);

  // ---------- REVERSE GEOCODING ----------
  async function reverseGeocode(latVal: number, lngVal: number) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngVal},${latVal}.json?access_token=${mapboxgl.accessToken}&limit=1&types=address&country=gb`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error("Reverse geocode failed", await res.text());
        setSelectedAddress(null);
        return;
      }
      const data = await res.json();
      const feature = data.features?.[0];
      if (feature?.place_name) {
        setSelectedAddress(feature.place_name as string);
      } else {
        setSelectedAddress(null);
      }
    } catch (err) {
      console.error("Reverse geocode threw", err);
      setSelectedAddress(null);
    }
  }

  // ---------- PPD API ----------
  async function loadNearbyPpd(pLat: number, pLng: number) {
    setPpdStatus("loading");
    setPpdSales([]);

    try {
      const params = new URLSearchParams({
        lat: String(pLat),
        lng: String(pLng),
        radius_m: "200",
        limit: "8",
      });

      const res = await fetch(`/api/ppd/near?${params.toString()}`);

      if (!res.ok) {
        console.error("PPD near fetch failed", await res.text());
        setPpdStatus("error");
        return;
      }

      const json = await res.json();
      const sales: PpdRow[] = Array.isArray(json)
        ? json
        : Array.isArray(json.data)
        ? json.data
        : [];

      if (sales.length === 0) {
        setPpdStatus("no-results");
        setPpdSales([]);
      } else {
        setPpdStatus("ok");
        setPpdSales(sales);
      }
    } catch (err) {
      console.error("PPD near fetch threw", err);
      setPpdStatus("error");
    }
  }

  // ---------- DRAW HELPERS ----------
  const updateDrawLayer = (map: Map) => {
    const points = drawPointsRef.current;
    if (!points.length) {
      if (map.getSource(DRAW_SOURCE_ID)) {
        map.removeLayer(DRAW_LAYER_ID);
        map.removeSource(DRAW_SOURCE_ID);
      }
      return;
    }

    const isPolygon = drawModeRef.current === "polygon";
    const coords = points.map((p) => [...p, 0]) as [number, number, number][];

    const geometry = isPolygon
      ? {
          type: "Polygon" as const,
          coordinates: [[...coords, coords[0]]],
        }
      : {
          type: "LineString" as const,
          coordinates: coords,
        };

    const data = {
      type: "Feature",
      geometry,
      properties: {},
    };

    if (!map.getSource(DRAW_SOURCE_ID)) {
      map.addSource(DRAW_SOURCE_ID, {
        type: "geojson",
        data,
      });

      map.addLayer({
        id: DRAW_LAYER_ID,
        type: isPolygon ? "fill" : "line",
        source: DRAW_SOURCE_ID,
        paint: isPolygon
          ? {
              "fill-color": "#2563eb",
              "fill-opacity": 0.18,
              "fill-outline-color": "#60a5fa",
            }
          : {
              "line-color": "#2563eb",
              "line-width": 3,
            },
      });
    } else {
      const src = map.getSource(DRAW_SOURCE_ID) as mapboxgl.GeoJSONSource;
      src.setData(data as any);
      if (map.getLayer(DRAW_LAYER_ID)) {
        map.setLayerZoomRange(DRAW_LAYER_ID, 0, 24);
      }
    }
  };

  const clearDrawShape = () => {
    drawPointsRef.current = [];
    const map = mapRef.current;
    if (map) {
      if (map.getLayer(DRAW_LAYER_ID)) {
        map.removeLayer(DRAW_LAYER_ID);
      }
      if (map.getSource(DRAW_SOURCE_ID)) {
        map.removeSource(DRAW_SOURCE_ID);
      }
    }
  };

  // ---------- MAP INIT ----------
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom,
    });

    mapRef.current = map;

    map.on("move", () => {
      const c = map.getCenter();
      setLng(c.lng);
      setLat(c.lat);
      setZoom(map.getZoom());
    });

    map.on("click", (e) => {
      const { lng: clickLng, lat: clickLat } = e.lngLat;
      const mode = drawModeRef.current;

      // When drawing, do NOT select a property
      if (mode === "line" || mode === "polygon") {
        drawPointsRef.current = [
          ...drawPointsRef.current,
          [clickLng, clickLat],
        ];
        updateDrawLayer(map);
        return;
      }

      // Select mode
      setLng(clickLng);
      setLat(clickLat);

      if (markerRef.current) {
        markerRef.current.setLngLat([clickLng, clickLat]);
      } else {
        markerRef.current = new mapboxgl.Marker({ color: "#2563eb" })
          .setLngLat([clickLng, clickLat])
          .addTo(map);
      }

      const label = `${clickLng.toFixed(5)}, ${clickLat.toFixed(
        5
      )} (click-to-select)`;
      setSelectedLabel(label);
      setPpdCollapsed(true); // collapsed by default on new selection

      void reverseGeocode(clickLat, clickLng);
      if (ppdEnabled) {
        void loadNearbyPpd(clickLat, clickLng);
      }
    });

    // optional: initial address for default centre
    void reverseGeocode(lat, lng);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refetch when toggling PPD ON (if we already have a selected point)
  useEffect(() => {
    if (!ppdEnabled) {
      setPpdStatus("idle");
      setPpdSales([]);
      return;
    }
    if (lat && lng && mapRef.current && (selectedLabel || selectedAddress)) {
      void loadNearbyPpd(lat, lng);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ppdEnabled]);

  // ---------- SEARCH AUTOCOMPLETE (UK only) ----------
  useEffect(() => {
    if (!searchInput || searchInput.length < 3) {
      setSearchResults([]);
      return;
    }

    const controller = new AbortController();

    const fetchSearch = async () => {
      try {
        setSearchLoading(true);
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchInput
        )}.json?access_token=${
          mapboxgl.accessToken
        }&autocomplete=true&country=gb&limit=5`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          console.error("Search geocode failed", await res.text());
          setSearchResults([]);
          setSearchLoading(false);
          return;
        }
        const data = await res.json();
        const feats: GeocodeFeature[] =
          data.features?.map((f: any) => ({
            id: f.id,
            place_name: f.place_name,
            center: f.center,
          })) ?? [];
        setSearchResults(feats);
        setSearchLoading(false);
      } catch (err) {
        if ((err as any).name !== "AbortError") {
          console.error("Search geocode error", err);
        }
        setSearchLoading(false);
      }
    };

    fetchSearch();

    return () => controller.abort();
  }, [searchInput]);

  const handleSearchSelect = (feature: GeocodeFeature | null) => {
    if (!feature || !mapRef.current) return;

    const [flng, flat] = feature.center;
    mapRef.current.flyTo({ center: feature.center, zoom: 16 });

    setLng(flng);
    setLat(flat);

    if (markerRef.current) {
      markerRef.current.setLngLat(feature.center);
    } else {
      markerRef.current = new mapboxgl.Marker({ color: "#2563eb" })
        .setLngLat(feature.center)
        .addTo(mapRef.current);
    }

    setSelectedAddress(feature.place_name);
    const label = `${flng.toFixed(5)}, ${flat.toFixed(5)} (click-to-select)`;
    setSelectedLabel(label);
    setPpdCollapsed(true); // collapsed by default when coming from search
    setSearchOpen(false);

    if (ppdEnabled) {
      void loadNearbyPpd(flat, flng);
    }
  };

  const handleSearchGo = () => {
    if (searchResults[0]) {
      handleSearchSelect(searchResults[0]);
    }
  };

  // ---------- SAVE TO MY SITES ----------
  const handleSaveToProjects = async () => {
    if (!selectedAddress) return;

    try {
      // keep existing context behaviour (optional, for local UI)
      addSite({
        id: `${Date.now()}`,
        address: selectedAddress,
        lat,
        lng,
      });

      // create server-side Site
      const created = await createSiteApi({
        name: selectedAddress,
        address: selectedAddress,
        locationNotes: selectedLabel ?? undefined,
        status: "target",
        tags: [],
        clientIds: [],
      });

      if (created && (created as any).id) {
        router.push(`/sites/${(created as any).id}`);
      } else {
        console.warn("createSiteApi did not return an id", created);
        alert("Site saved, but could not open its dashboard automatically.");
      }
    } catch (e) {
      console.error("addSite / createSiteApi failed", e);
      alert("Sorry, something went wrong saving this site.");
    }
  };

  const hasSelection = !!(selectedAddress || selectedLabel);

  // ---------- RENDER ----------
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {/* MAP */}
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

      {/* TOP NAV with Account in it */}
      <TopNav />

      {/* LEFT SEARCH PANEL */}
      <div
        style={{
          position: "fixed",
          top: 72,
          left: 18,
          width: 350,
          borderRadius: 18,
          padding: 18,
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(15,23,42,0.9))",
          color: "white",
          boxShadow: "0 20px 45px rgba(15,23,42,0.9)",
          backdropFilter: "blur(18px)",
          zIndex: 20,
          fontFamily: font,
          border: "1px solid rgba(148,163,184,0.24)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 650 }}>Search properties</div>
          <div style={{ fontSize: 11, opacity: 0.65, marginTop: 2 }}>
            Type a UK address or click the map to explore parcels &amp; sales.
          </div>
        </div>

        {/* Search bar with autocomplete */}
        <div style={{ position: "relative", marginBottom: 4 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderRadius: 999,
              padding: "6px 6px 6px 10px",
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(51,65,85,0.85)",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 14, opacity: 0.8 }}>🔍</span>
            <input
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search a UK address or postcode…"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                color: "white",
                fontSize: 13.5,
              }}
            />
            <button
              type="button"
              onClick={handleSearchGo}
              disabled={!searchResults[0]}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                background: searchResults[0]
                  ? "linear-gradient(135deg,#2563eb,#1d4ed8)"
                  : "rgba(30,64,175,0.5)",
                color: "white",
                boxShadow: searchResults[0]
                  ? "0 10px 20px rgba(37,99,235,0.55)"
                  : "none",
              }}
            >
              Go
            </button>
          </div>

          {searchOpen && (searchResults.length > 0 || searchLoading) && (
            <div
              style={{
                position: "absolute",
                top: 40,
                left: 0,
                right: 0,
                borderRadius: 12,
                background: "rgba(15,23,42,0.98)",
                border: "1px solid rgba(51,65,85,0.9)",
                boxShadow: "0 16px 40px rgba(15,23,42,0.9)",
                maxHeight: 220,
                overflowY: "auto",
                zIndex: 25,
              }}
            >
              {searchLoading && (
                <div style={{ padding: 10, fontSize: 12, opacity: 0.8 }}>
                  Searching UK addresses…
                </div>
              )}
              {!searchLoading &&
                searchResults.map((feat) => (
                  <button
                    key={feat.id}
                    type="button"
                    onClick={() => handleSearchSelect(feat)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      border: "none",
                      background: "transparent",
                      color: "white",
                      fontSize: 12.5,
                      cursor: "pointer",
                    }}
                  >
                    {feat.place_name}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR – only when we have a selection */}
      {hasSelection && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            height: "100vh",
            width: 380,
            background:
              "radial-gradient(circle at top, #020617 0, #020617 55%, #020617 100%)",
            color: "white",
            display: "flex",
            flexDirection: "column",
            boxShadow: "-18px 0 40px rgba(15,23,42,0.85)",
            zIndex: 15,
            fontFamily: font,
            borderLeft: "1px solid rgba(30,64,175,0.5)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 18px 12px 18px",
              borderBottom: "1px solid rgba(30,64,175,0.65)",
              background:
                "linear-gradient(120deg, rgba(15,23,42,1), rgba(17,24,39,0.98))",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 11,
                    opacity: 0.7,
                    textTransform: "uppercase",
                    letterSpacing: 0.08,
                  }}
                >
                  Selected location
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    marginTop: 2,
                    lineHeight: 1.35,
                  }}
                >
                  {selectedAddress ?? selectedLabel}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  alignItems: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={handleSaveToProjects}
                  style={{
                    fontSize: 11,
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(34,197,94,0.7)",
                    background:
                      "linear-gradient(135deg,rgba(22,163,74,0.95),rgba(22,163,74,0.9))",
                    color: "white",
                    cursor: "pointer",
                    boxShadow: "0 10px 20px rgba(22,163,74,0.55)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Add to My Sites
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLabel(null);
                    setSelectedAddress(null);
                  }}
                  style={{
                    fontSize: 12,
                    width: 26,
                    height: 26,
                    borderRadius: "999px",
                    border: "1px solid rgba(51,65,85,0.9)",
                    background: "rgba(15,23,42,0.95)",
                    color: "rgba(248,250,252,0.9)",
                    cursor: "pointer",
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* PPD card */}
            <section
              style={{
                borderRadius: 16,
                border: "1px solid rgba(30,64,175,0.7)",
                padding: 12,
                background:
                  "radial-gradient(circle at top left, #020617 0, #020617 40%, #030712 100%)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 2,
                    }}
                  >
                    Nearby sale prices
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      opacity: 0.7,
                    }}
                  >
                    Within ~200m of the selected point.
                  </div>
                </div>

                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    opacity: 0.85,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={ppdEnabled}
                    onChange={(e) => setPpdEnabled(e.target.checked)}
                    style={{ cursor: "pointer" }}
                  />
                  <span>Show PPD</span>
                </label>
              </div>

              <button
                type="button"
                onClick={() => setPpdCollapsed((c) => !c)}
                style={{
                  marginTop: 8,
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                  fontSize: 11,
                  opacity: 0.8,
                }}
              >
                {ppdCollapsed ? "Show sale history ▾" : "Hide sale history ▴"}
              </button>

              {!ppdCollapsed && (
                <div
                  style={{
                    marginTop: 8,
                    borderRadius: 12,
                    border: "1px solid rgba(51,65,85,0.9)",
                    background: "rgba(15,23,42,0.95)",
                    maxHeight: 220,
                    overflowY: "auto",
                  }}
                >
                  {ppdStatus === "idle" && (
                    <div
                      style={{
                        padding: 10,
                        fontSize: 12,
                        opacity: 0.8,
                      }}
                    >
                      Enable PPD and select a point to view sale prices.
                    </div>
                  )}
                  {ppdStatus === "loading" && (
                    <div
                      style={{
                        padding: 10,
                        fontSize: 12,
                        opacity: 0.8,
                      }}
                    >
                      Loading recent sales…
                    </div>
                  )}
                  {ppdStatus === "error" && (
                    <div
                      style={{
                        padding: 10,
                        fontSize: 12,
                        opacity: 0.8,
                        color: "#fecaca",
                      }}
                    >
                      Couldn&apos;t load sales data. Try again in a moment.
                    </div>
                  )}
                  {ppdStatus === "no-results" && (
                    <div
                      style={{
                        padding: 10,
                        fontSize: 12,
                        opacity: 0.8,
                      }}
                    >
                      No sales found within 200m.
                    </div>
                  )}
                  {ppdStatus === "ok" && ppdSales.length > 0 && (
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 11.5,
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              textAlign: "left",
                              padding: "6px 8px",
                              borderBottom:
                                "1px solid rgba(51,65,85,0.9)",
                              fontWeight: 500,
                            }}
                          >
                            Address
                          </th>
                          <th
                            style={{
                              textAlign: "right",
                              padding: "6px 8px",
                              borderBottom:
                                "1px solid rgba(51,65,85,0.9)",
                              fontWeight: 500,
                            }}
                          >
                            Price
                          </th>
                          <th
                            style={{
                              textAlign: "right",
                              padding: "6px 8px",
                              borderBottom:
                                "1px solid rgba(51,65,85,0.9)",
                              fontWeight: 500,
                            }}
                          >
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {ppdSales.map((sale) => {
                          const addr = [
                            sale.paon,
                            sale.saon,
                            sale.street,
                            sale.locality,
                            sale.town,
                            sale.postcode,
                          ]
                            .filter(Boolean)
                            .join(", ");
                          return (
                            <tr key={sale.transaction_id}>
                              <td
                                style={{
                                  padding: "6px 8px",
                                  borderBottom:
                                    "1px solid rgba(30,41,59,0.6)",
                                  verticalAlign: "top",
                                }}
                              >
                                <div>{addr}</div>
                                <div
                                  style={{
                                    opacity: 0.7,
                                    marginTop: 2,
                                  }}
                                >
                                  {formatPropertyType(
                                    sale.property_type
                                  ) || "Property"}
                                  {sale.tenure && (
                                    <> · {formatTenure(sale.tenure)}</>
                                  )}
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: "6px 8px",
                                  borderBottom:
                                    "1px solid rgba(30,41,59,0.6)",
                                  textAlign: "right",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                £{sale.price.toLocaleString()}
                              </td>
                              <td
                                style={{
                                  padding: "6px 8px",
                                  borderBottom:
                                    "1px solid rgba(30,41,59,0.6)",
                                  textAlign: "right",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {new Date(sale.date).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </section>

            {/* Other sections (placeholders) */}
            <section
              style={{
                borderRadius: 14,
                border: "1px dashed rgba(51,65,85,0.9)",
                padding: 12,
                background: "#020617",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                Ownership information
              </div>
              <p style={{ fontSize: 12, opacity: 0.75 }}>
                Ownership details for this property (title, tenure, etc.) will
                appear here.
              </p>
            </section>

            <section
              style={{
                borderRadius: 14,
                border: "1px dashed rgba(51,65,85,0.9)",
                padding: 12,
                background: "#020617",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                Planning applications
              </div>
              <p style={{ fontSize: 12, opacity: 0.75 }}>
                Planning history and applications for this address will be
                listed here.
              </p>
            </section>

            <section
              style={{
                borderRadius: 14,
                border: "1px dashed rgba(51,65,85,0.9)",
                padding: 12,
                background: "#020617",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                More to follow
              </div>
              <p style={{ fontSize: 12, opacity: 0.75 }}>
                Additional datasets and analytics (constraints, utilities,
                comps, etc.) will live in this panel.
              </p>
            </section>
          </div>
        </div>
      )}

      {/* BOTTOM DRAW TOOLBAR */}
      <div
        style={{
          position: "fixed",
          bottom: 18,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 25,
          fontFamily: font,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: 6,
            borderRadius: 999,
            background: "rgba(15,23,42,0.96)",
            border: "1px solid rgba(30,64,175,0.7)",
            boxShadow: "0 16px 40px rgba(15,23,42,0.9)",
          }}
        >
          {(["select", "line", "polygon"] as DrawMode[]).map((mode) => {
            const active = drawMode === mode;
            const label =
              mode === "select" ? "Select" : mode === "line" ? "Line" : "Polygon";
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setDrawMode(mode)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "none",
                  fontSize: 12.5,
                  fontWeight: 500,
                  cursor: "pointer",
                  background: active
                    ? "linear-gradient(135deg,#2563eb,#1d4ed8)"
                    : "transparent",
                  color: active ? "white" : "rgba(226,232,240,0.9)",
                  boxShadow: active
                    ? "0 10px 20px rgba(37,99,235,0.55)"
                    : "none",
                }}
              >
                {label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={clearDrawShape}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.6)",
              fontSize: 12.5,
              fontWeight: 500,
              cursor: "pointer",
              background: "transparent",
              color: "rgba(226,232,240,0.9)",
            }}
          >
            Clear shape
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
