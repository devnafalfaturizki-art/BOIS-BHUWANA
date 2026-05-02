import { Controller, Get, Param } from '@nestjs/common';
import { PositionsService } from './positions.service';

@Controller('positions')
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

  @Get(':id/current-officer')
  getCurrentOfficer(@Param('id') id: string) {
    return this.positionsService.getCurrentOfficer(id);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.positionsService.getHistory(id);
  }
}