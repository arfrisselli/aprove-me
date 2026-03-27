import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateAssignorDto } from '../../assignor/dto/create-assignor.dto';

export class CreatePayableDto {
  @ApiProperty({ description: 'UUID do recebível' })
  @IsUUID('4', { message: 'id deve ser um UUID válido' })
  @IsNotEmpty({ message: 'id não pode ser vazio' })
  id: string;

  @ApiProperty({ description: 'Valor do recebível' })
  @IsNumber({}, { message: 'value deve ser um número' })
  @IsPositive({ message: 'value deve ser um número positivo' })
  @IsNotEmpty({ message: 'value não pode ser vazio' })
  value: number;

  @ApiProperty({ description: 'Data de emissão do recebível (ISO 8601)' })
  @IsDateString({}, { message: 'emissionDate deve ser uma data válida (ISO 8601)' })
  @IsNotEmpty({ message: 'emissionDate não pode ser vazio' })
  emissionDate: string;

  @ApiProperty({ description: 'UUID do cedente associado' })
  @IsUUID('4', { message: 'assignor deve ser um UUID válido' })
  @IsNotEmpty({ message: 'assignor não pode ser vazio' })
  assignor: string;
}

export class CreatePayableWithAssignorDto {
  @ApiProperty({ type: CreatePayableDto })
  @ValidateNested()
  @Type(() => CreatePayableDto)
  payable: CreatePayableDto;

  @ApiProperty({ type: CreateAssignorDto })
  @ValidateNested()
  @Type(() => CreateAssignorDto)
  assignor: CreateAssignorDto;
}
