import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { useErrorToast } from '../../components/ErrorToastProvider';
import { assignorService } from '../../services/assignor.service';
import type { Assignor } from '../../types';
import { getApiErrorMessage } from '../../utils/apiError';

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

/** Formata CPF (11 dígitos) ou CNPJ (14) conforme o usuário digita. */
function maskCpfCnpj(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 11) {
    const d = digits.slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  const d = digits.slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** Exibe documento armazenado (só dígitos) com máscara no formulário. */
function documentDigitsToMasked(stored: string): string {
  return maskCpfCnpj(stored.replace(/\D/g, ''));
}

/** DDD = 2 primeiros dígitos; fixo 8 dígitos (10 total) ou celular 9 dígitos (11 total). */
function maskPhoneBr(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (d.length <= 10) {
    if (rest.length <= 4) return `(${ddd}) ${rest}`;
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4, 8)}`;
  }
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
}

interface AssignorFormPageProps {
  assignor?: Assignor;
}

export function AssignorFormPage({ assignor }: AssignorFormPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showError } = useErrorToast();
  const isEditing = Boolean(assignor);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AssignorFormData>({
    resolver: zodResolver(assignorSchema),
    defaultValues: assignor
      ? {
          document: documentDigitsToMasked(assignor.document),
          email: assignor.email,
          phone: maskPhoneBr(assignor.phone.replace(/\D/g, '')),
          name: assignor.name,
        }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: (data: AssignorFormData) => {
      if (isEditing && assignor) {
        return assignorService.update(assignor.id, {
          document: data.document,
          email: data.email,
          phone: data.phone,
          name: data.name,
        });
      }
      return assignorService.create({ id: uuidv4(), ...data });
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({
        queryKey: ['assignors'],
        refetchType: 'all',
      });
      if (isEditing) {
        await queryClient.invalidateQueries({ queryKey: ['assignor', saved.id] });
        navigate(`/assignors/${saved.id}`);
      } else {
        navigate('/assignors');
      }
    },
    onError: (err) => {
      showError(
        getApiErrorMessage(
          err,
          isEditing
            ? 'Erro ao atualizar cedente. Tente novamente.'
            : 'Erro ao cadastrar cedente. Tente novamente.',
        ),
      );
    },
  });

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isEditing ? 'Editar Cedente' : 'Cadastrar Cedente'}
      </h2>

      <form
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5"
        noValidate
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Documento (CPF/CNPJ)
          </label>
          <Controller
            name="document"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                inputMode="numeric"
                autoComplete="off"
                placeholder="123.456.789-00 ou 12.345.678/0001-90"
                onChange={(e) => field.onChange(maskCpfCnpj(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
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
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="(11) 99999-9999"
                onChange={(e) => field.onChange(maskPhoneBr(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
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

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(isEditing ? `/assignors/${assignor!.id}` : '/assignors')}
            className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {mutation.isPending
              ? 'Salvando...'
              : isEditing
                ? 'Salvar'
                : 'Cadastrar Cedente'}
          </button>
        </div>
      </form>
    </div>
  );
}
