import { computeStats } from '../hooks/usePubs';
import { crowDistance } from './geo';
import { fmtTime, fmtDist, fmtMoney, fmtDate } from './format';

// Draw the normalised route shape into a box on the canvas.
function drawRoute(ctx, geo, box) {
  if (geo.length < 2) return;
  const lats = geo.map((p) => p.lat);
  const lons = geo.map((p) => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const spanLat = maxLat - minLat || 1e-6;
  const spanLon = maxLon - minLon || 1e-6;
  const scale = Math.min((box.w - 80) / spanLon, (box.h - 80) / spanLat);
  const ox = box.x + (box.w - spanLon * scale) / 2;
  const oy = box.y + (box.h - spanLat * scale) / 2;
  const pts = geo.map((p) => ({ x: ox + (p.lon - minLon) * scale, y: oy + (maxLat - p.lat) * scale }));

  ctx.strokeStyle = '#ffcf5c';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
  ctx.stroke();
  pts.forEach((pt, i) => {
    ctx.fillStyle = i === 0 ? '#6dd36d' : i === pts.length - 1 ? '#ff8a6b' : '#ffcf5c';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 11, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * Render a square-ish share card for a crawl and hand it to the OS share
 * sheet (iOS/Android). Falls back to a PNG download on desktop.
 */
export async function shareCrawl(session) {
  const W = 1080;
  const H = 1350;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#241509');
  bg.addColorStop(1, '#160d07');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.8, 0, 0, W * 0.8, 0, 700);
  glow.addColorStop(0, 'rgba(245,166,35,0.28)');
  glow.addColorStop(1, 'rgba(245,166,35,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffcf5c';
  ctx.font = '800 96px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('🍻 PubTrail', W / 2, 160);

  ctx.fillStyle = '#fdf3e3';
  ctx.font = '700 56px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(session.name || fmtDate(session.startedAt || session.endedAt), W / 2, 250);

  const st = computeStats(session.pubs);
  const geo = session.pubs.filter((p) => p.lat != null && p.lon != null);
  const meters = session.walk?.meters ?? (geo.length >= 2 ? crowDistance(geo) : null);

  // headline stats
  const stats = [
    [`${st.count}`, 'PUBS'],
    [`${st.pints}`, 'PINTS'],
    [fmtTime(st.mins), 'TIME'],
  ];
  if (meters != null) stats.push([fmtDist(meters), 'WALKED']);
  if (st.spend > 0) stats.push([fmtMoney(st.spend), 'SPENT']);
  stats.push([`${st.pace}`, 'PINTS/HR']);

  const cols = 3;
  const cellW = W / cols;
  stats.forEach((s, i) => {
    const cx = cellW * (i % cols) + cellW / 2;
    const cy = 380 + Math.floor(i / cols) * 170;
    ctx.fillStyle = '#ffd86b';
    ctx.font = '800 76px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(s[0], cx, cy);
    ctx.fillStyle = '#cda867';
    ctx.font = '600 30px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(s[1], cx, cy + 46);
  });

  // route shape
  drawRoute(ctx, geo, { x: 140, y: 730, w: W - 280, h: 420 });

  ctx.fillStyle = '#8a6e47';
  ctx.font = '600 34px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('tracked with PubTrail', W / 2, H - 70);

  const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
  const file = new File([blob], 'pubtrail-crawl.png', { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'My PubTrail crawl' });
      return;
    } catch {
      /* user cancelled or share failed — fall through to download */
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'pubtrail-crawl.png';
  a.click();
  URL.revokeObjectURL(a.href);
}
