import { Injectable, Inject } from '@nestjs/common';
import { Cart } from '../../../domain/entities/cart.entity';
import { CustomerId } from '../../../domain/value-objects/customer-id.value-object';
import { CART_REPOSITORY, type CartRepository } from '../../../domain/ports/cart.repository';

@Injectable()
export class GetUserCartUseCase {
  constructor(@Inject(CART_REPOSITORY) private readonly cartRepository: CartRepository) {}

  async execute(userId: CustomerId): Promise<Cart | null> {
    return this.cartRepository.findByUserId(userId);
  }
}