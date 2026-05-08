import { Injectable, Inject } from '@nestjs/common';
import { Order, OrderItem } from '../../../domain/entities/order.entity';
import { OrderId } from '../../../domain/value-objects/order-id.value-object';
import { CustomerId } from '../../../domain/value-objects/customer-id.value-object';
import { ProductId } from '../../../domain/value-objects/product-id.value-object';
import { Quantity } from '../../../domain/value-objects/quantity.value-object';
import { Money } from '../../../domain/value-objects/money.value-object';
import { OrderStatus } from '../../../domain/value-objects/order-status.value-object';
import { ORDER_REPOSITORY } from '../../../domain/ports/order.repository';
import type { OrderRepository } from '../../../domain/ports/order.repository';

type CreateOrderItemInput = {
  productId: ProductId | string;
  quantity: Quantity | number;
  price: Money | number;
};

@Injectable()
export class CreateOrderUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orderRepository: OrderRepository) {}

  async execute(orderData: {
    customerId: CustomerId;
    items: CreateOrderItemInput[];
    totalAmount?: Money | number;
    status?: OrderStatus;
  }): Promise<Order> {
    const orderId = new OrderId(Date.now().toString());
    const items = orderData.items.map(item => this.toOrderItem(item));
    const totalAmount =
      orderData.totalAmount == null
        ? this.calculateTotal(items)
        : this.toMoney(orderData.totalAmount);

    const order = new Order(
      orderId,
      orderData.customerId,
      items,
      totalAmount,
      orderData.status || OrderStatus.pending(),
      new Date(),
    );
    return this.orderRepository.create(order);
  }

  private toOrderItem(item: CreateOrderItemInput): OrderItem {
    return new OrderItem(
      item.productId instanceof ProductId
        ? item.productId
        : new ProductId(item.productId),
      item.quantity instanceof Quantity
        ? item.quantity
        : new Quantity(item.quantity),
      this.toMoney(item.price),
    );
  }

  private toMoney(value: Money | number): Money {
    return value instanceof Money ? value : new Money(value);
  }

  private calculateTotal(items: OrderItem[]): Money {
    return items.reduce(
      (total, item) => total.add(item.price.multiply(item.quantity.toNumber())),
      new Money(0),
    );
  }
}
