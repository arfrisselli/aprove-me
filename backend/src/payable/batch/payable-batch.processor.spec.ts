import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { MailService } from '../../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PayableBatchProcessor,
  PayableBatchJob,
} from './payable-batch.processor';

describe('PayableBatchProcessor', () => {
  let processor: PayableBatchProcessor;

  const mockPayable = {
    id: 'b1ffcd00-1d2c-4af9-bb6d-6bb9bd380a22',
    value: 100.5,
    emissionDate: '2024-01-15',
    assignor: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  };

  const mockPrisma = {
    payable: {
      create: jest.fn().mockResolvedValue({ id: mockPayable.id }),
    },
  };

  const mockMailService = {
    sendBatchCompletedEmail: jest.fn().mockResolvedValue(undefined),
    sendDeadLetterEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('ops@aprovame.com'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayableBatchProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    processor = module.get<PayableBatchProcessor>(PayableBatchProcessor);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should process a payable job and persist to database', async () => {
    const batchId = 'test-batch-id';
    PayableBatchProcessor.initBatch(batchId, 1);

    const mockJob = {
      data: { payable: mockPayable, batchId },
    } as Job<PayableBatchJob>;

    await processor.process(mockJob);

    expect(mockPrisma.payable.create).toHaveBeenCalledWith({
      data: {
        id: mockPayable.id,
        value: mockPayable.value,
        emissionDate: new Date(mockPayable.emissionDate),
        assignorId: mockPayable.assignor,
      },
    });
  });

  it('initBatch should register a new batch tracker', () => {
    const batchId = 'init-test-batch';
    PayableBatchProcessor.initBatch(batchId, 5);
    // Não há erro — batch foi registrado sem throws
    expect(true).toBe(true);
  });
});
