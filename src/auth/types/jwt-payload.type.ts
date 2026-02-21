import { Role } from "src/generated/prisma/enums";

export interface JwtPayload {
    sub: string;
    email: string;
    role: Role;
}