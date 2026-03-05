import { ApiProperty } from '@nestjs/swagger';

export class PermissionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  key!: string;
}

export class RoleDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  key!: string;

  @ApiProperty({ type: [PermissionDto] })
  permissions!: PermissionDto[];
}

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: RoleDto, nullable: true })
  role!: RoleDto | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
