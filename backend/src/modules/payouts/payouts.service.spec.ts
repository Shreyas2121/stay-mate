import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { BookingStatus } from '../bookings/enums/booking.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/enums/notification.enum';
import { BookingEarning } from '../payments/entities/booking-earning.entity';
import { EarningStatus } from '../payments/enums/payment.enum';
import { Payout } from './entities/payout.entity';
import { PayoutStatus } from './enums/payout.enum';
import { PayoutsService } from './payouts.service';

function createQueryRunnerMock() {
  let payoutCounter = 0;

  return {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      create: jest.fn((_entity, value) => value),
      save: jest.fn(async (_entity, value) => {
        if (!value.id && value.totalAmount !== undefined) {
          payoutCounter += 1;
          return { ...value, id: `payout-${payoutCounter}` };
        }
        return value;
      }),
    },
  };
}

function createPayoutQueryBuilder(result: unknown) {
  return {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(result),
  };
}

describe('PayoutsService', () => {
  let service: PayoutsService;
  let earningRepository: {
    find: jest.Mock;
    createQueryBuilder: jest.Mock;
    manager: { createQueryBuilder: jest.Mock };
  };
  let payoutRepository: {
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let dataSource: { createQueryRunner: jest.Mock };
  let notificationsService: { createForUser: jest.Mock };
  let queryRunner: ReturnType<typeof createQueryRunnerMock>;

  beforeEach(async () => {
    queryRunner = createQueryRunnerMock();
    earningRepository = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
      manager: { createQueryBuilder: jest.fn() },
    };
    payoutRepository = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    dataSource = { createQueryRunner: jest.fn(() => queryRunner) };
    notificationsService = { createForUser: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayoutsService,
        {
          provide: getRepositoryToken(BookingEarning),
          useValue: earningRepository,
        },
        { provide: getRepositoryToken(Payout), useValue: payoutRepository },
        { provide: DataSource, useValue: dataSource },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get(PayoutsService);
  });

  it('groups eligible earnings by host and moves them into pending payouts', async () => {
    const eligibleEarnings = [
      {
        id: 'earning-1',
        status: EarningStatus.Unpaid,
        hostAmount: 100,
        host: { id: 'host-1' },
        booking: { status: BookingStatus.Completed },
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
      {
        id: 'earning-2',
        status: EarningStatus.Unpaid,
        hostAmount: 50.25,
        host: { id: 'host-1' },
        booking: { status: BookingStatus.Completed },
        createdAt: new Date('2026-01-02T00:00:00Z'),
      },
      {
        id: 'earning-3',
        status: EarningStatus.Unpaid,
        hostAmount: 80,
        host: { id: 'host-2' },
        booking: { status: BookingStatus.Completed },
        createdAt: new Date('2026-01-03T00:00:00Z'),
      },
    ] as BookingEarning[];
    earningRepository.find.mockResolvedValue(eligibleEarnings);

    const result = await service.generatePayouts();

    expect(result.payoutsCreated).toBe(2);
    expect(result.earningsMoved).toBe(3);
    expect(result.totalAmount).toBe(230.25);
    expect(queryRunner.manager.create).toHaveBeenCalledTimes(2);
    expect(queryRunner.manager.save).toHaveBeenCalledTimes(5);
    expect(eligibleEarnings.map((earning) => earning.status)).toEqual([
      EarningStatus.InPayout,
      EarningStatus.InPayout,
      EarningStatus.InPayout,
    ]);
  });

  it('marks a pending payout as paid and notifies the host', async () => {
    const payout = {
      id: 'payout-1',
      totalAmount: 150.5,
      status: PayoutStatus.Pending,
      periodStart: new Date('2026-01-01T00:00:00Z'),
      periodEnd: new Date('2026-01-08T00:00:00Z'),
      host: { id: 'host-1' },
      earnings: [
        { id: 'earning-1', status: EarningStatus.InPayout, hostAmount: 100 },
        { id: 'earning-2', status: EarningStatus.Voided, hostAmount: 50.5 },
      ],
    } as any;
    payoutRepository.findOne.mockResolvedValue(payout);
    payoutRepository.createQueryBuilder.mockReturnValue(
      createPayoutQueryBuilder({ id: payout.id, status: PayoutStatus.Paid }),
    );

    const result = await service.markPayoutPaid(payout.id);

    expect(payout.status).toBe(PayoutStatus.Paid);
    expect(payout.earnings[0].status).toBe(EarningStatus.Paid);
    expect(payout.earnings[1].status).toBe(EarningStatus.Voided);
    expect(notificationsService.createForUser).toHaveBeenCalledWith({
      userId: 'host-1',
      type: NotificationType.PayoutPaid,
      payload: expect.objectContaining({
        payoutId: payout.id,
        amount: 150.5,
      }),
    });
    expect(result).toEqual({ id: payout.id, status: PayoutStatus.Paid });
  });

  it('rejects marking a non-pending payout as paid', async () => {
    payoutRepository.findOne.mockResolvedValue({
      id: 'payout-2',
      status: PayoutStatus.Paid,
      earnings: [],
      host: { id: 'host-1' },
    });

    await expect(service.markPayoutPaid('payout-2')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws for unknown payout ids', async () => {
    payoutRepository.findOne.mockResolvedValue(null);

    await expect(service.markPayoutPaid('missing-payout')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
