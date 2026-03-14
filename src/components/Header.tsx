import { Wallet, Menu } from 'lucide-react';
import { fmt } from '../utils';
import { DriveStatus } from '../hooks/useGoogleDrive';

interface Props {
  netWorth: number;
  driveStatus: DriveStatus;
  onMenuClick: () => void;
}

const statusChip: Record<DriveStatus, { label: string; cls: string; dot: string }> = {
  disconnected: { label: 'Not synced',  cls: 'chip-muted',   dot: '#565f89' },
  connecting:   { label: 'Connecting…', cls: 'chip-warning',  dot: '#e0af68' },
  connected:    { label: 'Synced',      cls: 'chip-success',  dot: '#9ece6a' },
  syncing:      { label: 'Syncing…',    cls: 'chip-info',     dot: '#7aa2f7' },
  error:        { label: 'Sync error',  cls: 'chip-danger',   dot: '#f7768e' },
};

export function Header({ netWorth, driveStatus, onMenuClick }: Props) {
  const s = statusChip[driveStatus];
  return (
    <header
      className="sticky top-0 z-50 w-full border-b"
      style={{
        background: 'rgba(13,13,13,0.85)',
        backdropFilter: 'blur(16px)',
        borderColor: '#1e2030',
      }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7aa2f7, #bb9af7)' }}
          >
            <Wallet size={20} className="text-black" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text tracking-tight">WealthDash</h1>
            <p className="text-xs" style={{ color: '#565f89' }}>Click any value to edit</p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Net worth badge (desktop) */}
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(122,162,247,0.1)', border: '1px solid rgba(122,162,247,0.2)' }}
          >
            <span className="text-xs" style={{ color: '#565f89' }}>Net Worth:</span>
            <span className="text-sm font-bold" style={{ color: '#7aa2f7' }}>{fmt.compact(netWorth)}</span>
          </div>

          {/* Drive status */}
          <span className={`chip ${s.cls} hidden sm:inline-flex`}>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: s.dot, animation: driveStatus === 'syncing' ? 'pulse-blue 1.4s infinite' : undefined }}
            />
            {s.label}
          </span>

          {/* Mobile menu */}
          <button onClick={onMenuClick} className="md:hidden p-2 rounded-lg hover:bg-white/5">
            <Menu size={20} style={{ color: '#c0caf5' }} />
          </button>
        </div>
      </div>
    </header>
  );
}
