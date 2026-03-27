import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assignorService } from './assignor.service';
import { api } from './api';
import { Assignor } from '../types';

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockAssignor: Assignor = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  document: '12345678900',
  email: 'test@example.com',
  phone: '11999999999',
  name: 'Test Assignor',
};

describe('assignorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('findAll should return list of assignors', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [mockAssignor] });
    const result = await assignorService.findAll();
    expect(result).toEqual([mockAssignor]);
    expect(api.get).toHaveBeenCalledWith('/integrations/assignor');
  });

  it('findOne should return a single assignor', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockAssignor });
    const result = await assignorService.findOne(mockAssignor.id);
    expect(result).toEqual(mockAssignor);
    expect(api.get).toHaveBeenCalledWith(`/integrations/assignor/${mockAssignor.id}`);
  });

  it('create should post and return created assignor', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: mockAssignor });
    const result = await assignorService.create(mockAssignor);
    expect(result).toEqual(mockAssignor);
    expect(api.post).toHaveBeenCalledWith('/integrations/assignor', mockAssignor);
  });

  it('update should put and return updated assignor', async () => {
    const updated = { ...mockAssignor, name: 'Updated' };
    vi.mocked(api.put).mockResolvedValue({ data: updated });
    const result = await assignorService.update(mockAssignor.id, { name: 'Updated' });
    expect(result).toEqual(updated);
  });

  it('remove should call delete endpoint', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });
    await assignorService.remove(mockAssignor.id);
    expect(api.delete).toHaveBeenCalledWith(`/integrations/assignor/${mockAssignor.id}`);
  });
});
