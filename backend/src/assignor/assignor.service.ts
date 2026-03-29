import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignorDto } from './dto/create-assignor.dto';
import { UpdateAssignorDto } from './dto/update-assignor.dto';
import { parseDocumentOrThrow } from './document.util';

@Injectable()
export class AssignorService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAssignorDto) {
    const existingById = await this.prisma.assignor.findUnique({
      where: { id: dto.id },
    });

    if (existingById) {
      throw new ConflictException(`Cedente com id ${dto.id} já existe`);
    }

    const documentNorm = parseDocumentOrThrow(dto.document);

    const existingByDoc = await this.prisma.assignor.findFirst({
      where: { document: documentNorm },
    });

    if (existingByDoc) {
      throw new ConflictException(
        'Já existe um cedente cadastrado com este CPF/CNPJ.',
      );
    }

    return this.prisma.assignor.create({
      data: {
        ...dto,
        document: documentNorm,
      },
    });
  }

  async findAll() {
    return this.prisma.assignor.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const assignor = await this.prisma.assignor.findUnique({ where: { id } });

    if (!assignor) {
      throw new NotFoundException(`Cedente com id ${id} não encontrado`);
    }

    return assignor;
  }

  async update(id: string, dto: UpdateAssignorDto) {
    await this.findOne(id);

    const { document, email, phone, name } = dto;
    const data: {
      email?: string;
      phone?: string;
      name?: string;
      document?: string;
    } = {};

    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (name !== undefined) data.name = name;

    if (document !== undefined) {
      const documentNorm = parseDocumentOrThrow(document);
      const otherWithSameDoc = await this.prisma.assignor.findFirst({
        where: { document: documentNorm, NOT: { id } },
      });
      if (otherWithSameDoc) {
        throw new ConflictException(
          'Já existe um cedente cadastrado com este CPF/CNPJ.',
        );
      }
      data.document = documentNorm;
    }

    return this.prisma.assignor.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);

    const linked = await this.prisma.payable.count({ where: { assignorId: id } });
    if (linked > 0) {
      throw new ConflictException(
        'Não é possível excluir: existem pagáveis vinculados a este cedente.',
      );
    }

    return this.prisma.assignor.delete({ where: { id } });
  }
}
