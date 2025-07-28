import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participant } from 'src/common/models/types/participant.entity';
import { UserController } from './api/user.controller';
import { UserService } from './api/user.service';
import { User } from 'src/common/models/types/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Event, Participant])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
