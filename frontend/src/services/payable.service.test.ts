import { describe, it, expect, vi, beforeEach } from 'vitest';
import { payableService } from './payable.service';
import { api } from './api';
import { CreatePayablePayload, Payable } from '../types';

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockPayable: Payable = {
  id: 'b1ffcd00-1d2c-4af9-bb6d-6bb9bd380a22',
  value: 100.5,
  emissionDate: '2024-01-15T00:00:00.000Z',
  assignorId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
};

describe('payableService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('findAll should return list of payables', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [mockPayable] });
    const result = await payableService.findAll();
    expect(result).toEqual([mockPayable]);
    expect(api.get).toHaveBeenCalledWith('/integrations/payable');
  });

  it('findOne should return a single payable', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockPayable });
    const result = await payableService.findOne(mockPayable.id);
    expect(result).toEqual(mockPayable);
    expect(api.get).toHaveBeenCalledWith(`/integrations/payable/${mockPayable.id}`);
  });

  it('create should post and return created payable', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: mockPayable });

    const payload: CreatePayablePayload = {
      payable: {
        id: mockPayable.id,
        value: mockPayable.value,
        emissionDate: '2024-01-15',
        assignor: mockPayable.assignorId,
      },
      assignor: {
        id: mockPayable.assignorId,
        document: '123',
        email: 'a@a.com',
        phone: '11',
        name: 'Test',
      },
    };

    const result = await payableService.create(payload);
    expect(result).toEqual(mockPayable);
    expect(api.post).toHaveBeenCalledWith('/integrations/payable', payload);
  });

  it('update should put and return updated payable', async () => {
    const updated = { ...mockPayable, value: 200 };
    vi.mocked(api.put).mockResolvedValue({ data: updated });
    const result = await payableService.update(mockPayable.id, { value: 200 });
    expect(result).toEqual(updated);
  });

  it('remove should call delete endpoint', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });
    await payableService.remove(mockPayable.id);
    expect(api.delete).toHaveBeenCalledWith(`/integrations/payable/${mockPayable.id}`);
  });
});
