import { ConflictException, NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AssignorService } from '../assignor/assignor.service';
import { PayableService } from './payable.service';
import { PAYABLE_BATCH_QUEUE } from './batch/payable-batch.processor';

describe('PayableService', () => {
  let service: PayableService;

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

  const mockPrisma = {
    payable: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    assignor: {
      findUnique: jest.fn(),
    },
  };

  const mockAssignorService = {
    create: jest.fn().mockResolvedValue(mockAssignor),
  };

  const mockQueue = {
    addBulk: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayableService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AssignorService, useValue: mockAssignorService },
        { provide: getQueueToken(PAYABLE_BATCH_QUEUE), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<PayableService>(PayableService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      payable: {
        id: mockPayable.id,
        value: 100.5,
        emissionDate: '2024-01-15',
        assignor: mockAssignor.id,
      },
      assignor: mockAssignor,
    };

    it('should create payable and assignor when both are new', async () => {
      mockPrisma.payable.findUnique.mockResolvedValue(null);
      mockPrisma.assignor.findUnique.mockResolvedValue(null);
      mockAssignorService.create.mockResolvedValue(mockAssignor);
      mockPrisma.payable.create.mockResolvedValue(mockPayable);

      const result = await service.create(createDto);

      expect(result).toEqual(mockPayable);
      expect(mockAssignorService.create).toHaveBeenCalledWith(createDto.assignor);
    });

    it('should reuse existing assignor if already persisted', async () => {
      mockPrisma.payable.findUnique.mockResolvedValue(null);
      mockPrisma.assignor.findUnique.mockResolvedValue(mockAssignor);
      mockPrisma.payable.create.mockResolvedValue(mockPayable);

      await service.create(createDto);

      expect(mockAssignorService.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if payable already exists', async () => {
      mockPrisma.payable.findUnique.mockResolvedValue(mockPayable);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return a payable by id', async () => {
      mockPrisma.payable.findUnique.mockResolvedValue(mockPayable);

      const result = await service.findOne(mockPayable.id);

      expect(result).toEqual(mockPayable);
    });

    it('should throw NotFoundException when payable does not exist', async () => {
      mockPrisma.payable.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all payables', async () => {
      mockPrisma.payable.findMany.mockResolvedValue([mockPayable]);

      const result = await service.findAll();

      expect(result).toEqual([mockPayable]);
    });
  });

  describe('update', () => {
    it('should update an existing payable', async () => {
      const updated = { ...mockPayable, value: 200 };
      mockPrisma.payable.findUnique.mockResolvedValue(mockPayable);
      mockPrisma.payable.update.mockResolvedValue(updated);

      const result = await service.update(mockPayable.id, { value: 200 });

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when updating non-existent payable', async () => {
      mockPrisma.payable.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', { value: 200 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete an existing payable', async () => {
      mockPrisma.payable.findUnique.mockResolvedValue(mockPayable);
      mockPrisma.payable.delete.mockResolvedValue(mockPayable);

      const result = await service.remove(mockPayable.id);

      expect(result).toEqual(mockPayable);
    });

    it('should throw NotFoundException when removing non-existent payable', async () => {
      mockPrisma.payable.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('processBatch', () => {
    it('should enqueue all payables and return batchId and count', async () => {
      const batchDto = {
        payables: [
          {
            id: 'uuid-1',
            value: 100,
            emissionDate: '2024-01-01',
            assignor: mockAssignor.id,
          },
        ],
      };

      mockQueue.addBulk.mockResolvedValue([]);

      const result = await service.processBatch(batchDto);

      expect(result.queued).toBe(1);
      expect(result.batchId).toBeDefined();
      expect(mockQueue.addBulk).toHaveBeenCalled();
    });
  });
});
