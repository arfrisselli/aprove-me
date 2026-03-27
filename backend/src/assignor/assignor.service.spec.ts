import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AssignorService } from './assignor.service';

describe('AssignorService', () => {
  let service: AssignorService;

  const mockAssignor = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    document: '12345678900',
    email: 'test@example.com',
    phone: '11999999999',
    name: 'Test Assignor',
  };

  const mockPrisma = {
    assignor: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignorService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AssignorService>(AssignorService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an assignor when id is unique', async () => {
      mockPrisma.assignor.findUnique.mockResolvedValue(null);
      mockPrisma.assignor.create.mockResolvedValue(mockAssignor);

      const result = await service.create(mockAssignor);

      expect(result).toEqual(mockAssignor);
      expect(mockPrisma.assignor.create).toHaveBeenCalledWith({ data: mockAssignor });
    });

    it('should throw ConflictException when assignor already exists', async () => {
      mockPrisma.assignor.findUnique.mockResolvedValue(mockAssignor);

      await expect(service.create(mockAssignor)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all assignors', async () => {
      mockPrisma.assignor.findMany.mockResolvedValue([mockAssignor]);

      const result = await service.findAll();

      expect(result).toEqual([mockAssignor]);
    });
  });

  describe('findOne', () => {
    it('should return an assignor by id', async () => {
      mockPrisma.assignor.findUnique.mockResolvedValue(mockAssignor);

      const result = await service.findOne(mockAssignor.id);

      expect(result).toEqual(mockAssignor);
    });

    it('should throw NotFoundException when assignor does not exist', async () => {
      mockPrisma.assignor.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an existing assignor', async () => {
      const updated = { ...mockAssignor, name: 'Updated Name' };
      mockPrisma.assignor.findUnique.mockResolvedValue(mockAssignor);
      mockPrisma.assignor.update.mockResolvedValue(updated);

      const result = await service.update(mockAssignor.id, { name: 'Updated Name' });

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when updating non-existent assignor', async () => {
      mockPrisma.assignor.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an existing assignor', async () => {
      mockPrisma.assignor.findUnique.mockResolvedValue(mockAssignor);
      mockPrisma.assignor.delete.mockResolvedValue(mockAssignor);

      const result = await service.remove(mockAssignor.id);

      expect(result).toEqual(mockAssignor);
    });

    it('should throw NotFoundException when removing non-existent assignor', async () => {
      mockPrisma.assignor.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
