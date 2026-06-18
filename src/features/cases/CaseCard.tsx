import { useCaseStore } from '../../stores/useCaseStore';

export default function CaseCard({ caseItem }: { caseItem: any }) {
  const { updateCase, deleteCase } = useCaseStore();

  return (
    <div className="border rounded-xl p-5 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between">
        <h3 className="font-semibold text-xl">{caseItem.decedentName}</h3>
        <span className={`px-3 py-1 rounded-full text-sm ${
          caseItem.status === 'closed' ? 'bg-green-100 text-green-700' :
          caseItem.status === 'investigating' ? 'bg-blue-100 text-blue-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {caseItem.status}
        </span>
      </div>

      <p className="text-gray-600 mt-1">Case #{caseItem.caseNumber}</p>
      <p className="text-sm text-gray-500 mt-2">DOD: {new Date(caseItem.dateOfDeath).toLocaleDateString()}</p>

      {caseItem.causeOfDeath && (
        <p className="mt-3 text-sm"><strong>Cause:</strong> {caseItem.causeOfDeath}</p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => {/* Open detail modal */}}
          className="text-blue-600 hover:underline"
        >
          View Details
        </button>
        <button
          onClick={() => deleteCase(caseItem.id)}
          className="text-red-600 hover:underline text-sm"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
