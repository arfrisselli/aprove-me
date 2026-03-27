import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { payableService } from '../../services/payable.service';
import { assignorService } from '../../services/assignor.service';
import { Payable } from '../../types';

const payableSchema = z.object({
  value: z.coerce
    .number({ invalid_type_error: 'Valor deve ser um número' })
    .positive('Valor deve ser positivo'),
  emissionDate: z.string().min(1, 'Data de emissão é obrigatória'),
  assignorId: z.string().uuid('Selecione um cedente válido'),
});

type PayableFormData = z.infer<typeof payableSchema>;

interface PayableFormPageProps {
  payable?: Payable;
}

export function PayableFormPage({ payable }: PayableFormPageProps) {
  const navigate = useNavigate();
  const isEditing = Boolean(payable);

  const { data: assignors = [] } = useQuery({
    queryKey: ['assignors'],
    queryFn: assignorService.findAll,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PayableFormData>({
    resolver: zodResolver(payableSchema),
    defaultValues: payable
      ? {
          value: payable.value,
          emissionDate: payable.emissionDate?.slice(0, 10),
          assignorId: payable.assignorId,
        }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: (data: PayableFormData) => {
      if (isEditing && payable) {
        return payableService.update(payable.id, {
          value: data.value,
          emissionDate: data.emissionDate,
          assignorId: data.assignorId,
        });
      }

      const assignor = assignors.find((a) => a.id === data.assignorId);
      if (!assignor) throw new Error('Cedente não encontrado');

      return payableService.create({
        payable: {
          id: uuidv4(),
          value: data.value,
          emissionDate: data.emissionDate,
          assignor: data.assignorId,
        },
        assignor,
      });
    },
    onSuccess: (result) => {
      navigate(`/payables/${result.id}`);
    },
  });

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isEditing ? 'Editar Pagável' : 'Novo Pagável'}
      </h2>

      {assignors.length === 0 && !isEditing && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-5">
          <p className="text-yellow-700 text-sm">
            Nenhum cedente cadastrado.{' '}
            <Link to="/assignors/new" className="underline font-medium">
              Cadastre um cedente primeiro.
            </Link>
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5"
        noValidate
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor (R$)
          </label>
          <input
            {...register('value')}
            type="number"
            step="0.01"
            placeholder="100.00"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.value && (
            <p className="text-red-500 text-xs mt-1">{errors.value.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data de Emissão
          </label>
          <input
            {...register('emissionDate')}
            type="date"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.emissionDate && (
            <p className="text-red-500 text-xs mt-1">{errors.emissionDate.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cedente</label>
          <select
            {...register('assignorId')}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Selecione um cedente...</option>
            {assignors.map((assignor) => (
              <option key={assignor.id} value={assignor.id}>
                {assignor.name} — {assignor.document}
              </option>
            ))}
          </select>
          {errors.assignorId && (
            <p className="text-red-500 text-xs mt-1">{errors.assignorId.message}</p>
          )}
        </div>

        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-red-600 text-sm">Erro ao salvar pagável. Tente novamente.</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || assignors.length === 0}
            className="flex-1 bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {mutation.isPending ? 'Salvando...' : isEditing ? 'Salvar' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </div>
  );
}
