import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(private readonly userService: UsersService, private readonly jwtService: JwtService, private readonly configService: ConfigService, private readonly prisma: PrismaService) { }

    private async generateAndSaveTokens(userId: string, email: string, role: string) {
        const payload = { sub: userId, email, role };

        const accessToken = await this.jwtService.signAsync(payload);

        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        });

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await this.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: userId,
                expiresAt: expiresAt,
            }
        });

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
        };
    }

    async login(loginDto: LoginDto) {
        const user = await this.userService.findByEmail(loginDto.email);
        if (!user) throw new UnauthorizedException('Email ou mot de passe incorrect');

        const isPwdMatch = await argon2.verify(user.password, loginDto.password);
        if (!isPwdMatch) throw new UnauthorizedException('Email ou mot de passe incorrect');

        return this.generateAndSaveTokens(user.id, user.email, user.role);
    }

    async getProfile(id: string) {
        return this.userService.findById(id);
    }
}
