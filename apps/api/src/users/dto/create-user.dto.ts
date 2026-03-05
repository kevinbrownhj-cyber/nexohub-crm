import { IsEmail, IsString, MinLength, IsArray, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ 
    example: 'SecurePass123',
    description: 'La contraseña debe tener al menos 8 caracteres, contener mayúscula, minúscula y número'
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'La contraseña debe contener al menos una letra mayúscula, una letra minúscula y un número',
  })
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'role-id-1', required: false })
  @IsString()
  roleId?: string;
}
