import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BookingStatus } from '../bookings/enums/booking.enum';
import { NotificationType } from '../notifications/enums/notification.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { BookingEarning } from '../payments/entities/booking-earning.entity';
import { EarningStatus } from '../payments/enums/payment.enum';
import { Payout } from './entities/payout.entity';
import { PayoutStatus } from './enums/payout.enum';

interface PaginationOptions {
  page?: number;
  limit?: number;
  status?: string;
  hostId?: string;
}

@Injectable()
export class PayoutsService {
  constructor(
    @InjectRepository(BookingEarning)
    private readonly earningRepository: Repository<BookingEarning>,
    @InjectRepository(Payout)
    private readonly payoutRepository: Repository<Payout>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getHostSummary(hostId: string) {
    const totals = await this.earningRepository
      .createQueryBuilder('earning')
      .leftJoin('earning.booking', 'booking')
      .select('COALESCE(SUM(CASE WHEN earning.status != :voided THEN earning.grossAmount ELSE 0 END), 0)', 'grossRevenue')
      .addSelect('COALESCE(SUM(CASE WHEN earning.status != :voided THEN earning.platformFee ELSE 0 END), 0)', 'platformFees')
      .addSelect('COALESCE(SUM(CASE WHEN earning.status != :voided THEN earning.hostAmount ELSE 0 END), 0)', 'netEarnings')
      .addSelect('COALESCE(SUM(CASE WHEN earning.status = :unpaid AND booking.status = :completed THEN earning.hostAmount ELSE 0 END), 0)', 'unpaidBalance')
      .addSelect('COALESCE(SUM(CASE WHEN earning.status = :unpaid AND booking.status != :completed THEN earning.hostAmount ELSE 0 END), 0)', 'pendingCompletionAmount')
      .addSelect('COALESCE(SUM(CASE WHEN earning.status = :inPayout THEN earning.hostAmount ELSE 0 END), 0)', 'inPayoutAmount')
      .addSelect('COALESCE(SUM(CASE WHEN earning.status = :paid THEN earning.hostAmount ELSE 0 END), 0)', 'paidAmount')
      .where('earning.hostId = :hostId', { hostId })
      .setParameters({
        voided: EarningStatus.Voided,
        unpaid: EarningStatus.Unpaid,
        inPayout: EarningStatus.InPayout,
        paid: EarningStatus.Paid,
        completed: BookingStatus.Completed,
      })
      .getRawOne<Record<string, string>>();

    return this.numberize(totals, [
      'grossRevenue',
      'platformFees',
      'netEarnings',
      'unpaidBalance',
      'pendingCompletionAmount',
      'inPayoutAmount',
      'paidAmount',
    ]);
  }

  async getHostEarnings(hostId: string, options: PaginationOptions = {}) {
    return this.getEarningsLedger({ ...options, hostId });
  }

  async getHostPayouts(hostId: string, options: PaginationOptions = {}) {
    return this.getPayoutLedger({ ...options, hostId });
  }

  async getAdminFinanceSummary() {
    const bookings = await this.earningRepository.manager
      .createQueryBuilder()
      .select('COALESCE(SUM(booking.totalAmount), 0)', 'gmv')
      .addSelect('COALESCE(SUM(booking.serviceFee), 0)', 'guestServiceFees')
      .from('booking', 'booking')
      .where('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.Confirmed, BookingStatus.Completed],
      })
      .getRawOne<Record<string, string>>();

    const earnings = await this.earningRepository
      .createQueryBuilder('earning')
      .leftJoin('earning.booking', 'booking')
      .select('COALESCE(SUM(CASE WHEN earning.status != :voided THEN earning.platformFee ELSE 0 END), 0)', 'hostPlatformFees')
      .addSelect('COALESCE(SUM(CASE WHEN earning.status != :voided THEN earning.hostAmount ELSE 0 END), 0)', 'hostNetEarnings')
      .addSelect('COALESCE(SUM(CASE WHEN earning.status = :unpaid AND booking.status = :completed THEN earning.hostAmount ELSE 0 END), 0)', 'eligiblePayoutTotal')
      .addSelect('COALESCE(SUM(CASE WHEN earning.status = :voided THEN earning.hostAmount ELSE 0 END), 0)', 'voidedHostAmount')
      .setParameters({
        voided: EarningStatus.Voided,
        unpaid: EarningStatus.Unpaid,
        completed: BookingStatus.Completed,
      })
      .getRawOne<Record<string, string>>();

    const payouts = await this.payoutRepository
      .createQueryBuilder('payout')
      .select('COALESCE(SUM(CASE WHEN payout.status = :pending THEN payout.totalAmount ELSE 0 END), 0)', 'pendingPayoutTotal')
      .addSelect('COALESCE(SUM(CASE WHEN payout.status = :paid THEN payout.totalAmount ELSE 0 END), 0)', 'paidPayoutTotal')
      .setParameters({ pending: PayoutStatus.Pending, paid: PayoutStatus.Paid })
      .getRawOne<Record<string, string>>();

    const normalizedBookings = this.numberize(bookings, ['gmv', 'guestServiceFees']);
    const normalizedEarnings = this.numberize(earnings, [
      'hostPlatformFees',
      'hostNetEarnings',
      'eligiblePayoutTotal',
      'voidedHostAmount',
    ]);
    const normalizedPayouts = this.numberize(payouts, [
      'pendingPayoutTotal',
      'paidPayoutTotal',
    ]);

    return {
      ...normalizedBookings,
      ...normalizedEarnings,
      ...normalizedPayouts,
      platformRevenue:
        normalizedBookings.guestServiceFees + normalizedEarnings.hostPlatformFees,
    };
  }

