import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  }),
}));

describe('MailService', () => {
  let service: MailService;

  const mockConfigService = {
    get: jest.fn((key: string, fallback?: string) => fallback ?? 'test'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sendBatchCompletedEmail should not throw', async () => {
    await expect(
      service.sendBatchCompletedEmail('ops@test.com', 'batch-1', 10, 0),
    ).resolves.not.toThrow();
  });

  it('sendDeadLetterEmail should not throw', async () => {
    await expect(
      service.sendDeadLetterEmail('ops@test.com', 'payable-1', 'DB connection failed'),
    ).resolves.not.toThrow();
  });
});
