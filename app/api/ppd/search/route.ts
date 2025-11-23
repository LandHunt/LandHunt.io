// app/api/ppd/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

type Bbox = {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
};

type BackendGeometryPayload =
  | { type: 'bbox'; bbox: Bbox }
  | { type: 'polygon'; geometry: GeoJSON.Polygon };

function polygonToBbox(geom: GeoJSON.Polygon): Bbox {
  const coords = geom.coordinates[0]; // outer ring
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  for (const [lon, lat] of coords) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  return { minLon, minLat, maxLon, maxLat };
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as BackendGeometryPayload;

    let bbox: Bbox;
    if (payload.type === 'bbox') {
      bbox = payload.bbox;
    } else if (payload.type === 'polygon') {
      bbox = polygonToBbox(payload.geometry);
    } else {
      return NextResponse.json(
        { error: 'Invalid payload type' },
        { status: 400 },
      );
    }

    // Small safety clamp on extent
    const width = bbox.maxLon - bbox.minLon;
    const height = bbox.maxLat - bbox.minLat;
    if (width <= 0 || height <= 0) {
      return NextResponse.json(
        { type: 'FeatureCollection', features: [] },
        { status: 200 },
      );
    }

    const supabase = supabaseServer();

    // IMPORTANT: supabaseServer should already be configured with db: { schema: 'landhunt' }
    // so `.from('ppd')` will hit landhunt.ppd.
    const { data, error } = await supabase
.from('landhunt.ppd')
      .select(
        [
          'transaction_id',
          'price',
          'date',
          'postcode',
          'property_type',
          'tenure',
          'new_build',
          'category',
          'lat',
          'lon',
        ].join(','),
      )
      .gte('lon', bbox.minLon)
      .lte('lon', bbox.maxLon)
      .gte('lat', bbox.minLat)
      .lte('lat', bbox.maxLat)
      .order('date', { ascending: false })
      .limit(800); // hard cap so we don't flood the map

    if (error) {
      console.error('[PPD search] Supabase error:', error);
      return NextResponse.json({ error: 'PPD query failed' }, { status: 500 });
    }

    const features: GeoJSON.Feature<GeoJSON.Point, any>[] =
      (data ?? []).map((row) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [row.lon, row.lat],
        },
        properties: {
          transaction_id: row.transaction_id,
          price: row.price,
          transfer_date: row.date, // <- name expected by popup
          property_type: row.property_type,
          estate_type: row.tenure, // <- name expected by popup
          new_build: row.new_build,
          category: row.category,
          postcode: row.postcode,
        },
      }));

    const fc: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };

    return NextResponse.json(fc, { status: 200 });
  } catch (err) {
    console.error('[PPD search] Unexpected error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
