import { useEffect, useState } from 'react';
import { useCaseStore } from '../../stores/useCaseStore';
import CaseCard from './CaseCard';
import CaseForm from './CaseForm';

export default function CasesPage() {
  const { filteredCases, isLoading, searchTerm, setSearchTerm, loadCases } = useCaseStore();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Coroner Cases</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + New Case
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name, case number, or cause..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-3 border rounded-lg mb-6 text-lg"
      />

      {isLoading ? (
        <div>Loading cases...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredCases.length > 0 ? (
            filteredCases.map((caseItem) => (
              <CaseCard key={caseItem.id} caseItem={caseItem} />
            ))
          ) : (
            <p className="text-gray-500">No cases found.</p>
          )}
        </div>
      )}

      {showForm && (
        <CaseForm onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
