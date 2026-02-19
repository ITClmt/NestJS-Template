import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon2 from 'argon2';
import { Prisma } from 'src/generated/prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

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

    private handlePrismaError(error: unknown): never {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new ConflictException('Cet email est déjà utilisé');
        }
        throw error;
    }

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

    // ⚠️ Intentionally returns the password hash — needed for auth verification
    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email }
        });
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
            this.handlePrismaError(error);
        }
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        await this.findById(id);

        const data: Prisma.UserUpdateInput = {};
        if (updateUserDto.email !== undefined) data.email = updateUserDto.email;
        if (updateUserDto.name !== undefined) data.name = updateUserDto.name;
        if (updateUserDto.password !== undefined) {
            data.password = await argon2.hash(updateUserDto.password);
        }

        try {
            return await this.prisma.user.update({
                where: { id },
                data,
                select: userSelect,
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async delete(id: string) {
        await this.findById(id);
        await this.prisma.user.delete({ where: { id } });
    }
}