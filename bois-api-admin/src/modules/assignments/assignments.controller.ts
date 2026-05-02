import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('assignments')
@UseGuards(JwtAuthGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get('active')
  findActive() {
    return this.assignmentsService.findActive();
  }

  @Get('history')
  findHistory() {
    return this.assignmentsService.findHistory();
  }

  @Post()
  create(@Body() createAssignmentDto: any) {
    // Assume userId from JWT, for simplicity
    return this.assignmentsService.create(createAssignmentDto, 'user-id-placeholder');
  }

  @Patch(':id/close')
  close(@Param('id') id: string) {
    return this.assignmentsService.close(id, 'user-id-placeholder');
  }
}