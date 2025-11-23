// app/api/planning/search/route.ts
import { NextRequest, NextResponse } from 'next/server';

type Bbox = {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
};

type BackendGeometryPayload =
  | { type: 'bbox'; bbox: Bbox }
  | { type: 'polygon'; geometry: GeoJSON.Polygon };

function bboxFromPolygon(geometry: GeoJSON.Polygon): Bbox {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  for (const ring of geometry.coordinates) {
    for (const [lon, lat] of ring) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }

  return { minLon, minLat, maxLon, maxLat };
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as BackendGeometryPayload;
    console.log('[PLANNING API] Incoming payload:', payload);

    let bbox: Bbox;
    if (payload.type === 'bbox') {
      bbox = payload.bbox;
    } else if (payload.type === 'polygon') {
      bbox = bboxFromPolygon(payload.geometry);
    } else {
      console.error('[PLANNING API] Invalid payload type:', (payload as any).type);
      return NextResponse.json({ error: 'Invalid payload type' }, { status: 400 });
    }

    const { minLon, minLat, maxLon, maxLat } = bbox;
    const bboxParam = `${minLon},${minLat},${maxLon},${maxLat}`;
    const today = new Date().toISOString().slice(0, 10);

    const url = new URL('/api/applics/geojson', 'https://www.planit.org.uk');
    url.searchParams.set('bbox', bboxParam);
    url.searchParams.set('start_date', '2000-02-01');
    url.searchParams.set('end_date', today);
    url.searchParams.set('pg_sz', '200');
    url.searchParams.set('compress', 'on');

    console.log('[PLANNING API] Fetching PlanIt URL:', url.toString());

    const upstream = await fetch(url.toString(), {
      // route handler is server-side only; no need for revalidate here
      cache: 'no-store',
    });

    console.log('[PLANNING API] Upstream status:', upstream.status);

        if (!upstream.ok) {
      const text = await upstream.text();
      console.error(
        '[PLANNING API] Upstream PlanIt error',
        upstream.status,
        text.slice(0, 500),
      );

      // If PlanIt is rate limiting us, surface that as 429 to the client
      if (upstream.status === 429) {
        return NextResponse.json(
          {
            error: 'planit_rate_limited',
            status: 429,
            body: text,
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        {
          error: 'Upstream PlanIt error',
          status: upstream.status,
          body: text,
        },
        { status: 502 },
      );
    }


    const geojson = await upstream.json();
    console.log(
      '[PLANNING API] PlanIt GeoJSON features:',
      Array.isArray(geojson.features) ? geojson.features.length : 'no features array',
    );

    return NextResponse.json(geojson);
  } catch (err: any) {
    console.error('[PLANNING API] Route error:', err);
    return NextResponse.json(
      {
        error: 'Internal error in planning search route',
        details: String(err?.message ?? err),
      },
      { status: 500 },
    );
  }
}
