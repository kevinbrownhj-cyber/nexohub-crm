import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { CasesService } from './cases.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('cases')
@Controller('cases')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class CasesController {
  constructor(private casesService: CasesService) {}

  @Get('export/excel')
  @RequirePermissions('cases.read_all')
  @ApiOperation({ summary: 'Export cases to Excel' })
  async exportToExcel(@Query() query: any, @CurrentUser() user: any, @Res() res: Response) {
    const buffer = await this.casesService.exportToExcel(query, user.id, user.permissions);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=casos-${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
  }

  @Get()
  @RequirePermissions('cases.read_all', 'cases.read_assigned')
  @ApiOperation({ summary: 'Get all cases' })
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.casesService.findAll(query, user.id, user.permissions);
  }

  @Get(':id')
  @RequirePermissions('cases.read_all', 'cases.read_assigned')
  @ApiOperation({ summary: 'Get case by ID' })
  async findOne(@Param('id') id: string) {
    return this.casesService.findById(id);
  }

  @Post()
  @RequirePermissions('cases.create')
  @ApiOperation({ summary: 'Create new case' })
  async create(@Body() body: any, @CurrentUser() user: any) {
    return this.casesService.create(body, user.id);
  }

  @Patch(':id')
  @RequirePermissions('cases.edit')
  @ApiOperation({ summary: 'Update case' })
  async update(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.casesService.update(id, body, user.id);
  }

  @Post(':id/assign')
  @RequirePermissions('assignments.manage')
  @ApiOperation({ summary: 'Assign case to user' })
  async assign(
    @Param('id') id: string,
    @Body() body: { userId: string; reason?: string },
    @CurrentUser() user: any,
  ) {
    return this.casesService.assignToUser(id, body.userId, body.reason || '', user.id);
  }

  @Post(':id/status')
  @RequirePermissions('cases.edit')
  @ApiOperation({ summary: 'Update case status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string },
    @CurrentUser() user: any,
  ) {
    return this.casesService.updateStatus(id, body.status, body.reason || '', user.id);
  }

  @Post(':id/notes')
  @RequirePermissions('cases.edit')
  @ApiOperation({ summary: 'Add note to case' })
  async addNote(
    @Param('id') id: string,
    @Body() body: { note: string },
    @CurrentUser() user: any,
  ) {
    return this.casesService.addNote(id, body.note, user.id);
  }

  @Delete(':id')
  @RequirePermissions('cases.soft_delete')
  @ApiOperation({ summary: 'Soft delete case' })
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    await this.casesService.softDelete(id, user.id);
    return { message: 'Case deleted successfully' };
  }

  @Post(':id/restore')
  @RequirePermissions('cases.edit')
  @ApiOperation({ summary: 'Restore soft deleted case' })
  async restore(@Param('id') id: string, @CurrentUser() user: any) {
    return this.casesService.restore(id, user.id);
  }

  @Get('deleted/list')
  @RequirePermissions('cases.read_all')
  @ApiOperation({ summary: 'Get all soft deleted cases' })
  async getDeleted() {
    return this.casesService.findDeleted();
  }

  @Post(':id/surcharge/approve')
  @RequirePermissions('surcharges.approve')
  @ApiOperation({ summary: 'Approve pending surcharge and apply to case' })
  async approveSurcharge(@Param('id') id: string, @CurrentUser() user: any) {
    return this.casesService.approveSurcharge(id, user.id);
  }

  @Post(':id/surcharge/reject')
  @RequirePermissions('surcharges.reject')
  @ApiOperation({ summary: 'Reject pending surcharge' })
  async rejectSurcharge(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: any,
  ) {
    return this.casesService.rejectSurcharge(id, body.reason || '', user.id);
  }
}
