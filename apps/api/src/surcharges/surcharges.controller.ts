import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SurchargesService } from './surcharges.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('surcharges')
@Controller('surcharges')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class SurchargesController {
  constructor(private surchargesService: SurchargesService) {}

  @Get()
  @RequirePermissions('surcharges.approve', 'surcharges.create')
  @ApiOperation({ summary: 'Get all surcharges' })
  async findAll(@Query() query: any) {
    return this.surchargesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('surcharges.approve', 'surcharges.create')
  @ApiOperation({ summary: 'Get surcharge by ID' })
  async findOne(@Param('id') id: string) {
    return this.surchargesService.findById(id);
  }

  @Post()
  @RequirePermissions('surcharges.create')
  @ApiOperation({ summary: 'Create new surcharge' })
  async create(@Body() body: any, @CurrentUser() user: any) {
    return this.surchargesService.create(body, user.id);
  }

  @Post(':id/approve')
  @RequirePermissions('surcharges.approve')
  @ApiOperation({ summary: 'Approve surcharge' })
  async approve(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: any,
  ) {
    return this.surchargesService.approve(id, body.reason || '', user.id);
  }

  @Post(':id/reject')
  @RequirePermissions('surcharges.reject')
  @ApiOperation({ summary: 'Reject surcharge' })
  async reject(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.surchargesService.reject(id, body.reason, user.id);
  }
}
