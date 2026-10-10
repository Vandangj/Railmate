import { db, auth } from 'hatchable';
export const access = 'public';
export const methods = ['POST'];
const norm = s => String(s || '').trim().toLowerCase();
const mins = t => { const [h,m] = String(t).split(':').map(Number); return h*60+m; };
export default async function (req, res) {
  const b = req.body || {}; const origin = String(b.origin || '').trim(); const destination = String(b.destination || '').trim(); const travelDate = String(b.travel_date || '').trim();
  if (!origin || !destination || !travelDate) return res.status(400).json({ error: 'Origin, destination, and travel date are required.' });
  if (norm(origin) === norm(destination)) return res.status(400).json({ error: 'Origin and destination must be different.' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(travelDate) || Number.isNaN(Date.parse(travelDate))) return res.status(400).json({ error: 'Enter a valid travel date.' });
  try {
    const { rows } = await db.query('SELECT t.train_number, t.train_name, a.code AS from_code, a.name AS from_station, a.city AS from_city, b.code AS to_code, b.name AS to_station, b.city AS to_city, s.departure_time, s.arrival_time, s.duration_minutes, s.days, s.fare_inr FROM train_schedules s JOIN trains t ON t.id=s.train_id JOIN stations a ON a.id=s.from_station_id JOIN stations b ON b.id=s.to_station_id ORDER BY s.duration_minutes ASC LIMIT 500');
    const stationMatch = (q, row, side) => [row[side+'_city'], row[side+'_station'], row[side+'_code']].some(v => norm(v) === norm(q));
    const edges = rows.map(r => ({...r, from: r.from_city, to: r.to_city}));
    const matches = edges.filter(r => stationMatch(origin,r,'from') && stationMatch(destination,r,'to')).map(r => ({id:r.train_number, train_number:r.train_number, train_name:r.train_name, origin:r.from_city, destination:r.to_city, from_station:r.from_station, to_station:r.to_station, departure_time:r.departure_time, arrival_time:r.arrival_time, duration_minutes:Number(r.duration_minutes), transfers:0, fare_inr:r.fare_inr === null ? null : Number(r.fare_inr), travel_date:travelDate, source:'CURATED_DEMO_DATA', status:'Illustrative schedule — not live availability'}));
    const minTransfers = Math.max(0, Math.min(3, Number(b.max_transfers ?? 1)));
    if (minTransfers >= 1 && matches.length === 0) {
      const byFrom = new Map(); for (const e of edges) { const k=norm(e.from_city); if(!byFrom.has(k)) byFrom.set(k,[]); byFrom.get(k).push(e); }
      for (const first of edges.filter(e => stationMatch(origin,e,'from'))) for (const second of byFrom.get(norm(first.to_city)) || []) {
        if (norm(second.to_city) !== norm(destination) || norm(second.to_city) === norm(origin)) continue;
        const wait = mins(second.departure_time) - mins(first.arrival_time); if (wait < 45 || wait > 720) continue;
        const duration = Number(first.duration_minutes)+wait+Number(second.duration_minutes);
        matches.push({id:first.train_number+'-'+second.train_number, train_number:first.train_number+' + '+second.train_number, train_name:first.train_name+' → '+second.train_name, origin:first.from_city, destination:second.to_city, from_station:first.from_station, to_station:second.to_station, departure_time:first.departure_time, arrival_time:second.arrival_time, duration_minutes:duration, transfers:1, fare_inr:first.fare_inr == null || second.fare_inr == null ? null : Number(first.fare_inr)+Number(second.fare_inr), travel_date:travelDate, connection_at:first.to_city, connection_wait_minutes:wait, source:'CURATED_DEMO_DATA', status:'Illustrative schedule — not live availability'});
      }
    }
    const pref = b.preference || 'fastest'; matches.sort((a,c) => pref==='cheapest' ? (a.fare_inr ?? Infinity)-(c.fare_inr ?? Infinity) : pref==='fewest' ? a.transfers-c.transfers || a.duration_minutes-c.duration_minutes : a.duration_minutes-c.duration_minutes);
    const user = await auth.getUser(req).catch(()=>null);
    await db.query('INSERT INTO route_searches (user_id, origin, destination, travel_date, preferences, source) VALUES ($1,$2,$3,$4,$5::jsonb,$6)', [user?.id || null,origin,destination,travelDate,JSON.stringify({preference:pref,max_transfers:minTransfers}),'CURATED_DEMO_DATA']);
    await db.query('INSERT INTO agent_execution_logs (agent_name, action, status, detail) VALUES ($1,$2,$3,$4::jsonb)', ['Route Planning Agent','search','success',JSON.stringify({origin,destination,count:matches.length,source:'CURATED_DEMO_DATA'})]);
    return res.json({ routes: matches.slice(0,12), count:matches.length, source:'CURATED_DEMO_DATA', live_data:false, message: matches.length ? 'Showing curated demo schedules. Fares and times are illustrative, not live availability.' : 'No matching route exists in the current demo dataset. Try Mumbai to Ahmedabad, Ahmedabad to Jaipur, Mumbai to Jaipur, or Mumbai to Pune.' });
  } catch (e) { console.error('route_search_failed',e); return res.status(500).json({error:'Route search is temporarily unavailable.'}); }
}
