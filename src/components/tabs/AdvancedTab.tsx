import { Settings2 } from 'lucide-react';

export function AdvancedTab() {
  return (
    <div className="space-y-6 animate-fade-in text-center py-12 text-muted-foreground">
      <Settings2 size={48} className="mx-auto mb-4 opacity-50" />
      <h2 className="text-xl font-bold text-foreground">Advanced Settings</h2>
      <p className="max-w-md mx-auto">This section is reserved for advanced portfolio optimization, tax-loss harvesting simulation, and API webhook configurations in future updates.</p>
    </div>
  );
}
