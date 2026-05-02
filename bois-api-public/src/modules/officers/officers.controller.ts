import { Controller, Get, Param } from '@nestjs/common';
import { OfficersService } from './officers.service';

@Controller('officers')
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

  @Get(':id/assignments')
  getAssignments(@Param('id') id: string) {
    return this.officersService.getAssignments(id);
  }
}