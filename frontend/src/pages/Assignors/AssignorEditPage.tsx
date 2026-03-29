import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { assignorService } from '../../services/assignor.service';
import { AssignorFormPage } from './AssignorFormPage';

export function AssignorEditPage() {
  const { id } = useParams<{ id: string }>();

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
      <div className="max-w-lg mx-auto space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-red-600">Cedente não encontrado.</p>
        </div>
        <Link to="/assignors" className="text-blue-600 hover:underline text-sm">
          ← Voltar à lista de cedentes
        </Link>
      </div>
    );
  }

  return <AssignorFormPage assignor={assignor} />;
}
