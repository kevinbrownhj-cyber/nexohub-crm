import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InsurersService } from './insurers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateInsurerDto } from './dto/create-insurer.dto';

@ApiTags('insurers')
@Controller('insurers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InsurersController {
  constructor(private insurersService: InsurersService) {}

  @Get()
  async findAll() {
    return this.insurersService.findAll();
  }

  @Post()
  async create(@Body() createInsurerDto: CreateInsurerDto) {
    return this.insurersService.create(createInsurerDto);
  }
}
