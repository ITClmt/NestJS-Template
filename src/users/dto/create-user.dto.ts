import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, Matches } from "class-validator";

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsOptional()
    @MinLength(3, { message: 'Name must be at least 3 characters long' })
    @MaxLength(20, { message: 'Name must be at most 20 characters long' })
    name: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @MaxLength(20, { message: 'Password must be at most 20 characters long' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
        message: 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
    })
    password: string;
}