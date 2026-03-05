import { Controller, Get, Post, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('billing')
@Controller('billing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get('ready-cases')
  @RequirePermissions('billing.prepare')
  @ApiOperation({ summary: 'Get cases ready to invoice' })
  async getReadyCases(@Query() query: any) {
    return this.billingService.getReadyCases(query);
  }

  @Get('invoices')
  @RequirePermissions('billing.prepare', 'billing.issue')
  @ApiOperation({ summary: 'Get all invoices' })
  async findAllInvoices(@Query() query: any) {
    return this.billingService.findAllInvoices(query);
  }

  @Get('invoices/:id')
  @RequirePermissions('billing.prepare', 'billing.issue')
  @ApiOperation({ summary: 'Get invoice by ID' })
  async findInvoice(@Param('id') id: string) {
    return this.billingService.findInvoiceById(id);
  }

  @Post('invoices')
  @RequirePermissions('billing.prepare')
  @ApiOperation({ summary: 'Create new invoice' })
  async createInvoice(@Body() body: any, @CurrentUser() user: any) {
    return this.billingService.createInvoice(body, user.id);
  }

  @Post('invoices/:id/issue')
  @RequirePermissions('billing.issue')
  @ApiOperation({ summary: 'Issue invoice' })
  async issueInvoice(@Param('id') id: string, @CurrentUser() user: any) {
    return this.billingService.issueInvoice(id, user.id);
  }

  @Get('invoices/:id/export')
  @RequirePermissions('billing.export')
  @ApiOperation({ summary: 'Export invoice to Excel' })
  async exportInvoice(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.billingService.exportToExcel(id);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.xlsx`);
    res.send(buffer);
  }
}
