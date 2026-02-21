import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TokenCleanupService {
  // Le Logger NestJS permet d'afficher des messages dans la console
  // avec le nom du service pour s'y retrouver facilement
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanExpiredTokens() {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() }, // lt = "less than" = antérieur à maintenant
      },
    });

    this.logger.log(`🧹 ${result.count} refresh token(s) expirés supprimés`);
  }
}