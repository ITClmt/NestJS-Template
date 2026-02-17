import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './auth.guard';

interface JwtPayload {
    sub: string;
    email: string;
    role: string;
}

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @UseGuards(AuthGuard)
    @Get('profile')
    @HttpCode(HttpStatus.OK)
    async getProfile(@Request() req: { user: JwtPayload }) {
        return this.authService.getProfile(req.user.sub);
    }
}
