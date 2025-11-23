'use client';

import { CSSProperties } from 'react';

export type BasemapId = 'standard' | 'light' | 'dark' | 'satellite';
export type AreaInfo = { sqm: number; sqft: number };

type SelectedLocation = {
  lng: number;
  lat: number;
  address?: string;
} | null;

type InspectorState = {
  lat: number;
  lng: number;
  zoom: number;
};

type MapControlsPanelProps = {
  basemap: BasemapId;
  terrainOn: boolean;
  inspector: InspectorState;

  drawArea: AreaInfo | null;
  isDrawing: boolean;
  hasCompletedDrawing: boolean;

  selectedLocation: SelectedLocation;
  reverseLoading: boolean;

  showPlanning: boolean;
  planningLoading: boolean;
  planningStatus: 'all' | 'live' | 'decided';
  planningSinceYears: 1 | 3 | 5 | 10;
  planningDensity: 'low' | 'med' | 'high';
  planningRateLimited: boolean;

  showPpd: boolean;
  ppdLoading: boolean;

  onBasemapChange: (id: BasemapId) => void;
  onTerrainToggle: (value: boolean) => void;

  onStartDrawing: () => void;
  onStopDrawing: () => void;
  onClearDrawings: () => void;

  onTogglePlanning: () => void;
  onTogglePpd: () => void;

  onPlanningStatusChange: (v: 'all' | 'live' | 'decided') => void;
  onPlanningSinceYearsChange: (v: 1 | 3 | 5 | 10) => void;
  onPlanningDensityChange: (v: 'low' | 'med' | 'high') => void;
};

const glassCard: CSSProperties = {
  background: 'rgba(17,24,39,0.82)',
  color: 'white',
  borderRadius: 16,
  padding: '10px 12px',
  boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  overflow: 'hidden',
};

const pillButton = (active: boolean): CSSProperties => ({
  padding: '4px 10px',
  borderRadius: 999,
  fontSize: 11,
  border: 'none',
  cursor: 'pointer',
  background: active ? 'white' : 'rgba(255,255,255,0.06)',
  color: active ? '#111827' : 'rgba(255,255,255,0.85)',
});

const switchTrack = (active: boolean): CSSProperties => ({
  width: 34,
  height: 18,
  borderRadius: 999,
  border: '1px solid rgba(148,163,184,0.7)',
  background: active ? 'rgba(22,163,74,0.85)' : 'rgba(15,23,42,0.95)',
  display: 'flex',
  alignItems: 'center',
  padding: 2,
  boxSizing: 'border-box',
  cursor: 'pointer',
  transition: 'background 0.16s ease-out, border-color 0.16s ease-out',
});

const switchThumb = (active: boolean): CSSProperties => ({
  width: 14,
  height: 14,
  borderRadius: '999px',
  background: 'white',
  boxShadow: '0 1px 3px rgba(15,23,42,0.6)',
  transform: active ? 'translateX(14px)' : 'translateX(0px)',
  transition: 'transform 0.16s ease-out',
});

const loadingDotsStyle: CSSProperties = {
  fontSize: 10,
  opacity: 0.7,
  letterSpacing: 1,
  marginLeft: 2,
};

