import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) { }

    private async generateAndSaveTokens(userId: string, email: string, role: string) {
        const payload = { sub: userId, email, role };
        const refreshPayload = { sub: userId };

        const accessToken = await this.jwtService.signAsync(payload);

        const refreshToken = await this.jwtService.signAsync(refreshPayload, {
            secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        });

        const hashedRefreshToken = await argon2.hash(refreshToken);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await this.prisma.refreshToken.create({
            data: {
                token: hashedRefreshToken,
                userId,
                expiresAt,
            }
        });

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
        };
    }

    private async findValidRefreshToken(refreshToken: string) {
        let payload: { sub: string };
        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
            });
        } catch {
            throw new UnauthorizedException('Refresh token invalide ou expiré');
        }

        const storedTokens = await this.prisma.refreshToken.findMany({
            where: { userId: payload.sub },
        });

        for (const stored of storedTokens) {
            if (await argon2.verify(stored.token, refreshToken)) {
                return { payload, matchedToken: stored };
            }
        }

        throw new UnauthorizedException('Refresh token révoqué ou inexistant');
    }

    async register(createUserDto: CreateUserDto) {
        const newUser = await this.userService.create(createUserDto);

        return this.generateAndSaveTokens(newUser.id, newUser.email, newUser.role);
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

    async refreshTokens(refreshToken: string) {
        const { payload, matchedToken } = await this.findValidRefreshToken(refreshToken);

        await this.prisma.refreshToken.delete({ where: { id: matchedToken.id } });

        const user = await this.userService.findById(payload.sub);
        return this.generateAndSaveTokens(user.id, user.email, user.role);
    }

    async logout(refreshToken: string) {
        const { matchedToken } = await this.findValidRefreshToken(refreshToken);

        await this.prisma.refreshToken.delete({ where: { id: matchedToken.id } });
    }
}