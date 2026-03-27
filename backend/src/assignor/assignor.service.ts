import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignorDto } from './dto/create-assignor.dto';
import { UpdateAssignorDto } from './dto/update-assignor.dto';

@Injectable()
export class AssignorService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAssignorDto) {
    const existing = await this.prisma.assignor.findUnique({
      where: { id: dto.id },
    });

    if (existing) {
      throw new ConflictException(`Cedente com id ${dto.id} já existe`);
    }

    return this.prisma.assignor.create({ data: dto });
  }

  async findAll() {
    return this.prisma.assignor.findMany();
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
    return this.prisma.assignor.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.assignor.delete({ where: { id } });
  }
}
