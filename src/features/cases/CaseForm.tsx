import { useState } from 'react';
import { useCaseStore } from '../../stores/useCaseStore';

interface CaseFormProps {
  onClose: () => void;
}

export default function CaseForm({ onClose }: CaseFormProps) {
  const addCase = useCaseStore(s => s.addCase);

  const [form, setForm] = useState({
    caseNumber: '',
    decedentName: '',
    causeOfDeath: '',
    dateOfDeath: '',
    status: 'open' as 'open' | 'closed',
    syncStatus: 'pending' as const,
    dateCreated: new Date().toISOString(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCase(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold">New Case</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Case Number</label>
          <input required value={form.caseNumber} onChange={e => setForm(f => ({ ...f, caseNumber: e.target.value }))}
            className="w-full p-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Decedent Name</label>
          <input required value={form.decedentName} onChange={e => setForm(f => ({ ...f, decedentName: e.target.value }))}
            className="w-full p-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Cause of Death</label>
          <input value={form.causeOfDeath} onChange={e => setForm(f => ({ ...f, causeOfDeath: e.target.value }))}
            className="w-full p-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date of Death</label>
          <input type="date" value={form.dateOfDeath} onChange={e => setForm(f => ({ ...f, dateOfDeath: e.target.value }))}
            className="w-full p-2 border rounded-lg" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 p-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit"
            className="flex-1 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
        </div>
      </form>
    </div>
  );
}
