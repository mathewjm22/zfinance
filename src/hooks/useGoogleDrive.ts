import { useState, useCallback, useEffect, useRef } from 'react';
import { FinancialData } from '../types';

const DRIVE_FILE_NAME = 'zfinance-data.json';
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

export type DriveStatus = 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'error';

// Global GAPI/GIS state holders
let gapiReady = false;
let gisReady = false;
let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let currentToken: string | null = null;

// Load GAPI client
async function ensureGapi(): Promise<void> {
  if (gapiReady) return;
  return new Promise((resolve, reject) => {
    const poll = setInterval(() => {
      if (window.gapi) {
        clearInterval(poll);
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({});
            await window.gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
            gapiReady = true;
            resolve();
          } catch (e) { reject(e); }
        });
      }
    }, 100);
    setTimeout(() => { clearInterval(poll); reject(new Error('GAPI timeout')); }, 10_000);
  });
}

// Load GIS token client
async function ensureGis(): Promise<void> {
  if (gisReady) return;
  return new Promise((resolve, reject) => {
    const poll = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(poll);
        gisReady = true;
        resolve();
      }
    }, 100);
    setTimeout(() => { clearInterval(poll); reject(new Error('GIS timeout')); }, 10_000);
  });
}

// Find or create the JSON file in appdata folder
async function findOrCreateFile(): Promise<string> {
  const listRes = await window.gapi.client.drive.files.list({
    spaces: 'appDataFolder',
    fields: 'files(id, name)',
    q: `name = '${DRIVE_FILE_NAME}'`,
  });
  const files = (listRes.result.files ?? []) as Array<{ id: string; name: string }>;
  if (files.length > 0) return files[0].id;

  const meta = { name: DRIVE_FILE_NAME, parents: ['appDataFolder'] };
  const createRes = await fetch(
    'https://www.googleapis.com/drive/v3/files?fields=id',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${currentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(meta),
    }
  );
  const json = await createRes.json() as { id: string };
  return json.id;
}

export function useGoogleDrive(data: FinancialData, onLoad: (d: FinancialData) => void) {
  const [status, setStatus] = useState<DriveStatus>('disconnected');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const fileIdRef = useRef<string | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save when data changes (debounced 2s)
  useEffect(() => {
    if (status !== 'connected' && status !== 'syncing') return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => { void syncNow(data); }, 2000);
    return () => { if (syncTimerRef.current) clearTimeout(syncTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, status]);

  useEffect(() => {
    // Eagerly load scripts so that popup blockers (like in mobile Safari)
    // don't block the synchronous login intent later.
    ensureGapi().catch(() => {});
    ensureGis().catch(() => {});
  }, []);

  const syncNow = useCallback(async (payload: FinancialData) => {
    if (!currentToken || !fileIdRef.current) return;
    setStatus('syncing');
    try {
      const body = JSON.stringify(payload, null, 2);
      await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileIdRef.current}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
          },
          body,
        }
      );
      setLastSync(new Date());
      setStatus('connected');
      setError(null);
    } catch (e) {
      setError(String(e));
      setStatus('error');
    }
  }, []);

  const loadFromDrive = useCallback(async () => {
    if (!currentToken || !fileIdRef.current) return;
    try {
      const metaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileIdRef.current}?alt=media`,
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      if (metaRes.ok) {
        const text = await metaRes.text();
        if (text.trim().startsWith('{')) {
          const parsed = JSON.parse(text) as FinancialData;
          onLoad(parsed);
        }
      }
    } catch {/* file may be empty on first use */}
  }, [onLoad]);

  const connect = useCallback(() => {
    setStatus('connecting');
    setError(null);

    // To prevent popup blockers, `requestAccessToken` must be called synchronously
    // in the click handler. We can only do this if the scripts are already loaded.
    if (!gapiReady || !gisReady) {
      setError("Google API is still loading. Please try again in a moment.");
      setStatus('disconnected');
      return;
    }

    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: async (resp) => {
          if (resp.error) {
            setError(resp.error);
            setStatus('error');
            return;
          }
          currentToken = resp.access_token;
          try {
            const infoRes = await fetch(
              'https://www.googleapis.com/oauth2/v3/userinfo',
              { headers: { Authorization: `Bearer ${currentToken}` } }
            );
            const info = await infoRes.json() as { email: string };
            setUserEmail(info.email);
          } catch {}
          window.gapi.client.setToken({ access_token: currentToken });

          try {
            fileIdRef.current = await findOrCreateFile();
            await loadFromDrive();
            setStatus('connected');
          } catch (err) {
            setError(String(err));
            setStatus('error');
          }
        },
      });
      tokenClient.requestAccessToken({ prompt: '' });
    } catch (e) {
      setError(String(e));
      setStatus('error');
    }
  }, [loadFromDrive]);

  const disconnect = useCallback(() => {
    if (currentToken) {
      window.google.accounts.oauth2.revoke(currentToken, () => {});
      currentToken = null;
    }
    fileIdRef.current = null;
    setStatus('disconnected');
    setLastSync(null);
    setUserEmail(null);
    setError(null);
  }, []);

  const manualSync = useCallback(() => syncNow(data), [data, syncNow]);

  return { status, lastSync, error, userEmail, connect, disconnect, manualSync };
}

// Type augmentation for gapi / google global objects
declare global {
  interface Window {
    gapi: typeof gapi;
    google: typeof google;
  }
}
