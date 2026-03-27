import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailService } from '../../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePayableDto } from '../dto/create-payable.dto';
import { ConfigService } from '@nestjs/config';

export const PAYABLE_BATCH_QUEUE = 'payable-batch';
export const PAYABLE_DEAD_LETTER_QUEUE = 'payable-dead-letter';

export interface PayableBatchJob {
  payable: CreatePayableDto;
  batchId: string;
}

const batchTracker = new Map<
  string,
  { total: number; success: number; failures: number; processed: number }
>();

@Processor(PAYABLE_BATCH_QUEUE, {
  concurrency: 10,
})
export class PayableBatchProcessor extends WorkerHost {
  private readonly logger = new Logger(PayableBatchProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job<PayableBatchJob>): Promise<void> {
    const { payable, batchId } = job.data;

    await this.prisma.payable.create({
      data: {
        id: payable.id,
        value: payable.value,
        emissionDate: new Date(payable.emissionDate),
        assignorId: payable.assignor,
      },
    });

    this.updateBatchTracker(batchId, true);
    await this.checkBatchCompletion(batchId);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<PayableBatchJob>, error: Error): Promise<void> {
    const { payable, batchId } = job.data;
    const maxAttempts = job.opts.attempts ?? 5;

    if (job.attemptsMade >= maxAttempts) {
      this.logger.error(
        `Pagável ${payable.id} esgotou ${maxAttempts - 1} retentativas. Movendo para fila morta.`,
      );

      const opsEmail = this.configService.get<string>('OPS_EMAIL', 'ops@aprovame.com');
      await this.mailService.sendDeadLetterEmail(opsEmail, payable.id, error.message);

      this.updateBatchTracker(batchId, false);
      await this.checkBatchCompletion(batchId);
    }
  }

  private updateBatchTracker(batchId: string, success: boolean): void {
    const tracker = batchTracker.get(batchId);
    if (!tracker) return;

    tracker.processed += 1;
    if (success) {
      tracker.success += 1;
    } else {
      tracker.failures += 1;
    }

    batchTracker.set(batchId, tracker);
  }

  private async checkBatchCompletion(batchId: string): Promise<void> {
    const tracker = batchTracker.get(batchId);
    if (!tracker) return;

    if (tracker.processed >= tracker.total) {
      this.logger.log(
        `Lote ${batchId} concluído — sucesso: ${tracker.success}, falhas: ${tracker.failures}`,
      );

      const opsEmail = this.configService.get<string>('OPS_EMAIL', 'ops@aprovame.com');
      await this.mailService.sendBatchCompletedEmail(
        opsEmail,
        batchId,
        tracker.success,
        tracker.failures,
      );

      batchTracker.delete(batchId);
    }
  }

  static initBatch(batchId: string, total: number): void {
    batchTracker.set(batchId, { total, success: 0, failures: 0, processed: 0 });
  }
}
