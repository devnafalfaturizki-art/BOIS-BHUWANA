import { Controller, Get, Query } from '@nestjs/common';

@Controller('search')
export class SearchController {
  @Get()
  search(@Query() query) {
    // Placeholder for search implementation
    return { message: 'Search not implemented yet', query };
  }
}