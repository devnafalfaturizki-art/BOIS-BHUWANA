import { Controller, Get, Post, Put, Param, Body, Patch, UseGuards } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('positions')
@UseGuards(JwtAuthGuard)
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Get()
  findAll() {
    return this.positionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.positionsService.findOne(id);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.positionsService.getHistory(id);
  }

  @Post()
  create(@Body() createPositionDto: any) {
    return this.positionsService.create(createPositionDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updatePositionDto: any) {
    return this.positionsService.update(id, updatePositionDto);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.positionsService.deactivate(id);
  }
}