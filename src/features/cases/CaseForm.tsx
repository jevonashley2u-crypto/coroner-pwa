import { useState } from 'react';
import { useCaseStore } from '../../stores/useCaseStore';

export default function CaseForm({ onClose }: { onClose: () => void }) {
  const { addCase } = useCaseStore();
  const [formData, setFormData] = useState({
    caseNumber: '',
    decedentName: '',
    dateOfDeath: '',
    causeOfDeath: '',
    status: 'pending' as const,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCase(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">New Case</h2>

        <input
          type="text"
          placeholder="Case Number"
          value={formData.caseNumber}
          onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
          className="w-full p-3 border rounded mb-4"
          required
        />

        <input
          type="text"
          placeholder="Decedent Name"
          value={formData.decedentName}
          onChange={(e) => setFormData({ ...formData, decedentName: e.target.value })}
          className="w-full p-3 border rounded mb-4"
          required
        />

        <input
          type="date"
          value={formData.dateOfDeath}
          onChange={(e) => setFormData({ ...formData, dateOfDeath: e.target.value })}
          className="w-full p-3 border rounded mb-4"
          required
        />

        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          className="w-full p-3 border rounded mb-4"
        >
          <option value="pending">Pending</option>
          <option value="investigating">Investigating</option>
          <option value="closed">Closed</option>
        </select>

        <textarea
          placeholder="Cause of Death / Notes"
          value={formData.causeOfDeath}
          onChange={(e) => setFormData({ ...formData, causeOfDeath: e.target.value })}
          className="w-full p-3 border rounded mb-4 h-24"
        />

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 border rounded-lg">
            Cancel
          </button>
          <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-lg">
            Save Case
          </button>
        </div>
      </form>
    </div>
  );
}