export default function MapControlsPanel({
  basemap,
  terrainOn,
  inspector,
  drawArea,
  isDrawing,
  hasCompletedDrawing,
  selectedLocation,
  reverseLoading,
  showPlanning,
  planningLoading,
  planningStatus,
  planningSinceYears,
  planningDensity,
  planningRateLimited,
  showPpd,
  ppdLoading,
  onBasemapChange,
  onTerrainToggle,
  onStartDrawing,
  onStopDrawing,
  onClearDrawings,
  onTogglePlanning,
  onTogglePpd,
  onPlanningStatusChange,
  onPlanningSinceYearsChange,
  onPlanningDensityChange,
}: MapControlsPanelProps) {
  return (
    <div style={glassCard}>
      {/* Basemap + terrain */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', gap: 4 }}>
          {(['standard', 'light', 'dark', 'satellite'] as BasemapId[]).map((id) => (
            <button
              key={id}
              onClick={() => onBasemapChange(id)}
              style={pillButton(basemap === id)}
            >
              {id === 'standard'
                ? 'Standard'
                : id === 'light'
                ? 'Light'
                : id === 'dark'
                ? 'Dark'
                : 'Satellite'}
            </button>
          ))}
        </div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            opacity: 0.9,
          }}
        >
          <input
            type="checkbox"
            checked={terrainOn}
            onChange={(e) => onTerrainToggle(e.target.checked)}
            style={{ accentColor: '#22c55e' }}
          />
          3D
        </label>
      </div>

      {/* Inspector */}
      <div
        style={{
          fontSize: 11,
          opacity: 0.8,
          padding: '4px 6px',
          borderRadius: 8,
          background: 'rgba(15,23,42,0.9)',
          marginBottom: 8,
        }}
      >
        lng: {inspector.lng.toFixed(5)} · lat: {inspector.lat.toFixed(5)} · zoom:{' '}
        {inspector.zoom.toFixed(2)}
      </div>

      {/* Drawn area */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 8,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 12 }}>Drawn area</div>
          {drawArea ? (
            <div style={{ fontSize: 11, opacity: 0.9 }}>
              {drawArea.sqm.toFixed(1)} m² · {drawArea.sqft.toFixed(1)} ft²
            </div>
          ) : (
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              Use the polygon tool to measure a parcel
            </div>
          )}
          {hasCompletedDrawing && !isDrawing && (
            <div style={{ fontSize: 10, opacity: 0.65, marginTop: 2 }}>
              Clear drawing to start a new one
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            alignItems: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={isDrawing ? onStopDrawing : onStartDrawing}
            disabled={hasCompletedDrawing && !isDrawing}
            style={{
              fontSize: 11,
              padding: '5px 10px',
              borderRadius: 999,
              border: 'none',
              background:
                hasCompletedDrawing && !isDrawing
                  ? 'rgba(148,163,184,0.35)'
                  : isDrawing
                  ? 'rgba(34,197,94,0.9)'
                  : 'rgba(248,250,252,0.15)',
              color: 'white',
              cursor: hasCompletedDrawing && !isDrawing ? 'not-allowed' : 'pointer',
              opacity: hasCompletedDrawing && !isDrawing ? 0.7 : 1,
            }}
          >
            {isDrawing ? 'Stop drawing' : 'Draw parcel'}
          </button>
          <button
            type="button"
            onClick={onClearDrawings}
            style={{
              fontSize: 11,
              padding: '4px 8px',
              borderRadius: 999,
              border: 'none',
              background: 'rgba(248,250,252,0.08)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Layers switches */}
      <div
        style={{
          borderTop: '1px solid rgba(148,163,184,0.4)',
          paddingTop: 6,
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {/* Planning */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 11, opacity: 0.85 }}>Planning applications</div>
            {planningLoading && <span style={loadingDotsStyle}>•••</span>}
          </div>
          <div
            onClick={onTogglePlanning}
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            <div style={switchTrack(showPlanning)}>
              <div style={switchThumb(showPlanning)} />
            </div>
            <span style={{ fontSize: 11, opacity: 0.9 }}>
              {showPlanning ? 'On' : 'Off'}
            </span>
          </div>
        </div>

        {/* Planning filters – only when ON */}
        {showPlanning && (
          <div
            style={{
              marginTop: 6,
              padding: '8px 9px',
              borderRadius: 12,
              background: 'rgba(15,23,42,0.95)',
              border: '1px solid rgba(30,64,175,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {/* Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
              <span style={{ fontSize: 11, opacity: 0.8 }}>Status</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['all', 'live', 'decided'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => onPlanningStatusChange(v)}
                    style={{
                      borderRadius: 999,
                      fontSize: 10,
                      padding: '3px 8px',
                      border: 'none',
                      cursor: 'pointer',
                      background:
                        planningStatus === v
                          ? 'rgba(59,130,246,0.95)'
                          : 'rgba(15,23,42,0.9)',
                      color: 'white',
                      opacity: planningStatus === v ? 1 : 0.8,
                    }}
                  >
                    {v === 'all' ? 'All' : v === 'live' ? 'Live' : 'Decided'}
                  </button>
                ))}
              </div>
            </div>

            {/* Time window */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
              <span style={{ fontSize: 11, opacity: 0.8 }}>Time window</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 3, 5, 10].map((y) => (
                  <button
                    key={y}
                    onClick={() =>
                      onPlanningSinceYearsChange(y as 1 | 3 | 5 | 10)
                    }
                    style={{
                      borderRadius: 999,
                      fontSize: 10,
                      padding: '3px 7px',
                      border: 'none',
                      cursor: 'pointer',
                      background:
                        planningSinceYears === y
                          ? 'rgba(34,197,94,0.95)'
                          : 'rgba(15,23,42,0.9)',
                      color: 'white',
                      opacity: planningSinceYears === y ? 1 : 0.8,
                    }}
                  >
                    {y === 1 ? '1y' : `${y}y`}
                  </button>
                ))}
              </div>
            </div>

            {/* Density */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
              <span style={{ fontSize: 11, opacity: 0.8 }}>Density</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['low', 'med', 'high'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => onPlanningDensityChange(v)}
                    style={{
                      borderRadius: 999,
                      fontSize: 10,
                      padding: '3px 7px',
                      border: 'none',
                      cursor: 'pointer',
                      background:
                        planningDensity === v
                          ? 'rgba(148,163,184,0.9)'
                          : 'rgba(15,23,42,0.9)',
                      color: 'white',
                      opacity: planningDensity === v ? 1 : 0.8,
                    }}
                  >
                    {v === 'low' ? 'Low' : v === 'med' ? 'Med' : 'High'}
                  </button>
                ))}
              </div>
            </div>

            {planningRateLimited && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 10,
                  opacity: 0.75,
                  color: '#fecaca',
                }}
              >
                Planning API rate limited – pausing requests for a bit.
              </div>
            )}
          </div>
        )}

        {/* PPD */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 11, opacity: 0.85 }}>Sold prices (PPD)</div>
            {ppdLoading && <span style={loadingDotsStyle}>•••</span>}
          </div>
          <div
            onClick={onTogglePpd}
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            <div style={switchTrack(showPpd)}>
              <div style={switchThumb(showPpd)} />
            </div>
            <span style={{ fontSize: 11, opacity: 0.9 }}>
              {showPpd ? 'On' : 'Off'}
            </span>
          </div>
        </div>
      </div>

      {/* Selected location */}
      <div
        style={{
          borderTop: '1px solid rgba(148,163,184,0.4)',
          paddingTop: 6,
          marginTop: 6,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 2 }}>
          Selected location
        </div>
        {selectedLocation ? (
          <div style={{ fontSize: 11 }}>
            <div style={{ opacity: 0.85 }}>
              lng: {selectedLocation.lng.toFixed(5)} · lat:{' '}
              {selectedLocation.lat.toFixed(5)}
            </div>
            {reverseLoading && (
              <div style={{ opacity: 0.7, marginTop: 2 }}>Looking up address…</div>
            )}
            {!reverseLoading && selectedLocation.address && (
              <div style={{ marginTop: 2 }}>{selectedLocation.address}</div>
            )}
            {!reverseLoading && !selectedLocation.address && (
              <div style={{ opacity: 0.7, marginTop: 2 }}>
                No address found for this point.
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 11, opacity: 0.75 }}>
            Click a parcel or location on the map to inspect details.
          </div>
        )}
      </div>
    </div>
  );
}
