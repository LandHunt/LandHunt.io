// app/api/parcels/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseServer';

function parseBbox(raw: string | null) {
  if (!raw) throw new Error('missing bbox');
  const parts = raw.split(',').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    throw new Error('invalid bbox');
  }
  const [minx, miny, maxx, maxy] = parts;
  return { minx, miny, maxx, maxy };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const { minx, miny, maxx, maxy } = parseBbox(searchParams.get('bbox'));
    const limit = Math.min(
      Number(searchParams.get('limit') ?? '1000'),
      5000
    );

    const { data, error } = await supabase.rpc('get_parcels_geojson', {
      minx,
      miny,
      maxx,
      maxy,
      lim: limit,
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Ensure we always return a FeatureCollection
    const fc =
      data && typeof data === 'object' && 'type' in data ? data : { type: 'FeatureCollection', features: [] };

    return NextResponse.json(fc);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Bad request' }, { status: 400 });
  }
}
