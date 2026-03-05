import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInsurerDto } from './dto/create-insurer.dto';

@Injectable()
export class InsurersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.insurer.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(createInsurerDto: CreateInsurerDto) {
    const key = createInsurerDto.name
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_]/g, '');
    
    return this.prisma.insurer.create({
      data: {
        name: createInsurerDto.name,
        key: key,
      },
    });
  }
}
