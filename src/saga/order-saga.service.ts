import { Injectable, Logger } from '@nestjs/common';
import { Order } from '../domain/entities/order.entity';
import { OrderRepository } from '../domain/interfaces/order.repository';

@Injectable()
export class OrderSaga {
  private readonly logger = new Logger(OrderSaga.name);

  constructor(private readonly orderRepository: OrderRepository) {}

  async handleOrderCreated(order: Order): Promise<void> {
    this.logger.log(`Starting saga for order ${order.id}`);
    order.markProcessing();
    await this.orderRepository.save(order);

    // Aquí podría ir una llamada a otro microservicio o a un bus de mensajes.
    order.markCompleted();
    await this.orderRepository.save(order);
    this.logger.log(`Order ${order.id} completed by saga`);
  }
}
