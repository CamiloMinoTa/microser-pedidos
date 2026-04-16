import { Injectable, Inject } from '@nestjs/common';
import { Cart, CartItem } from '../../../domain/entities/cart.entity';
import { CustomerId } from '../../../domain/value-objects/customer-id.value-object';
import { ProductId } from '../../../domain/value-objects/product-id.value-object';
import { Quantity } from '../../../domain/value-objects/quantity.value-object';
import { Money } from '../../../domain/value-objects/money.value-object';
import { CART_REPOSITORY, type CartRepository } from '../../ports/cart.repository';

@Injectable()
export class AddItemToCartUseCase {
  constructor(@Inject(CART_REPOSITORY) private readonly cartRepository: CartRepository) {}

  async execute(userId: CustomerId, item: { productId: ProductId; quantity: Quantity; price: Money }): Promise<Cart> {
    let cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      cart = new Cart('', userId, [], new Money(0));
    }

    const existingItem = cart.items.find(i => i.productId.equals(item.productId));
    if (existingItem) {
      existingItem.quantity = existingItem.quantity.add(item.quantity);
    } else {
      const cartItem = new CartItem(item.productId, item.quantity, item.price);
      cart.items.push(cartItem);
    }

    const newTotal = cart.items.reduce(
      (total, i) => total.add(i.price.multiply(i.quantity.toNumber())),
      new Money(0),
    );
    cart.totalAmount = newTotal;

    if (cart.id) {
      const result = await this.cartRepository.update(cart.id, cart);
      return result || cart;
    } else {
      return this.cartRepository.create(cart);
    }
  }
}