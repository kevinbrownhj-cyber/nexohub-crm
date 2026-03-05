import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UserResponseDto } from './dto/user-response.dto';

interface JwtUser {
  id: string;
  email: string;
  roles: string[];
}

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved', type: UserResponseDto })
  async getMe(@CurrentUser() user: JwtUser): Promise<UserResponseDto> {
    return this.usersService.findById(user.id);
  }

  @Get('deleted/list')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Get all soft deleted users' })
  @ApiResponse({ status: 200, description: 'Deleted users retrieved successfully' })
  async getDeleted() {
    return this.usersService.findDeleted();
  }

  @Get(':id')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved', type: UserResponseDto })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }

  @Post()
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created', type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: JwtUser) {
    const newUser = await this.usersService.create(dto, user.id);
    
    // SIEMPRE devolver 201 con estructura consistente
    return {
      success: true,
      data: newUser,
      message: 'Usuario creado exitosamente'
    };
  }

  @Patch(':id')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated', type: UserResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: JwtUser,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, dto, user.id);
  }

  @Post(':id/change-password')
  @ApiOperation({ summary: 'Change own password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  async changePassword(
    @Param('id') id: string,
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: JwtUser,
  ) {
    if (id !== user.id) {
      throw new ForbiddenException('Can only change own password');
    }
    await this.usersService.changePassword(id, dto.currentPassword, dto.newPassword, user.id);
    return { message: 'Password changed successfully' };
  }

  @Post(':id/reset-password')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Reset user password (admin only)' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: { newPassword: string },
    @CurrentUser() user: JwtUser,
  ) {
    await this.usersService.resetPassword(id, dto.newPassword, user.id);
    return { message: 'Password reset successfully' };
  }

  @Post(':id/soft-delete')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Soft delete user (recoverable for 30 days)' })
  @ApiResponse({ status: 200, description: 'User soft deleted successfully' })
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
  ) {
    await this.usersService.softDelete(id, user.id);
    return { 
      success: true,
      message: 'Usuario eliminado exitosamente. Puede recuperarlo en los próximos 30 días.' 
    };
  }

  @Post(':id/restore')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Restore soft deleted user' })
  @ApiResponse({ status: 200, description: 'User restored successfully', type: UserResponseDto })
  async restore(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
  ) {
    const restoredUser = await this.usersService.restore(id, user.id);
    return {
      success: true,
      data: restoredUser,
      message: 'Usuario restaurado exitosamente'
    };
  }

  @Post(':id/permanent-delete')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Permanently delete user (cannot be undone)' })
  @ApiResponse({ status: 200, description: 'User permanently deleted' })
  async permanentDelete(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
  ) {
    await this.usersService.permanentDelete(id, user.id);
    return { message: 'User permanently deleted' };
  }
}
