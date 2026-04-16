import { Injectable, Inject } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { CustomerId } from '../../../domain/value-objects/customer-id.value-object';
import { ORDER_REPOSITORY, type OrderRepository } from '../../ports/order.repository';

@Injectable()
export class GetUserOrderHistoryUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orderRepository: OrderRepository) {}

  async execute(userId: CustomerId): Promise<Order[]> {
    return this.orderRepository.findByUserId(userId);
  }
}