import { IsString, MinLength, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword123!' })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({ 
    example: 'NewPassword123',
    description: 'La contraseña debe tener al menos 8 caracteres, contener mayúscula, minúscula y número'
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'La contraseña debe contener al menos una letra mayúscula, una letra minúscula y un número',
  })
  @IsNotEmpty()
  newPassword!: string;
}
