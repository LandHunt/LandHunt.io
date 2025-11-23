'use client';

export type SearchResult = {
  id: string;
  place_name: string;
  center: [number, number];
};

type SearchPanelProps = {
  searchQuery: string;
  searchResults: SearchResult[];
  searchLoading: boolean;
  onSearchQueryChange: (value: string) => void;
  onSearchSelect: (result: SearchResult) => void;
};

export default function SearchPanel({
  searchQuery,
  searchResults,
  searchLoading,
  onSearchQueryChange,
  onSearchSelect,
}: SearchPanelProps) {
  return (
    <div
      style={{
        background: 'rgba(17,24,39,0.82)',
        color: 'white',
        borderRadius: 16,
        padding: '12px 14px',
        boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600 }}>Search properties</div>
        <div style={{ fontSize: 10, opacity: 0.7 }}>Landhunt.io</div>
      </div>
      <div style={{ position: 'relative', marginBottom: 6 }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Type an address, postcode, place…"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            fontSize: 13,
            padding: '8px 10px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.08)',
            outline: 'none',
            background: 'rgba(15,23,42,0.9)',
            color: 'white',
          }}
        />
      </div>
      {searchLoading && (
        <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Searching…</div>
      )}
      {searchResults.length > 0 && (
        <div
          style={{
            marginTop: 4,
            maxHeight: 180,
            overflowY: 'auto',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(15,23,42,0.97)',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {searchResults.map((r) => (
            <button
              key={r.id}
              onClick={() => onSearchSelect(r)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '7px 10px',
                fontSize: 12,
                border: 'none',
                background: 'transparent',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              {r.place_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
