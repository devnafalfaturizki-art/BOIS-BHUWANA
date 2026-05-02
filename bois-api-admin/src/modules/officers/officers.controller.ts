import { Controller, Get, Post, Put, Param, Body, Patch, UseGuards } from '@nestjs/common';
import { OfficersService } from './officers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('officers')
@UseGuards(JwtAuthGuard)
export class OfficersController {
  constructor(private readonly officersService: OfficersService) {}

  @Get()
  findAll() {
    return this.officersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.officersService.findOne(id);
  }

  @Post()
  create(@Body() createOfficerDto: any) {
    return this.officersService.create(createOfficerDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateOfficerDto: any) {
    return this.officersService.update(id, updateOfficerDto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.officersService.updateStatus(id, body.status);
  }
}