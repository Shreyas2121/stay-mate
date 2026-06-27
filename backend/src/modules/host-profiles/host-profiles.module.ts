import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HostProfile } from './entities/host-profile.entity';
import { HostProfileService } from './host-profile.service';
import { HostProfilesController } from './host-profiles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HostProfile])],
  controllers: [HostProfilesController],
  providers: [HostProfileService],
  exports: [HostProfileService],
})
export class HostProfilesModule {}
