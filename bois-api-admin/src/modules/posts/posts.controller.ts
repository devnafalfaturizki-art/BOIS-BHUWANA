import { Controller, Get, Post, Put, Param, Body, Patch, Delete, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Post()
  create(@Body() createPostDto: any) {
    return this.postsService.create(createPostDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updatePostDto: any) {
    return this.postsService.update(id, updatePostDto);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.postsService.publish(id);
  }

  @Patch(':id/archive')
  archive(@Param('id') id: string) {
    return this.postsService.archive(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }
}