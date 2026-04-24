import { Injectable, Inject } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { OrderStatus } from '../../../domain/value-objects/order-status.value-object';
import { ORDER_REPOSITORY, type OrderRepository } from '../../../domain/ports/order.repository';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orderRepository: OrderRepository) {}

  async execute(orderId: string, status: OrderStatus): Promise<Order | null> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const updatedOrder = new Order(
      order.id,
      order.customerId,
      order.items,
      order.totalAmount,
      status,
      order.createdAt,
    );

    return this.orderRepository.update(orderId, updatedOrder);
  }
}