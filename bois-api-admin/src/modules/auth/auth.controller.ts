import { Controller, Request, Post, UseGuards, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Body() body) {
    return this.authService.login(req.user, req.ip, req.get('User-Agent'));
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Request() req) {
    return req.user;
  }

  @Post('logout')
  async logout(@Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = this.authService['jwtService'].decode(token);
      if (decoded && decoded.sub) {
        await this.authService.logout(decoded.sub, req.ip);
      }
    }
    return { message: 'Logged out' };
  }
}