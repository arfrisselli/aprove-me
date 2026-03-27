import { Test, TestingModule } from '@nestjs/testing';
import { PayableController } from './payable.controller';
import { PayableService } from './payable.service';

describe('PayableController', () => {
  let controller: PayableController;

  const mockAssignor = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    document: '12345678900',
    email: 'test@example.com',
    phone: '11999999999',
    name: 'Test Assignor',
  };

  const mockPayable = {
    id: 'b1ffcd00-1d2c-5fg9-cc7e-7cc0ce491b22',
    value: 100.5,
    emissionDate: new Date('2024-01-15'),
    assignorId: mockAssignor.id,
    assignor: mockAssignor,
  };

  const mockPayableService = {
    create: jest.fn().mockResolvedValue(mockPayable),
    findAll: jest.fn().mockResolvedValue([mockPayable]),
    findOne: jest.fn().mockResolvedValue(mockPayable),
    update: jest.fn().mockResolvedValue({ ...mockPayable, value: 200 }),
    remove: jest.fn().mockResolvedValue(mockPayable),
    processBatch: jest.fn().mockResolvedValue({ batchId: 'batch-1', queued: 3 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayableController],
      providers: [{ provide: PayableService, useValue: mockPayableService }],
    }).compile();

    controller = module.get<PayableController>(PayableController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should call service.create', async () => {
    const dto = {
      payable: {
        id: mockPayable.id,
        value: 100.5,
        emissionDate: '2024-01-15',
        assignor: mockAssignor.id,
      },
      assignor: mockAssignor,
    };
    mockPayableService.create.mockResolvedValue(mockPayable);
    const result = await controller.create(dto);
    expect(mockPayableService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockPayable);
  });

  it('findAll should return all payables', async () => {
    mockPayableService.findAll.mockResolvedValue([mockPayable]);
    const result = await controller.findAll();
    expect(result).toEqual([mockPayable]);
  });

  it('findOne should return a single payable', async () => {
    mockPayableService.findOne.mockResolvedValue(mockPayable);
    const result = await controller.findOne(mockPayable.id);
    expect(result).toEqual(mockPayable);
  });

  it('update should call service.update', async () => {
    const updated = { ...mockPayable, value: 200 };
    mockPayableService.update.mockResolvedValue(updated);
    const result = await controller.update(mockPayable.id, { value: 200 });
    expect(result).toEqual(updated);
  });

  it('remove should call service.remove', async () => {
    mockPayableService.remove.mockResolvedValue(undefined);
    await controller.remove(mockPayable.id);
    expect(mockPayableService.remove).toHaveBeenCalledWith(mockPayable.id);
  });

  it('processBatch should return batchId and queued count', async () => {
    const batch = {
      payables: [
        { id: 'uuid-1', value: 100, emissionDate: '2024-01-01', assignor: mockAssignor.id },
      ],
    };
    mockPayableService.processBatch.mockResolvedValue({ batchId: 'batch-1', queued: 1 });
    const result = await controller.processBatch(batch);
    expect(result).toEqual({ batchId: 'batch-1', queued: 1 });
  });
});
