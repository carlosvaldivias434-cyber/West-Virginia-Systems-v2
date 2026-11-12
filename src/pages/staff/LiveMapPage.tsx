import React, { useState, useEffect, useRef } from 'react';
import { MapPin, RefreshCw, User, Shield, Info, Radio } from 'lucide-react';

interface PlayerBlip {
  id: string;
  name: string;
  team: string;
  x: number;
  y: number;
  z: number;
  health: number;
  callsign?: string;
}

export default function LiveMapPage() {
  const [players, setPlayers] = useState<PlayerBlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerBlip | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    document.title = 'Live Map · WVSP';
    fetchMapData();
    const interval = setInterval(fetchMapData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchMapData = async () => {
    try {
      const res = await fetch('/api/staff/live-map');
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.players || []);
        setLastUpdated(Date.now());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Draw Radar Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw Map Arteries / Highways
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Route 19 main artery
    ctx.moveTo(60, height / 2);
    ctx.lineTo(width - 60, height / 2);
    // North-South Highway
    ctx.moveTo(width / 2, 60);
    ctx.lineTo(width / 2, height - 60);
    // Diagonal Bypass
    ctx.moveTo(100, 100);
    ctx.lineTo(width - 100, height - 100);
    ctx.stroke();

    // Sector Labels
    ctx.fillStyle = '#334155';
    ctx.font = '10px monospace';
    ctx.fillText('SECTOR A · NORTH CHARLESTON', 20, 30);
    ctx.fillText('SECTOR B · APPALACHIAN BASIN', width - 200, 30);
    ctx.fillText('SECTOR C · BECKLEY METRO', 20, height - 20);
    ctx.fillText('SECTOR D · MOUNTAIN PASS', width - 180, height - 20);

    // Draw Radar Range Rings
    ctx.strokeStyle = 'rgba(0, 168, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 120, 0, Math.PI * 2);
    ctx.arc(width / 2, height / 2, 220, 0, Math.PI * 2);
    ctx.arc(width / 2, height / 2, 320, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Player Blips
    // Normalize coordinates roughly from ER:LC range (-3000 to 3000) into canvas width/height
    players.forEach(p => {
      const pName = p.name || (p as any).username || 'Player';
      const pX = typeof p.x === 'number' && !isNaN(p.x) ? p.x : 0;
      const rawZ = p.z !== undefined ? p.z : (p as any).y;
      const pZ = typeof rawZ === 'number' && !isNaN(rawZ) ? rawZ : 0;

      const cx = ((pX + 3000) / 6000) * (width - 100) + 50;
      const cy = ((pZ + 3000) / 6000) * (height - 100) + 50;

      let color = '#94a3b8'; // Civilian default
      const teamLower = (p.team || '').toLowerCase();
      if (teamLower.includes('police') || teamLower.includes('state')) color = '#00A8FF';
      else if (teamLower.includes('sheriff')) color = '#f59e0b';
      else if (teamLower.includes('fire') || teamLower.includes('ems')) color = '#ef4444';
      else if (teamLower.includes('dot')) color = '#eab308';

      // Glow circle
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner dot
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Label
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '10px sans-serif';
      ctx.fillText(pName, cx + 10, cy + 3);
    });
  }, [players]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const actualX = mouseX * scaleX;
    const actualY = mouseY * scaleY;

    // Find closest player blip
    let closest: PlayerBlip | null = null;
    let minDistance = 25;

    players.forEach(p => {
      const pX = typeof p.x === 'number' && !isNaN(p.x) ? p.x : 0;
      const rawZ = p.z !== undefined ? p.z : (p as any).y;
      const pZ = typeof rawZ === 'number' && !isNaN(rawZ) ? rawZ : 0;
      const cx = ((pX + 3000) / 6000) * (canvas.width - 100) + 50;
      const cy = ((pZ + 3000) / 6000) * (canvas.height - 100) + 50;
      const dist = Math.hypot(cx - actualX, cy - actualY);
      if (dist < minDistance) {
        minDistance = dist;
        closest = p;
      }
    });

    if (closest) {
      setSelectedPlayer(closest);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-4 h-4 text-[#00A8FF] animate-pulse" />
            <span className="text-[10px] font-bold text-[#00A8FF] uppercase tracking-wider">
              Telemetry Radar Feed · 10s Cycle
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Live In-Game Tactical Map</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            {players.length} active units tracked
          </span>
          <button
            onClick={fetchMapData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-6 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#00A8FF] shadow-sm shadow-[#00A8FF]" />
          <span>WV State Police</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500" />
          <span>County Sheriff</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500" />
          <span>Fire &amp; EMS Rescue</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500" />
          <span>Transportation (DOT)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-400 shadow-sm shadow-slate-400" />
          <span>Civilian Units</span>
        </div>
      </div>

      {/* Canvas Radar Container */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={880}
          height={540}
          onClick={handleCanvasClick}
          className="w-full h-auto cursor-crosshair rounded-xl block max-w-full"
        />

        {/* Selected Player Overlay */}
        {selectedPlayer && (
          <div className="absolute top-4 right-4 z-20 bg-slate-900/95 border border-[#00A8FF]/40 rounded-xl p-4 shadow-xl max-w-xs w-full text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-[#00A8FF]" />
                <span>{selectedPlayer.name}</span>
              </div>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 text-slate-300">
              <div>Team: <strong className="text-white">{selectedPlayer.team}</strong></div>
              <div>Health: <strong className="text-emerald-400">{selectedPlayer.health}%</strong></div>
              <div>Coordinates: <span className="font-mono text-slate-400">{Math.round(selectedPlayer.x)}, {Math.round(selectedPlayer.z)}</span></div>
              {selectedPlayer.callsign && (
                <div>Callsign: <strong className="text-[#00A8FF]">{selectedPlayer.callsign}</strong></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
