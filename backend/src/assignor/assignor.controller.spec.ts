import { Test, TestingModule } from '@nestjs/testing';
import { AssignorController } from './assignor.controller';
import { AssignorService } from './assignor.service';

describe('AssignorController', () => {
  let controller: AssignorController;

  const mockAssignor = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    document: '12345678900',
    email: 'test@example.com',
    phone: '11999999999',
    name: 'Test Assignor',
  };

  const mockAssignorService = {
    create: jest.fn().mockResolvedValue(mockAssignor),
    findAll: jest.fn().mockResolvedValue([mockAssignor]),
    findOne: jest.fn().mockResolvedValue(mockAssignor),
    update: jest.fn().mockResolvedValue({ ...mockAssignor, name: 'Updated' }),
    remove: jest.fn().mockResolvedValue(mockAssignor),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignorController],
      providers: [{ provide: AssignorService, useValue: mockAssignorService }],
    }).compile();

    controller = module.get<AssignorController>(AssignorController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should call service.create', async () => {
    mockAssignorService.create.mockResolvedValue(mockAssignor);
    const result = await controller.create(mockAssignor);
    expect(mockAssignorService.create).toHaveBeenCalledWith(mockAssignor);
    expect(result).toEqual(mockAssignor);
  });

  it('findAll should return all assignors', async () => {
    mockAssignorService.findAll.mockResolvedValue([mockAssignor]);
    const result = await controller.findAll();
    expect(result).toEqual([mockAssignor]);
  });

  it('findOne should return a single assignor', async () => {
    mockAssignorService.findOne.mockResolvedValue(mockAssignor);
    const result = await controller.findOne(mockAssignor.id);
    expect(mockAssignorService.findOne).toHaveBeenCalledWith(mockAssignor.id);
    expect(result).toEqual(mockAssignor);
  });

  it('update should call service.update', async () => {
    const updated = { ...mockAssignor, name: 'Updated' };
    mockAssignorService.update.mockResolvedValue(updated);
    const result = await controller.update(mockAssignor.id, { name: 'Updated' });
    expect(result).toEqual(updated);
  });

  it('remove should call service.remove', async () => {
    mockAssignorService.remove.mockResolvedValue(mockAssignor);
    await controller.remove(mockAssignor.id);
    expect(mockAssignorService.remove).toHaveBeenCalledWith(mockAssignor.id);
  });
});
