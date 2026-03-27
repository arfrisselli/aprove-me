import { api } from './api';
import { Assignor } from '../types';

export const assignorService = {
  async findAll(): Promise<Assignor[]> {
    const { data } = await api.get<Assignor[]>('/integrations/assignor');
    return data;
  },

  async findOne(id: string): Promise<Assignor> {
    const { data } = await api.get<Assignor>(`/integrations/assignor/${id}`);
    return data;
  },

  async create(assignor: Assignor): Promise<Assignor> {
    const { data } = await api.post<Assignor>('/integrations/assignor', assignor);
    return data;
  },

  async update(id: string, assignor: Partial<Assignor>): Promise<Assignor> {
    const { data } = await api.put<Assignor>(`/integrations/assignor/${id}`, assignor);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/integrations/assignor/${id}`);
  },
};
