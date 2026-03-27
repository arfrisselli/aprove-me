import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AssignorModule } from '../assignor/assignor.module';
import { MailModule } from '../mail/mail.module';
import { PayableBatchProcessor, PAYABLE_BATCH_QUEUE } from './batch/payable-batch.processor';
import { PayableController } from './payable.controller';
import { PayableService } from './payable.service';

@Module({
  imports: [
    AssignorModule,
    MailModule,
    BullModule.registerQueue({ name: PAYABLE_BATCH_QUEUE }),
  ],
  controllers: [PayableController],
  providers: [PayableService, PayableBatchProcessor],
})
export class PayableModule {}
