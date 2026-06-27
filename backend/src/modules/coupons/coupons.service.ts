import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { User } from '../users/entities/user.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { GetPublicCouponsDto } from './dto/get-public-coupons.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { BookingsService, BookingPricingContext } from '../bookings/bookings.service';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { DiscountType } from './enums/coupon.enum';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly bookingsService: BookingsService,
  ) {}

  async createCoupon(dto: CreateCouponDto) {
    const normalizedCode = this.normalizeCode(dto.code);
    await this.ensureUniqueCode(normalizedCode);

    const targetUser = dto.userId ? await this.findTargetUser(dto.userId) : null;
    this.validateDiscountShape(dto.discountType, dto.discount);

    const coupon = this.couponRepository.create({
      code: normalizedCode,
      discountType: dto.discountType,
      discount: dto.discount,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      user: targetUser,
      isPublic: dto.isPublic ?? false,
    });

    return this.mapCoupon(await this.couponRepository.save(coupon));
  }

  async getAdminCoupons() {
    const coupons = await this.couponRepository.find({
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });

    return coupons.map((coupon) => this.mapCoupon(coupon));
  }

  async getAdminCouponById(id: string) {
    const coupon = await this.findCouponById(id);
    return this.mapCoupon(coupon);
  }

  async updateCoupon(id: string, dto: UpdateCouponDto) {
    const coupon = await this.findCouponById(id);

    if (dto.code !== undefined) {
      const normalizedCode = this.normalizeCode(dto.code);
      if (normalizedCode !== coupon.code) {
        await this.ensureUniqueCode(normalizedCode, coupon.id);
      }
      coupon.code = normalizedCode;
    }

    if (dto.discountType !== undefined || dto.discount !== undefined) {
      const discountType = dto.discountType ?? coupon.discountType;
      const discount = dto.discount ?? Number(coupon.discount);
      this.validateDiscountShape(discountType, discount);
      coupon.discountType = discountType;
      coupon.discount = discount;
    }

    if (dto.expiryDate !== undefined) {
      coupon.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
    }

    if (dto.isPublic !== undefined) {
      coupon.isPublic = dto.isPublic;
    }

    if (dto.userId !== undefined) {
      coupon.user = dto.userId ? await this.findTargetUser(dto.userId) : null;
    }

    return this.mapCoupon(await this.couponRepository.save(coupon));
  }

  async deactivateCoupon(id: string) {
    const coupon = await this.findCouponById(id);
    coupon.isActive = false;

    return this.mapCoupon(await this.couponRepository.save(coupon));
  }

  async getEligiblePublicCoupons(user: User, dto: GetPublicCouponsDto) {
    const pricing = await this.bookingsService.getBookingPricingContext(dto);
    const coupons = await this.couponRepository
      .createQueryBuilder('coupon')
      .leftJoinAndSelect('coupon.user', 'user')
      .where('coupon.isActive = :isActive', { isActive: true })
      .andWhere('coupon.isPublic = :isPublic', { isPublic: true })
      .andWhere(
        new Brackets((qb) => {
          qb.where('user.id = :userId', { userId: user.id }).orWhere(
            'coupon.userId IS NULL',
          );
        }),
      )
      .orderBy('coupon.createdAt', 'DESC')
      .getMany();

    const now = new Date();
    const eligibleCoupons = coupons
      .filter((coupon) => !coupon.expiryDate || coupon.expiryDate >= now)
      .map((coupon) => ({
        ...this.mapCoupon(coupon),
        pricing: this.buildPricingSummary(pricing, coupon),
      }));

    return {
      booking: this.mapBookingPricing(pricing),
      coupons: eligibleCoupons,
    };
  }

  async validateCoupon(userId: string, dto: ValidateCouponDto) {
    const pricing = await this.bookingsService.getBookingPricingContext(dto);

    if (!dto.code && !dto.couponId) {
      throw new BadRequestException('Either couponId or code is required');
    }

    const coupon = dto.couponId
      ? await this.findCouponById(dto.couponId)
      : await this.findCouponByCode(dto.code!);

    this.assertCouponEligibility(coupon, userId);

    return {
      coupon: this.mapCoupon(coupon),
      pricing: this.buildPricingSummary(pricing, coupon),
    };
  }

  private async findCouponById(id: string) {
    const coupon = await this.couponRepository.findOne({
      where: { id },
      relations: { user: true },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  private async findCouponByCode(code: string) {
    const normalizedCode = this.normalizeCode(code);
    const coupon = await this.couponRepository
      .createQueryBuilder('coupon')
      .leftJoinAndSelect('coupon.user', 'user')
      .where('UPPER(coupon.code) = :code', { code: normalizedCode })
      .getOne();

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  private async findTargetUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Target user not found');
    }

    return user;
  }

  private async ensureUniqueCode(code: string, excludeId?: string) {
    const existing = await this.couponRepository
      .createQueryBuilder('coupon')
      .select(['coupon.id'])
      .where('UPPER(coupon.code) = :code', { code })
      .getOne();

    if (existing && existing.id !== excludeId) {
      throw new BadRequestException('Coupon code already exists');
    }
  }

  private assertCouponEligibility(coupon: Coupon, userId: string) {
    if (!coupon.isActive) {
      throw new BadRequestException('Coupon is inactive');
    }

    if (coupon.expiryDate && coupon.expiryDate < new Date()) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.user && coupon.user.id !== userId) {
      throw new BadRequestException('Coupon is not available for this user');
    }
  }

  private buildPricingSummary(pricing: BookingPricingContext, coupon: Coupon) {
    const discountAmount = this.calculateDiscountAmount(
      coupon.discountType,
      Number(coupon.discount),
      pricing.baseAmount,
    );

    return {
      ...this.mapBookingPricing(pricing),
      discountAmount,
      totalAmount: this.toCurrencyValue(
        pricing.baseAmount + pricing.cleaningFee + pricing.serviceFee - discountAmount,
      ),
    };
  }

  private calculateDiscountAmount(
    discountType: DiscountType,
    discountValue: number,
    baseAmount: number,
  ) {
    if (discountType === DiscountType.Percent) {
      return this.toCurrencyValue((baseAmount * discountValue) / 100);
    }

    return this.toCurrencyValue(Math.min(discountValue, baseAmount));
  }

  private validateDiscountShape(discountType: DiscountType, discount: number) {
    if (discountType === DiscountType.Percent && discount > 100) {
      throw new BadRequestException('Percent discount cannot exceed 100');
    }
  }

  private mapBookingPricing(pricing: BookingPricingContext) {
    return {
      listingId: pricing.listing.id,
      nights: pricing.nights,
      baseAmount: pricing.baseAmount,
      cleaningFee: pricing.cleaningFee,
      serviceFee: pricing.serviceFee,
      discountAmount: 0,
      totalAmount: this.toCurrencyValue(
        pricing.baseAmount + pricing.cleaningFee + pricing.serviceFee,
      ),
    };
  }

  private mapCoupon(coupon: Coupon) {
    return {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discount: this.toCurrencyValue(Number(coupon.discount)),
      expiryDate: coupon.expiryDate,
      isPublic: coupon.isPublic,
      isActive: coupon.isActive,
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt,
      userId: coupon.user?.id ?? null,
    };
  }

  private normalizeCode(code: string) {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      throw new BadRequestException('Coupon code cannot be empty');
    }

    return normalizedCode;
  }

  private toCurrencyValue(value: number) {
    return Number(value.toFixed(2));
  }
}
