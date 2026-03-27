import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreatePayableDto } from './create-payable.dto';

export class BatchPayableDto {
  @ApiProperty({
    type: [CreatePayableDto],
    description: 'Lista de pagáveis (máximo 10.000)',
  })
  @IsArray({ message: 'payables deve ser um array' })
  @ArrayMinSize(1, { message: 'payables deve ter ao menos 1 item' })
  @ArrayMaxSize(10000, { message: 'payables deve ter no máximo 10.000 itens' })
  @ValidateNested({ each: true })
  @Type(() => CreatePayableDto)
  payables: CreatePayableDto[];
}
