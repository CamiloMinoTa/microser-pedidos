import { Injectable } from '@nestjs/common';
import { Order } from '../domain/entities/order.entity';
import { OrderRepository } from '../domain/interfaces/order.repository';

@Injectable()
export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders: Order[] = [];

  async save(order: Order): Promise<Order> {
    const index = this.orders.findIndex((item) => item.id === order.id);
    if (index >= 0) {
      this.orders[index] = order;
    } else {
      this.orders.push(order);
    }
    return order;
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.find((order) => order.id === id) ?? null;
  }

  async findAll(): Promise<Order[]> {
    return [...this.orders];
  }
}
