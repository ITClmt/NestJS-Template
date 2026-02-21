import { Controller, Body, HttpCode, HttpStatus, Get, Query, DefaultValuePipe, ParseIntPipe, Param, Delete, Patch, ParseUUIDPipe, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/generated/prisma/enums';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtPayload } from 'src/auth/types/jwt-payload.type';

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) { }

    private assertOwnerOrAdmin(user: JwtPayload, targetId: string): void {
        if (user.sub !== targetId && user.role !== Role.ADMIN) {
            throw new ForbiddenException('Vous ne pouvez modifier que votre propre compte');
        }
    }

    @Roles(Role.ADMIN)
    @Get()
    @HttpCode(HttpStatus.OK)
    async findAll(
        @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
        @Query('take', new DefaultValuePipe(10), ParseIntPipe) take: number,
    ) {
        const limit = Math.min(take, 100);

        return this.userService.findAll({
            skip,
            take: limit,
        });
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async findById(@Param('id', ParseUUIDPipe) id: string) {
        return this.userService.findById(id);
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateUserDto: UpdateUserDto,
        @CurrentUser() user: JwtPayload,
    ) {
        this.assertOwnerOrAdmin(user, id);
        return this.userService.update(id, updateUserDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: JwtPayload,
    ): Promise<void> {
        this.assertOwnerOrAdmin(user, id);
        await this.userService.delete(id);
    }
}
