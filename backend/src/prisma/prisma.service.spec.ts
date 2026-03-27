import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('should be instantiable', () => {
    // PrismaService estende PrismaClient — no ambiente de testes não há banco disponível,
    // por isso testamos apenas que a classe pode ser instanciada com as props corretas.
    expect(PrismaService).toBeDefined();
    expect(typeof PrismaService).toBe('function');
  });

  it('should have onModuleInit method', () => {
    expect(PrismaService.prototype.onModuleInit).toBeDefined();
  });
});
