import { Controller, Body, HttpCode, HttpStatus, Get, Query, DefaultValuePipe, ParseIntPipe, Param, Delete, Patch, ParseUUIDPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/generated/prisma/enums';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/guards/role.guard';

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) { }

    @UseGuards(RolesGuard)
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
    async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.userService.update(id, updateUserDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        await this.userService.delete(id);
    }
}
