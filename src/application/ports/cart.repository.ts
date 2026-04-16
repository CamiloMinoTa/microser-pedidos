import { Cart } from '../../domain/entities/cart.entity';
import { CustomerId } from '../../domain/value-objects/customer-id.value-object';

export const CART_REPOSITORY = Symbol('CartRepository');

export interface CartRepository {
  create(cart: Cart): Promise<Cart>;
  findByUserId(userId: CustomerId): Promise<Cart | null>;
  update(id: string, cart: Partial<Cart>): Promise<Cart | null>;
  delete(id: string): Promise<boolean>;
}