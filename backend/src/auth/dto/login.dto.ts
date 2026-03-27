import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'aprovame' })
  @IsNotEmpty({ message: 'login não pode ser vazio' })
  @IsString()
  login: string;

  @ApiProperty({ example: 'aprovame' })
  @IsNotEmpty({ message: 'password não pode ser vazio' })
  @IsString()
  password: string;
}
