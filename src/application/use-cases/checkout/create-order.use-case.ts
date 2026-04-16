import { Injectable, Inject } from '@nestjs/common';
import { Money } from '../../../domain/value-objects/money.value-object';
import { Order, OrderItem } from '../../../domain/entities/order.entity';
import { OrderId } from '../../../domain/value-objects/order-id.value-object';
import { CustomerId } from '../../../domain/value-objects/customer-id.value-object';
import { OrderStatus } from '../../../domain/value-objects/order-status.value-object';
import { ProductId } from '../../../domain/value-objects/product-id.value-object';
import { Quantity } from '../../../domain/value-objects/quantity.value-object';
import { ORDER_REPOSITORY } from '../../ports/order.repository';
import type { OrderRepository } from '../../ports/order.repository';

@Injectable()
export class CreateOrderUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orderRepository: OrderRepository) {}

  async execute(orderData: {
    customerId: CustomerId;
    items: Array<{ productId: string; quantity: number; price: number }>;
    totalAmount: number;
    status?: OrderStatus;
  }): Promise<Order> {
    const orderId = new OrderId(Date.now().toString());
    const items = orderData.items.map(
      item =>
        new OrderItem(
          new ProductId(item.productId),
          new Quantity(item.quantity),
          new Money(item.price),
        ),
    );

    const order = new Order(
      orderId,
      orderData.customerId,
      items,
      new Money(orderData.totalAmount),
      orderData.status || OrderStatus.pending(),
      new Date(),
    );
    return this.orderRepository.create(order);
  }
}
