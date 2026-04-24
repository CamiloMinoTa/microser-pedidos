import { Injectable, Inject } from '@nestjs/common';
import { Cart } from '../../../domain/entities/cart.entity';
import { CustomerId } from '../../../domain/value-objects/customer-id.value-object';
import { ProductId } from '../../../domain/value-objects/product-id.value-object';
import { Quantity } from '../../../domain/value-objects/quantity.value-object';
import { Money } from '../../../domain/value-objects/money.value-object';
import { CART_REPOSITORY, type CartRepository } from '../../../domain/ports/cart.repository';

@Injectable()
export class UpdateCartItemQuantityUseCase {
  constructor(@Inject(CART_REPOSITORY) private readonly cartRepository: CartRepository) {}

  async execute(userId: CustomerId, productId: ProductId, quantity: Quantity): Promise<Cart | null> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    const item = cart.items.find(i => i.productId.equals(productId));
    if (!item) {
      throw new Error('Item not found in cart');
    }

    item.quantity = quantity;
    const newTotal = cart.items.reduce(
      (total, i) => total.add(i.price.multiply(i.quantity.toNumber())),
      new Money(0),
    );
    cart.totalAmount = newTotal;

    return this.cartRepository.update(cart.id, cart);
  }
}