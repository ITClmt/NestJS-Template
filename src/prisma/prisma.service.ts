import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

    constructor() {
        // 1. On récupère l'URL
        const connectionString = `${process.env.DATABASE_URL}`;

        // 2. On instancie l'adaptateur
        const adapter = new PrismaPg({ connectionString });

        // 3. On passe l'adaptateur à la classe parente (PrismaClient) via la fonction super()
        super({ adapter });
    }

    // Se lance tout seul au démarrage de l'API
    async onModuleInit() {
        await this.$connect();
    }

    // Se lance tout seul quand on coupe l'API (clean up propre)
    async onModuleDestroy() {
        await this.$disconnect();
    }
}