import { Controller, Get, Post, Param, Body, UseGuards, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ImportsService } from './imports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('imports')
@Controller('imports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ImportsController {
  constructor(private importsService: ImportsService) {}

  @Get()
  @RequirePermissions('imports.preview')
  async findAll() {
    return this.importsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('imports.preview')
  async findOne(@Param('id') id: string) {
    return this.importsService.findById(id);
  }

  @Post('process-file')
  @RequirePermissions('imports.run')
  @UseInterceptors(FileInterceptor('file'))
  async processFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('insurerId') insurerId: string,
  ) {
    return this.importsService.processFile(file, insurerId);
  }

  @Post('confirm')
  @RequirePermissions('imports.run')
  async confirmImport(@Body() body: { insurerId: string; cases: any[] }) {
    return this.importsService.confirmImport(body.insurerId, body.cases);
  }

  @Get('template/download')
  @RequirePermissions('imports.preview')
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.importsService.generateTemplate();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla-importacion-casos.xlsx');
    res.send(buffer);
  }
}
