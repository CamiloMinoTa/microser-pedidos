import { Injectable, Inject } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { OrderStatus } from '../../../domain/value-objects/order-status.value-object';
import { ORDER_REPOSITORY, type OrderRepository } from '../../../domain/ports/order.repository';

@Injectable()
export class CancelOrderUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orderRepository: OrderRepository) {}

  async execute(orderId: string): Promise<Order | null> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (!order.status.equals(OrderStatus.pending())) {
      throw new Error('Only pending orders can be cancelled');
    }

    const updatedOrder = new Order(
      order.id,
      order.customerId,
      order.items,
      order.totalAmount,
      OrderStatus.cancelled(),
      order.createdAt,
    );

    return this.orderRepository.update(orderId, updatedOrder);
  }
}