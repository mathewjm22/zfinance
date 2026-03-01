import { useState, useRef, ChangeEvent, useEffect } from "react";
import { FinancialData } from "../types";
import { Download, Upload, CheckCircle2, AlertCircle, Cloud, CloudUpload, CloudDownload } from "lucide-react";

// Add global types for Google API
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export default function Settings({
  data,
  setData,
}: {
  data: FinancialData;
  setData: (d: FinancialData) => void;
}) {
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load Google API scripts
    const loadScripts = async () => {
      if (!CLIENT_ID) return;
      
      try {
        await new Promise<void>((resolve) => {
          const gapiScript = document.createElement('script');
          gapiScript.src = 'https://apis.google.com/js/api.js';
          gapiScript.onload = () => window.gapi.load('client', resolve);
          document.body.appendChild(gapiScript);
        });

        await window.gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        });

        const gsiScript = document.createElement('script');
        gsiScript.src = 'https://accounts.google.com/gsi/client';
        gsiScript.onload = () => {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (tokenResponse: any) => {
              if (tokenResponse.error !== undefined) {
                setStatus({ type: "error", message: "Failed to connect to Google Drive." });
                return;
              }
              setIsConnected(true);
              setStatus({ type: "success", message: "Successfully connected to Google Drive!" });
            },
          });
          setTokenClient(client);
        };
        document.body.appendChild(gsiScript);
      } catch (error) {
        console.error("Error loading Google APIs", error);
      }
    };

    loadScripts();
  }, []);

  const handleConnectDrive = () => {
    if (!CLIENT_ID) {
      setStatus({ type: "error", message: "Google Client ID is not configured. Add VITE_GOOGLE_CLIENT_ID to your environment variables." });
      return;
    }
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  };

  const findBackupFile = async () => {
    const response = await window.gapi.client.drive.files.list({
      q: "name='wealthdash_backup.json' and trashed=false",
      spaces: 'drive',
      fields: 'files(id, name)',
    });
    return response.result.files;
  };

  const handleSaveToDrive = async () => {
    setIsLoading(true);
    try {
      const files = await findBackupFile();
      const fileContent = JSON.stringify(data);
      const file = new Blob([fileContent], { type: 'application/json' });
      const metadata = {
        name: 'wealthdash_backup.json',
        mimeType: 'application/json',
      };

      const accessToken = window.gapi.client.getToken().access_token;
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      let method = 'POST';

      if (files && files.length > 0) {
        url = `https://www.googleapis.com/upload/drive/v3/files/${files[0].id}?uploadType=multipart`;
        method = 'PATCH';
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      });

      if (response.ok) {
        setStatus({ type: "success", message: "Data successfully backed up to Google Drive!" });
      } else {
        throw new Error('Upload failed');
      }
    } catch (e) {
      console.error(e);
      setStatus({ type: "error", message: "Failed to save to Google Drive. Please try reconnecting." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadFromDrive = async () => {
    setIsLoading(true);
    try {
      const files = await findBackupFile();
      if (!files || files.length === 0) {
        setStatus({ type: "error", message: "No backup found in Google Drive." });
        setIsLoading(false);
        return;
      }

      const fileId = files[0].id;
      const response = await window.gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media',
      });

      const importedData = response.result;
      if (importedData.income && importedData.expenses && importedData.accounts && importedData.retirement) {
        setData(importedData);
        setStatus({ type: "success", message: "Data successfully imported from Google Drive!" });
      } else {
        throw new Error("Invalid data format");
      }
    } catch (e) {
      console.error(e);
      setStatus({ type: "error", message: "Failed to load from Google Drive." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wealthdash-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus({
        type: "success",
        message: "Data exported successfully.",
      });
    } catch (e) {
      setStatus({ type: "error", message: "Failed to export data." });
    }
  };

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (
          importedData.income &&
          importedData.expenses &&
          importedData.accounts &&
          importedData.retirement
        ) {
          setData(importedData);
          setStatus({
            type: "success",
            message: "Data imported successfully!",
          });
        } else {
          throw new Error("Invalid data format");
        }
      } catch (err) {
        setStatus({
          type: "error",
          message:
            "Failed to parse the file. Ensure it is a valid backup JSON.",
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl">
      <header>
        <h2 className="text-3xl font-bold text-zinc-100">Settings & Data</h2>
        <p className="text-zinc-400 mt-1">
          Manage your data backups and imports.
        </p>
      </header>

      {status && (
        <div
          className={`p-4 rounded-xl flex items-center space-x-3 ${status.type === "success" ? "bg-lime-500/10 text-lime-400 border border-lime-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <p>{status.message}</p>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-sm space-y-8">
        
        {/* Google Drive Integration */}
        <div>
          <h3 className="text-xl font-semibold text-zinc-100 flex items-center space-x-2">
            <Cloud className="w-5 h-5 text-blue-400" />
            <span>Google Drive Sync</span>
          </h3>
          <p className="text-zinc-400 mt-2 mb-4 text-sm">
            Securely connect your Google Drive to automatically backup and restore your financial data.
            <br />
            <span className="text-zinc-500 text-xs mt-1 block">
              Note: Requires VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY environment variables.
            </span>
          </p>
          
          {!isConnected ? (
            <button
              onClick={handleConnectDrive}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-medium transition-colors"
            >
              <Cloud className="w-4 h-4" />
              <span>Connect Google Drive</span>
            </button>
          ) : (
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleSaveToDrive}
                disabled={isLoading}
                className="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                <CloudUpload className="w-4 h-4 text-lime-400" />
                <span>Backup to Drive</span>
              </button>
              <button
                onClick={handleLoadFromDrive}
                disabled={isLoading}
                className="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                <CloudDownload className="w-4 h-4 text-blue-400" />
                <span>Import from Drive</span>
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-zinc-800 pt-8">
          <h3 className="text-xl font-semibold text-zinc-100">Local Export</h3>
          <p className="text-zinc-400 mt-2 mb-4 text-sm">
            Download your financial data as a JSON file to your local computer.
          </p>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2 rounded-xl font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Backup</span>
          </button>
        </div>

        <div className="border-t border-zinc-800 pt-8">
          <h3 className="text-xl font-semibold text-zinc-100">Local Import</h3>
          <p className="text-zinc-400 mt-2 mb-4 text-sm">
            Restore your financial data from a previously exported JSON file.{" "}
            <strong>Warning:</strong> This will overwrite your current data.
          </p>
          <input
            type="file"
            accept=".json"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImport}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 bg-lime-500 hover:bg-lime-400 text-zinc-950 px-4 py-2 rounded-xl font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Backup</span>
          </button>
        </div>
      </div>
    </div>
  );
}
