import { Cloud, CloudOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { DriveStatus } from '../../hooks/useGoogleDrive';
import { fmt } from '../../utils';

interface Props {
  driveStatus: DriveStatus;
  lastSync: Date | null;
  error: string | null;
  userEmail: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onManualSync: () => void;
}

export function CloudSyncTab({ driveStatus, lastSync, error, userEmail, onConnect, onDisconnect, onManualSync }: Props) {
  const isConnected = driveStatus === 'connected' || driveStatus === 'syncing';

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, rgba(122,162,247,0.2), rgba(187,154,247,0.2))' }}>
          <Cloud size={32} style={{ color: '#7aa2f7' }} />
        </div>
        <h2 className="text-2xl font-bold gradient-text mb-2">Google Drive Sync</h2>
        <p className="text-sm" style={{ color: '#a9b1d6' }}>
          Securely sync your financial data to your personal Google Drive.<br />
          Changes auto-save in real-time. Setup is 100% private.
        </p>
      </div>

      <div className="glass-card p-6 md:p-8 relative overflow-hidden">
        {isConnected && (
          <div className="absolute top-0 left-0 w-full h-1">
            <div className={`h-full bg-gradient-to-r from-primary to-accent ${driveStatus === 'syncing' ? 'w-full animate-pulse-blue' : 'w-full'} transition-all`} />
          </div>
        )}

        {/* Not connected state */}
        {!isConnected && (
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#c0caf5' }}>How it works</h3>
              <ul className="text-xs text-left space-y-2 list-disc pl-4" style={{ color: '#a9b1d6' }}>
                <li>Your data is saved to a hidden 'appDataFolder' in your Drive.</li>
                <li>Only WealthDash can view or edit this file.</li>
                <li>When connected, any change you make autosaves instantly.</li>
                <li>Log in from any device to see your synced data.</li>
              </ul>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 w-full rounded-lg text-left" style={{ background: 'rgba(247,118,142,0.1)', border: '1px solid rgba(247,118,142,0.2)' }}>
                <AlertCircle size={16} className="mt-0.5 shrink-0" style={{ color: '#f7768e' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#f7768e' }}>Connection Error</p>
                  <p className="text-xs mt-1" style={{ color: '#f7768e', opacity: 0.9 }}>{error}</p>
                </div>
              </div>
            )}

            <button
              onClick={onConnect}
              disabled={driveStatus === 'connecting'}
              className="google-btn relative"
            >
              {driveStatus === 'connecting' ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> Connecting...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Sign in with Google
                </>
              )}
            </button>
          </div>
        )}

        {/* Connected state */}
        {isConnected && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#9ece6a' }}>
                  <CheckCircle size={18} /> Connected
                </h3>
                <p className="text-sm mt-1" style={{ color: '#a9b1d6' }}>Logged in as: <span className="font-semibold" style={{ color: '#c0caf5' }}>{userEmail || 'Loading...'}</span></p>
              </div>
              <button
                onClick={onDisconnect}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border"
                style={{ background: 'rgba(247,118,142,0.1)', color: '#f7768e', borderColor: 'rgba(247,118,142,0.2)' }}
              >
                <CloudOff size={14} /> Disconnect
              </button>
            </div>

            <div className="p-4 rounded-xl flex items-center justify-between" style={{ background: '#1a1b26', border: '1px solid #2a2a3d' }}>
              <div>
                <p className="text-xs" style={{ color: '#565f89' }}>Sync Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {driveStatus === 'syncing' ? (
                    <><RefreshCw size={14} className="animate-spin" style={{ color: '#7aa2f7' }} /> <span className="text-sm font-medium" style={{ color: '#7aa2f7' }}>Auto-saving changes...</span></>
                  ) : (
                    <><CheckCircle size={14} style={{ color: '#9ece6a' }} /> <span className="text-sm font-medium" style={{ color: '#c0caf5' }}>Up to date</span></>
                  )}
                </div>
                {lastSync && (
                  <p className="text-xs mt-1" style={{ color: '#565f89' }}>Last saved: {fmt.date(lastSync)}</p>
                )}
              </div>
              <button
                onClick={onManualSync}
                disabled={driveStatus === 'syncing'}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                title="Force Sync Now"
              >
                <RefreshCw size={18} style={{ color: '#565f89' }} className={driveStatus === 'syncing' ? 'animate-spin' : ''} />
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 w-full rounded-lg text-left" style={{ background: 'rgba(247,118,142,0.1)', border: '1px solid rgba(247,118,142,0.2)' }}>
                <AlertCircle size={16} className="mt-0.5 shrink-0" style={{ color: '#f7768e' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#f7768e' }}>Sync Error</p>
                  <p className="text-xs mt-1" style={{ color: '#f7768e', opacity: 0.9 }}>{error}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
