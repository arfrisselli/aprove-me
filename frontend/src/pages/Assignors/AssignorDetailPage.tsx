import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { assignorService } from '../../services/assignor.service';

export function AssignorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: assignor, isLoading, isError } = useQuery({
    queryKey: ['assignor', id],
    queryFn: () => assignorService.findOne(id!),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !assignor) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
        <p className="text-red-600">Cedente não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          ← Voltar
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Dados do Cedente</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">ID</p>
          <p className="font-mono text-sm text-gray-700">{assignor.id}</p>
        </div>

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            Nome / Razão Social
          </p>
          <p className="text-lg font-semibold text-gray-800">{assignor.name}</p>
        </div>

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Documento</p>
          <p className="text-gray-700">{assignor.document}</p>
        </div>

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">E-mail</p>
          <p className="text-gray-700">{assignor.email}</p>
        </div>

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Telefone</p>
          <p className="text-gray-700">{assignor.phone}</p>
        </div>
      </div>
    </div>
  );
}
