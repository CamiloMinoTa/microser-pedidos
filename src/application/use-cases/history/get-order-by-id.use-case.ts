import { Injectable, Inject } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { OrderId } from '../../../domain/value-objects/order-id.value-object';
import { ORDER_REPOSITORY, type OrderRepository } from '../../ports/order.repository';

@Injectable()
export class GetOrderByIdUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orderRepository: OrderRepository) {}

  async execute(orderId: string): Promise<Order | null> {
    return this.orderRepository.findById(orderId);
  }
}