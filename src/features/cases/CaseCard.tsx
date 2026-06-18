import { useCaseStore } from '../../stores/useCaseStore';
import type { Case } from '../../lib/db';

interface CaseCardProps {
  caseItem: Case;
}

export default function CaseCard({ caseItem }: CaseCardProps) {
  const deleteCase = useCaseStore(s => s.deleteCase);

  return (
    <div className="border rounded-xl p-4 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="font-bold text-lg">{caseItem.decedentName}</h2>
          <p className="text-sm text-gray-500">Case #{caseItem.caseNumber}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded ${
          caseItem.syncStatus === 'synced' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {caseItem.syncStatus}
        </span>
      </div>
      {caseItem.causeOfDeath && (
        <p className="text-sm text-gray-600 mb-1">Cause: {caseItem.causeOfDeath}</p>
      )}
      <p className="text-xs text-gray-400">{new Date(caseItem.dateCreated).toLocaleDateString()}</p>
      <button
        onClick={() => deleteCase(caseItem.id)}
        className="mt-3 text-sm text-red-600 hover:underline"
      >
        Delete
      </button>
    </div>
  );
}
