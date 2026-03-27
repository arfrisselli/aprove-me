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
import { AssignorService } from './assignor.service';
import { CreateAssignorDto } from './dto/create-assignor.dto';
import { UpdateAssignorDto } from './dto/update-assignor.dto';

@ApiTags('assignor')
@ApiBearerAuth()
@Controller('integrations/assignor')
export class AssignorController {
  constructor(private readonly assignorService: AssignorService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra um novo cedente' })
  create(@Body() dto: CreateAssignorDto) {
    return this.assignorService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os cedentes' })
  findAll() {
    return this.assignorService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retorna um cedente pelo id' })
  findOne(@Param('id') id: string) {
    return this.assignorService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um cedente' })
  update(@Param('id') id: string, @Body() dto: UpdateAssignorDto) {
    return this.assignorService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um cedente' })
  remove(@Param('id') id: string) {
    return this.assignorService.remove(id);
  }
}
