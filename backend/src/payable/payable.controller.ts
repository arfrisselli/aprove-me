import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BatchPayableDto } from './dto/batch-payable.dto';
import { CreatePayableWithAssignorDto } from './dto/create-payable.dto';
import { UpdatePayableDto } from './dto/update-payable.dto';
import { PayableService } from './payable.service';

@ApiTags('payable')
@ApiBearerAuth()
@Controller('integrations/payable')
export class PayableController {
  constructor(private readonly payableService: PayableService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra um novo pagável junto com o cedente' })
  create(@Body() dto: CreatePayableWithAssignorDto) {
    return this.payableService.create(dto);
  }

  @Post('batch')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Envia um lote de pagáveis para processamento assíncrono' })
  processBatch(@Body() dto: BatchPayableDto) {
    return this.payableService.processBatch(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os pagáveis' })
  findAll() {
    return this.payableService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retorna um pagável pelo id' })
  findOne(@Param('id') id: string) {
    return this.payableService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um pagável' })
  update(@Param('id') id: string, @Body() dto: UpdatePayableDto) {
    return this.payableService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um pagável' })
  remove(@Param('id') id: string) {
    return this.payableService.remove(id);
  }
}
