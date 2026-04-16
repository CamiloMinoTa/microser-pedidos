import { CustomerId } from '../value-objects/customer-id.value-object';
import { ProductId } from '../value-objects/product-id.value-object';
import { Quantity } from '../value-objects/quantity.value-object';
import { Money } from '../value-objects/money.value-object';

export class CartItem {
  constructor(
    public productId: ProductId,
    public quantity: Quantity,
    public price: Money,
  ) {}
}

export class Cart {
  constructor(
    public id: string,
    public userId: CustomerId,
    public items: CartItem[],
    public totalAmount: Money,
  ) {}
}