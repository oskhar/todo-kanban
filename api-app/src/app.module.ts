import { Module } from '@nestjs/common';
import { DatabaseModule } from './config/database.module';
import { ConfigModule } from '@nestjs/config';
import { TaskModule } from './modules/task/task.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TaskModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
