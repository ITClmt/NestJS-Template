import { IsEmail, IsNotEmpty, IsString } from "class-validator";

// login.dto.ts — Simplifié
export class LoginDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}