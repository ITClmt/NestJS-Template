import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon2 from 'argon2';
import { Prisma } from 'src/generated/prisma/client';

const userSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    createdAt: true,
    updatedAt: true,
};

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(params: { skip?: number; take?: number }) {
        return this.prisma.user.findMany({
            ...params,
            select: userSelect,
            orderBy: { createdAt: 'desc' }
        });
    }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: userSelect
        });
        if (!user) throw new NotFoundException('Utilisateur non trouvé');
        return user;
    }

    async create(createUserDto: CreateUserDto) {
        const { email, password, name } = createUserDto;

        const hashedPassword = await argon2.hash(password);

        try {
            return await this.prisma.user.create({
                data: { email, password: hashedPassword, name },
                select: userSelect
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('Cet email est déjà utilisé');
            }
            throw error;
        }
    }
}