'use client';

import SearchPanel from '@/components/dashboard/SearchPanel';
import MapControlsPanel, {
  BasemapId,
  AreaInfo,
} from '@/components/dashboard/MapControlsPanel';

type DashboardUIProps = {
  basemap: BasemapId;
  terrainOn: boolean;
  inspector: { lat: number; lng: number; zoom: number };

  drawArea: AreaInfo | null;
  isDrawing: boolean;
  hasCompletedDrawing: boolean;

  searchQuery: string;
  searchResults: { id: string; place_name: string; center: [number, number] }[];
  searchLoading: boolean;

  selectedLocation: { lng: number; lat: number; address?: string } | null;
  reverseLoading: boolean;

  showPlanning: boolean;
  planningLoading: boolean;
  planningStatus: 'all' | 'live' | 'decided';
  planningSinceYears: 1 | 3 | 5 | 10;
  planningDensity: 'low' | 'med' | 'high';
  planningRateLimited: boolean;

  showPpd: boolean;
  ppdLoading: boolean;

  onSearchQueryChange: (value: string) => void;
  onSearchSelect: (result: {
    id: string;
    place_name: string;
    center: [number, number];
  }) => void;

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

export default function DashboardUI(props: DashboardUIProps) {
  const {
    basemap,
    terrainOn,
    inspector,
    drawArea,
    isDrawing,
    hasCompletedDrawing,
    searchQuery,
    searchResults,
    searchLoading,
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
    onSearchQueryChange,
    onSearchSelect,
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
  } = props;

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        fontFamily:
          'system-ui,-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif',
        maxWidth: 420,
      }}
    >
      <SearchPanel
        searchQuery={searchQuery}
        searchResults={searchResults}
        searchLoading={searchLoading}
        onSearchQueryChange={onSearchQueryChange}
        onSearchSelect={onSearchSelect}
      />

      <MapControlsPanel
        basemap={basemap}
        terrainOn={terrainOn}
        inspector={inspector}
        drawArea={drawArea}
        isDrawing={isDrawing}
        hasCompletedDrawing={hasCompletedDrawing}
        selectedLocation={selectedLocation}
        reverseLoading={reverseLoading}
        showPlanning={showPlanning}
        planningLoading={planningLoading}
        planningStatus={planningStatus}
        planningSinceYears={planningSinceYears}
        planningDensity={planningDensity}
        planningRateLimited={planningRateLimited}
        showPpd={showPpd}
        ppdLoading={ppdLoading}
        onBasemapChange={onBasemapChange}
        onTerrainToggle={onTerrainToggle}
        onStartDrawing={onStartDrawing}
        onStopDrawing={onStopDrawing}
        onClearDrawings={onClearDrawings}
        onTogglePlanning={onTogglePlanning}
        onTogglePpd={onTogglePpd}
        onPlanningStatusChange={onPlanningStatusChange}
        onPlanningSinceYearsChange={onPlanningSinceYearsChange}
        onPlanningDensityChange={onPlanningDensityChange}
      />
    </div>
  );
}
