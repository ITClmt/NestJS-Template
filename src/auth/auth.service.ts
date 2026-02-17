import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(private readonly userService: UsersService, private readonly jwtService: JwtService) { }

    async login(loginDto: LoginDto) {
        const user = await this.userService.findByEmail(loginDto.email);
        if (!user) throw new UnauthorizedException('Email ou mot de passe incorrect');

        const isPwdMatch = await argon2.verify(user.password, loginDto.password);
        if (!isPwdMatch) throw new UnauthorizedException('Email ou mot de passe incorrect');

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role
        };

        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }

    async getProfile(id: string) {
        return this.userService.findById(id);
    }
}
