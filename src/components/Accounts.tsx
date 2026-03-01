import { useState } from "react";
import { FinancialData, Account } from "../types";
import { Plus, Trash2, Edit2, Save } from "lucide-react";

export default function Accounts({
  data,
  setData,
}: {
  data: FinancialData;
  setData: (d: FinancialData) => void;
}) {
  const [editingAccount, setEditingAccount] = useState<string | null>(null);

  const handleUpdate = (
    id: string,
    field: keyof Account,
    value: string | number,
  ) => {
    setData({
      ...data,
      accounts: (data.accounts || []).map((acc) =>
        acc.id === id ? { ...acc, [field]: value } : acc,
      ),
    });
  };

  const addAccount = () => {
    const newAccount: Account = {
      id: Date.now().toString(),
      name: "New Account",
      balance: 0,
      type: "Investment",
      expectedReturn: 5,
    };
    setData({ ...data, accounts: [...(data.accounts || []), newAccount] });
    setEditingAccount(newAccount.id);
  };

  const deleteAccount = (id: string) => {
    setData({ ...data, accounts: (data.accounts || []).filter((a) => a.id !== id) });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-zinc-100">
            Accounts & Assets
          </h2>
          <p className="text-zinc-400 mt-1">
            Track your net worth and expected returns.
          </p>
        </div>
        <button
          onClick={addAccount}
          className="flex items-center space-x-2 text-sm bg-lime-500 hover:bg-lime-400 text-zinc-950 px-4 py-2 rounded-xl font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Account</span>
        </button>
      </header>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 border-b border-zinc-800 text-zinc-400 text-sm">
                <th className="p-4 font-medium">Account Name</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium text-right">Balance</th>
                <th className="p-4 font-medium text-right">
                  Expected Return (%)
                </th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {(data.accounts || []).map((acc) => (
                <tr
                  key={acc.id}
                  className="hover:bg-zinc-800/20 transition-colors group"
                >
                  <td className="p-4">
                    {editingAccount === acc.id ? (
                      <input
                        type="text"
                        value={acc.name}
                        onChange={(e) =>
                          handleUpdate(acc.id, "name", e.target.value)
                        }
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-lime-500"
                      />
                    ) : (
                      <span className="font-medium text-zinc-200">
                        {acc.name}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {editingAccount === acc.id ? (
                      <select
                        value={acc.type}
                        onChange={(e) =>
                          handleUpdate(acc.id, "type", e.target.value)
                        }
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-lime-500"
                      >
                        <option value="Investment">Investment</option>
                        <option value="Retirement">Retirement</option>
                        <option value="Cash">Cash</option>
                        <option value="Health">Health</option>
                        <option value="Real Estate">Real Estate</option>
                      </select>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300">
                        {acc.type}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {editingAccount === acc.id ? (
                      <input
                        type="number"
                        value={acc.balance}
                        onChange={(e) =>
                          handleUpdate(
                            acc.id,
                            "balance",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-32 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-lime-500 text-right"
                      />
                    ) : (
                      <span className="font-bold text-zinc-100">
                        ${acc.balance.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {editingAccount === acc.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={acc.expectedReturn}
                        onChange={(e) =>
                          handleUpdate(
                            acc.id,
                            "expectedReturn",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-24 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-lime-500 text-right"
                      />
                    ) : (
                      <span className="text-zinc-400">
                        {acc.expectedReturn}%
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {editingAccount === acc.id ? (
                      <button
                        onClick={() => setEditingAccount(null)}
                        className="p-1.5 text-lime-400 hover:bg-lime-500/10 rounded-md inline-flex"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingAccount(acc.id)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteAccount(acc.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-md"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-zinc-950/80 border-t border-zinc-800">
                <td colSpan={2} className="p-4 font-semibold text-zinc-400">
                  Total Net Worth
                </td>
                <td className="p-4 text-right font-bold text-xl text-lime-400">
                  $
                  {(data.accounts || [])
                    .reduce((sum, a) => sum + (a?.balance || 0), 0)
                    .toLocaleString()}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