  async getAdminEarnings(options: PaginationOptions = {}) {
    return this.getEarningsLedger(options);
  }

  async getAdminPayouts(options: PaginationOptions = {}) {
    return this.getPayoutLedger(options);
  }

  async generatePayouts() {
    const eligibleEarnings = await this.earningRepository.find({
      where: {
        status: EarningStatus.Unpaid,
        booking: { status: BookingStatus.Completed },
      },
      relations: {
        host: true,
        booking: true,
      },
      order: { createdAt: 'ASC' },
    });

    if (eligibleEarnings.length === 0) {
      return { payoutsCreated: 0, earningsMoved: 0, totalAmount: 0, payouts: [] };
    }

    const grouped = new Map<string, BookingEarning[]>();
    for (const earning of eligibleEarnings) {
      const hostId = earning.host.id;
      grouped.set(hostId, [...(grouped.get(hostId) ?? []), earning]);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payouts: Payout[] = [];
      let totalAmount = 0;
      const now = new Date();
      const periodStart = new Date(now);
      periodStart.setUTCDate(periodStart.getUTCDate() - 7);

      for (const [hostId, earnings] of grouped) {
        const payoutAmount = this.toCurrencyValue(
          earnings.reduce((sum, earning) => sum + Number(earning.hostAmount), 0),
        );
        totalAmount += payoutAmount;

        const payout = queryRunner.manager.create(Payout, {
          host: { id: hostId },
          totalAmount: payoutAmount,
          periodStart,
          periodEnd: now,
          status: PayoutStatus.Pending,
        });
        const savedPayout = await queryRunner.manager.save(Payout, payout);

        for (const earning of earnings) {
          earning.status = EarningStatus.InPayout;
          earning.payout = savedPayout;
          await queryRunner.manager.save(BookingEarning, earning);
        }

        payouts.push(savedPayout);
      }

      await queryRunner.commitTransaction();

      return {
        payoutsCreated: payouts.length,
        earningsMoved: eligibleEarnings.length,
        totalAmount: this.toCurrencyValue(totalAmount),
        payouts,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async markPayoutPaid(payoutId: string) {
    const payout = await this.payoutRepository.findOne({
      where: { id: payoutId },
      relations: { earnings: true, host: true },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (payout.status !== PayoutStatus.Pending) {
      throw new BadRequestException('Only pending payouts can be marked paid');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      payout.status = PayoutStatus.Paid;
      await queryRunner.manager.save(Payout, payout);

      for (const earning of payout.earnings ?? []) {
        if (earning.status === EarningStatus.InPayout) {
          earning.status = EarningStatus.Paid;
          await queryRunner.manager.save(BookingEarning, earning);
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    await this.notificationsService.createForUser({
      userId: payout.host.id,
      type: NotificationType.PayoutPaid,
      payload: {
        title: 'Payout paid',
        message:
          'Your payout of $' +
          Number(payout.totalAmount).toFixed(2) +
          ' was marked as paid',
        payoutId: payout.id,
        amount: Number(payout.totalAmount),
        periodStart: payout.periodStart,
        periodEnd: payout.periodEnd,
      },
    });

    return this.findPayoutByIdForResponse(payoutId);
  }

  private async getEarningsLedger(options: PaginationOptions) {
    const page = Math.max(1, Number(options.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(options.limit ?? 20)));
    const qb = this.earningRepository
      .createQueryBuilder('earning')
      .leftJoinAndSelect('earning.host', 'host')
      .leftJoinAndSelect('earning.booking', 'booking')
      .leftJoinAndSelect('booking.listing', 'listing')
      .leftJoinAndSelect('booking.bookedByUser', 'guest')
      .leftJoinAndSelect('earning.payout', 'payout')
      .select([
        'earning.id',
        'earning.grossAmount',
        'earning.platformFee',
        'earning.hostAmount',
        'earning.status',
        'earning.createdAt',
        'host.id',
        'host.name',
        'host.email',
        'booking.id',
        'booking.status',
        'booking.checkIn',
        'booking.checkOut',
        'booking.totalAmount',
        'booking.serviceFee',
        'listing.id',
        'listing.title',
        'listing.locationText',
        'guest.id',
        'guest.name',
        'guest.email',
        'payout.id',
        'payout.status',
        'payout.totalAmount',
        'payout.periodStart',
        'payout.periodEnd',
        'payout.createdAt',
      ])
      .orderBy('earning.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (options.hostId) {
      qb.andWhere('host.id = :hostId', { hostId: options.hostId });
    }

    if (options.status) {
      qb.andWhere('earning.status = :status', { status: options.status });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private async getPayoutLedger(options: PaginationOptions) {
    const page = Math.max(1, Number(options.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(options.limit ?? 20)));
    const qb = this.payoutRepository
      .createQueryBuilder('payout')
      .leftJoinAndSelect('payout.host', 'host')
      .leftJoinAndSelect('payout.earnings', 'earning')
      .select([
        'payout.id',
        'payout.totalAmount',
        'payout.periodStart',
        'payout.periodEnd',
        'payout.status',
        'payout.createdAt',
        'host.id',
        'host.name',
        'host.email',
        'earning.id',
        'earning.status',
        'earning.hostAmount',
      ])
      .orderBy('payout.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (options.hostId) {
      qb.andWhere('host.id = :hostId', { hostId: options.hostId });
    }

    if (options.status) {
      qb.andWhere('payout.status = :status', { status: options.status });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private findPayoutByIdForResponse(payoutId: string) {
    return this.payoutRepository
      .createQueryBuilder('payout')
      .leftJoinAndSelect('payout.host', 'host')
      .leftJoinAndSelect('payout.earnings', 'earning')
      .select([
        'payout.id',
        'payout.totalAmount',
        'payout.periodStart',
        'payout.periodEnd',
        'payout.status',
        'payout.createdAt',
        'host.id',
        'host.name',
        'host.email',
        'earning.id',
        'earning.status',
        'earning.hostAmount',
      ])
      .where('payout.id = :payoutId', { payoutId })
      .getOne();
  }

  private numberize<T extends Record<string, string> | undefined>(row: T, keys: string[]) {
    const result: Record<string, number> = {};
    for (const key of keys) {
      result[key] = Number(row?.[key] ?? 0);
    }
    return result;
  }

  private toCurrencyValue(value: number) {
    return Number(value.toFixed(2));
  }
}
