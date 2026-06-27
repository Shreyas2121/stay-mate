import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Listing } from '../listings/entities/listing.entity';
import { ListingStatus } from '../listings/enums/listing.enum';
import { Wishlist } from './entities/wishlist.entity';
import { WishlistsService } from './wishlists.service';

describe('WishlistsService', () => {
  let service: WishlistsService;
  let wishlistRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let listingRepository: { findOne: jest.Mock };

  const userId = '11111111-1111-4111-8111-111111111111';
  const listingId = '22222222-2222-4222-8222-222222222222';
  const wishlistId = '33333333-3333-4333-8333-333333333333';

  beforeEach(async () => {
    wishlistRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      create: jest.fn((entity) => entity),
      save: jest.fn(async (entity) => ({ ...entity, id: wishlistId })),
      remove: jest.fn(),
    };
    listingRepository = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistsService,
        { provide: getRepositoryToken(Wishlist), useValue: wishlistRepository },
        { provide: getRepositoryToken(Listing), useValue: listingRepository },
      ],
    }).compile();

    service = module.get(WishlistsService);
  });

  it('returns current user wishlist items', async () => {
    wishlistRepository.find.mockResolvedValue([{ id: wishlistId }]);

    const result = await service.getMyWishlist(userId);

    expect(wishlistRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { user: { id: userId } } }),
    );
    expect(result).toEqual([{ id: wishlistId }]);
  });

  it('reports whether a listing is wishlisted', async () => {
    listingRepository.findOne.mockResolvedValue({ id: listingId });
    wishlistRepository.count.mockResolvedValue(1);

    await expect(service.isWishlisted(userId, listingId)).resolves.toEqual({
      listingId,
      isWishlisted: true,
    });
  });

  it('adds a listing to wishlist when missing', async () => {
    listingRepository.findOne.mockResolvedValue({ id: listingId });
    wishlistRepository.findOne.mockResolvedValue(null);

    const result = await service.toggleWishlist(userId, listingId);

    expect(listingRepository.findOne).toHaveBeenCalledWith({
      where: { id: listingId, status: ListingStatus.Active },
      select: { id: true },
    });
    expect(wishlistRepository.create).toHaveBeenCalledWith({
      user: { id: userId },
      listing: { id: listingId },
    });
    expect(result).toEqual({ listingId, isWishlisted: true });
  });

  it('removes a listing from wishlist when present', async () => {
    const existing = { id: wishlistId };
    listingRepository.findOne.mockResolvedValue({ id: listingId });
    wishlistRepository.findOne.mockResolvedValue(existing);

    const result = await service.toggleWishlist(userId, listingId);

    expect(wishlistRepository.remove).toHaveBeenCalledWith(existing);
    expect(result).toEqual({ listingId, isWishlisted: false });
  });

  it('rejects inactive or missing listings', async () => {
    listingRepository.findOne.mockResolvedValue(null);

    await expect(service.toggleWishlist(userId, listingId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
