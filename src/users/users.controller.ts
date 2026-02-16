import { Controller, Post, Body, HttpCode, HttpStatus, Get, Query, DefaultValuePipe, ParseIntPipe, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) { }

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
    async findById(@Param('id') id: string) {
        return this.userService.findById(id);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createUserDto: CreateUserDto) {
        return this.userService.create(createUserDto);
    }
}
