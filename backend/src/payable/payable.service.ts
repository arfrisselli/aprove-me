import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AssignorService } from '../assignor/assignor.service';
import { CreatePayableWithAssignorDto } from './dto/create-payable.dto';
import { UpdatePayableDto } from './dto/update-payable.dto';
import { BatchPayableDto } from './dto/batch-payable.dto';
import {
  PAYABLE_BATCH_QUEUE,
  PayableBatchProcessor,
} from './batch/payable-batch.processor';

@Injectable()
export class PayableService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assignorService: AssignorService,
    @InjectQueue(PAYABLE_BATCH_QUEUE) private readonly batchQueue: Queue,
  ) {}

  async create(dto: CreatePayableWithAssignorDto) {
    const existing = await this.prisma.payable.findUnique({
      where: { id: dto.payable.id },
    });

    if (existing) {
      throw new ConflictException(`Pagável com id ${dto.payable.id} já existe`);
    }

    let assignor = await this.prisma.assignor.findUnique({
      where: { id: dto.assignor.id },
    });

    if (!assignor) {
      assignor = await this.assignorService.create(dto.assignor);
    }

    const payable = await this.prisma.payable.create({
      data: {
        id: dto.payable.id,
        value: dto.payable.value,
        emissionDate: new Date(dto.payable.emissionDate),
        assignorId: assignor.id,
      },
      include: { assignor: true },
    });

    return payable;
  }

  async findAll() {
    return this.prisma.payable.findMany({ include: { assignor: true } });
  }

  async findOne(id: string) {
    const payable = await this.prisma.payable.findUnique({
      where: { id },
      include: { assignor: true },
    });

    if (!payable) {
      throw new NotFoundException(`Pagável com id ${id} não encontrado`);
    }

    return payable;
  }

  async update(id: string, dto: UpdatePayableDto) {
    await this.findOne(id);
    return this.prisma.payable.update({
      where: { id },
      data: {
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.emissionDate !== undefined && {
          emissionDate: new Date(dto.emissionDate),
        }),
        ...(dto.assignor !== undefined && { assignorId: dto.assignor }),
      },
      include: { assignor: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.payable.delete({ where: { id } });
  }

  async processBatch(dto: BatchPayableDto): Promise<{ batchId: string; queued: number }> {
    const batchId = randomUUID();
    const { payables } = dto;

    PayableBatchProcessor.initBatch(batchId, payables.length);

    const jobs = payables.map((payable) => ({
      name: 'process-payable',
      data: { payable, batchId },
      opts: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }));

    await this.batchQueue.addBulk(jobs);

    return { batchId, queued: payables.length };
  }
}
