import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { payableService } from '../../services/payable.service';
import { PayableFormPage } from './PayableFormPage';

export function PayableEditPage() {
  const { id } = useParams<{ id: string }>();

  const { data: payable, isLoading } = useQuery({
    queryKey: ['payable', id],
    queryFn: () => payableService.findOne(id!),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <PayableFormPage payable={payable} />;
}
