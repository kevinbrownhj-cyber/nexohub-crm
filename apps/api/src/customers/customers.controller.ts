import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

interface JwtUser {
  id: string;
  email: string;
  roles: string[];
}

@ApiTags('customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  @RequirePermissions('cases.manage')
  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  async findAll(@Query() query: any) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('cases.manage')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer retrieved' })
  async findOne(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Post()
  @RequirePermissions('cases.manage')
  @ApiOperation({ summary: 'Create new customer' })
  @ApiResponse({ status: 201, description: 'Customer created' })
  async create(@Body() dto: CreateCustomerDto, @CurrentUser() user: JwtUser) {
    return this.customersService.create(dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions('cases.manage')
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({ status: 200, description: 'Customer updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.customersService.update(id, dto, user.id);
  }

  @Post(':id/soft-delete')
  @RequirePermissions('cases.manage')
  @ApiOperation({ summary: 'Soft delete customer (recoverable for 30 days)' })
  @ApiResponse({ status: 200, description: 'Customer soft deleted successfully' })
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
  ) {
    await this.customersService.softDelete(id, user.id);
    return { message: 'Customer deleted successfully. Can be restored within 30 days.' };
  }

  @Post(':id/restore')
  @RequirePermissions('cases.manage')
  @ApiOperation({ summary: 'Restore soft deleted customer' })
  @ApiResponse({ status: 200, description: 'Customer restored successfully' })
  async restore(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.customersService.restore(id, user.id);
  }

  @Get('deleted/list')
  @RequirePermissions('cases.manage')
  @ApiOperation({ summary: 'Get all soft deleted customers' })
  @ApiResponse({ status: 200, description: 'Deleted customers retrieved successfully' })
  async getDeleted() {
    return this.customersService.findDeleted();
  }
}
