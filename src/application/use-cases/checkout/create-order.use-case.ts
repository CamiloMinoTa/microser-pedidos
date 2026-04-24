import { Injectable, Inject } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { OrderId } from '../../../domain/value-objects/order-id.value-object';
import { CustomerId } from '../../../domain/value-objects/customer-id.value-object';
import { OrderStatus } from '../../../domain/value-objects/order-status.value-object';
import { ORDER_REPOSITORY } from '../../../domain/ports/order.repository';
import type { OrderRepository } from '../../../domain/ports/order.repository';

@Injectable()
export class CreateOrderUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orderRepository: OrderRepository) {}

  async execute(orderData: {
    customerId: CustomerId;
    items: any[];
    totalAmount: any;
    status?: OrderStatus;
  }): Promise<Order> {
    const orderId = new OrderId(Date.now().toString());
    const order = new Order(
      orderId,
      orderData.customerId,
      orderData.items,
      orderData.totalAmount,
      orderData.status || OrderStatus.pending(),
      new Date(),
    );
    return this.orderRepository.create(order);
  }
}