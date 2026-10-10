import { db } from 'hatchable';
export const access = 'public';
export const methods = ['GET'];
export default async function (req, res) {
  try { const { rows } = await db.query('SELECT code, name, city, latitude, longitude FROM stations ORDER BY city, name'); return res.json({ stations: rows, source: 'CURATED_DEMO_DATA' }); }
  catch (e) { console.error('stations_failed', e); return res.status(500).json({ error: 'Station data is temporarily unavailable.' }); }
}
