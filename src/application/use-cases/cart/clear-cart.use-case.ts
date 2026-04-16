import { Injectable, Inject } from '@nestjs/common';
import { Cart } from '../../../domain/entities/cart.entity';
import { CustomerId } from '../../../domain/value-objects/customer-id.value-object';
import { Money } from '../../../domain/value-objects/money.value-object';
import { CART_REPOSITORY, type CartRepository } from '../../ports/cart.repository';

@Injectable()
export class ClearCartUseCase {
  constructor(@Inject(CART_REPOSITORY) private readonly cartRepository: CartRepository) {}

  async execute(userId: CustomerId): Promise<boolean> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      return false;
    }

    cart.items = [];
    cart.totalAmount = new Money(0);
    await this.cartRepository.update(cart.id, cart);
    return true;
  }
}