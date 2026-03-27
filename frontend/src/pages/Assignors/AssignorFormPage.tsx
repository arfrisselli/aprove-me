import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { assignorService } from '../../services/assignor.service';

const assignorSchema = z.object({
  document: z.string().min(1, 'Documento é obrigatório').max(30, 'Máximo 30 caracteres'),
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido')
    .max(140, 'Máximo 140 caracteres'),
  phone: z.string().min(1, 'Telefone é obrigatório').max(20, 'Máximo 20 caracteres'),
  name: z.string().min(1, 'Nome é obrigatório').max(140, 'Máximo 140 caracteres'),
});

type AssignorFormData = z.infer<typeof assignorSchema>;

export function AssignorFormPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssignorFormData>({ resolver: zodResolver(assignorSchema) });

  const mutation = useMutation({
    mutationFn: (data: AssignorFormData) =>
      assignorService.create({ id: uuidv4(), ...data }),
    onSuccess: () => {
      navigate('/payables/new');
    },
  });

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Cadastrar Cedente</h2>

      <form
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5"
        noValidate
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Documento (CPF/CNPJ)
          </label>
          <input
            {...register('document')}
            placeholder="123.456.789-00"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.document && (
            <p className="text-red-500 text-xs mt-1">{errors.document.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
          <input
            {...register('email')}
            type="email"
            placeholder="cedente@empresa.com"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <input
            {...register('phone')}
            placeholder="(11) 99999-9999"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome / Razão Social
          </label>
          <input
            {...register('name')}
            placeholder="Empresa XYZ Ltda"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-red-600 text-sm">Erro ao cadastrar cedente. Tente novamente.</p>
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
            disabled={mutation.isPending}
            className="flex-1 bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {mutation.isPending ? 'Salvando...' : 'Cadastrar Cedente'}
          </button>
        </div>
      </form>
    </div>
  );
}
