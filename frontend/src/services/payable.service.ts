import { api } from './api';
import { CreatePayablePayload, Payable } from '../types';

export const payableService = {
  async findAll(): Promise<Payable[]> {
    const { data } = await api.get<Payable[]>('/integrations/payable');
    return data;
  },

  async findOne(id: string): Promise<Payable> {
    const { data } = await api.get<Payable>(`/integrations/payable/${id}`);
    return data;
  },

  async create(payload: CreatePayablePayload): Promise<Payable> {
    const { data } = await api.post<Payable>('/integrations/payable', payload);
    return data;
  },

  async update(id: string, payable: Partial<Payable>): Promise<Payable> {
    const { data } = await api.put<Payable>(`/integrations/payable/${id}`, payable);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/integrations/payable/${id}`);
  },
};
