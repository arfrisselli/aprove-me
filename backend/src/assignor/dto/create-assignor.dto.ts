import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateAssignorDto {
  @ApiProperty({ description: 'UUID do cedente' })
  @IsUUID('4', { message: 'id deve ser um UUID válido' })
  @IsNotEmpty({ message: 'id não pode ser vazio' })
  id: string;

  @ApiProperty({ description: 'CPF ou CNPJ do cedente', maxLength: 30 })
  @IsString()
  @IsNotEmpty({ message: 'document não pode ser vazio' })
  @MaxLength(30, { message: 'document deve ter no máximo 30 caracteres' })
  document: string;

  @ApiProperty({ description: 'E-mail do cedente', maxLength: 140 })
  @IsEmail({}, { message: 'email deve ser um e-mail válido' })
  @IsNotEmpty({ message: 'email não pode ser vazio' })
  @MaxLength(140, { message: 'email deve ter no máximo 140 caracteres' })
  email: string;

  @ApiProperty({ description: 'Telefone do cedente', maxLength: 20 })
  @IsString()
  @IsNotEmpty({ message: 'phone não pode ser vazio' })
  @MaxLength(20, { message: 'phone deve ter no máximo 20 caracteres' })
  phone: string;

  @ApiProperty({ description: 'Nome ou razão social do cedente', maxLength: 140 })
  @IsString()
  @IsNotEmpty({ message: 'name não pode ser vazio' })
  @MaxLength(140, { message: 'name deve ter no máximo 140 caracteres' })
  name: string;
}
