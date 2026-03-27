import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST', 'localhost'),
      port: this.configService.get<number>('MAIL_PORT', 1025),
      secure: false,
    });
  }

  async sendBatchCompletedEmail(
    to: string,
    batchId: string,
    success: number,
    failures: number,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM', 'noreply@aprovame.com'),
        to,
        subject: `Lote ${batchId} processado`,
        html: `
          <h2>Processamento de lote concluído</h2>
          <p><strong>Lote ID:</strong> ${batchId}</p>
          <p><strong>Sucesso:</strong> ${success}</p>
          <p><strong>Falhas:</strong> ${failures}</p>
          <p>Total processado: ${success + failures}</p>
        `,
      });
    } catch (error) {
      this.logger.error('Erro ao enviar e-mail de conclusão de lote', error);
    }
  }

  async sendDeadLetterEmail(
    to: string,
    payableId: string,
    reason: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM', 'noreply@aprovame.com'),
        to,
        subject: `[ALERTA] Pagável ${payableId} movido para fila morta`,
        html: `
          <h2>Item na Fila Morta</h2>
          <p>Um pagável não pôde ser processado após 4 tentativas e foi movido para a fila morta.</p>
          <p><strong>Pagável ID:</strong> ${payableId}</p>
          <p><strong>Motivo:</strong> ${reason}</p>
          <p>Por favor, verifique o item manualmente.</p>
        `,
      });
    } catch (error) {
      this.logger.error('Erro ao enviar e-mail de fila morta', error);
    }
  }
}
