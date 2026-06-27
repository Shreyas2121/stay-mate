import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HostProfile } from './entities/host-profile.entity';
import { Repository } from 'typeorm';
import { HostProfileDto } from './dto/create-host-profile.dto';
import { HostStatus } from './enums/host-profile.enum';

@Injectable()
export class HostProfileService {
  constructor(
    @InjectRepository(HostProfile)
    private readonly hostProfileRepository: Repository<HostProfile>,
  ) {}

  async applyForHosting(userId: string, dto: HostProfileDto) {
    const existingProfile = await this.hostProfileRepository.findOne({
      where: {
        userId,
      },
    });

    const existingStatus = existingProfile?.status;

    if (existingStatus) {
      if (existingStatus === HostStatus.Pending) {
        throw new ConflictException(
          'Your host profile is already pending review',
        );
      }

      if (existingStatus === HostStatus.Verified) {
        throw new ConflictException('Your host profile is already verified');
      }

      if (existingStatus === HostStatus.Rejected) {
        await this.hostProfileRepository.update(existingProfile.id, {
          ...dto,
          submittedAt: new Date(),
          status: HostStatus.Pending,
          rejectionReason: '',
        });

        return {
          message: 'Host profile re-applied for review',
        };
      }
    }

    const saved = this.hostProfileRepository.create({
      userId,
      ...dto,
      submittedAt: new Date(),
      status: HostStatus.Pending,
    });

    await this.hostProfileRepository.save(saved);

    return {
      message: 'Host profile application submitted successfully',
    };
  }

  getStatus(userId: string) {
    return this.hostProfileRepository.findOne({
      where: {
        userId,
      },
      select: {
        id: true,
        status: true,
        rejectionReason: true,
        legalName: true,
        phone: true,
        address: true,
        idType: true,
        idNumber: true,
        bankInfo: true,
      },
    });
  }
}
