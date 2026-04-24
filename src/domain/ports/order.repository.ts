import { Order } from '../entities/order.entity'
import { CustomerId } from '../value-objects/customer-id.value-object';

export const ORDER_REPOSITORY = Symbol('OrderRepository');

export interface OrderRepository {
  create(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByUserId(userId: CustomerId): Promise<Order[]>;
  findAll(): Promise<Order[]>;
  update(id: string, order: Partial<Order>): Promise<Order | null>;
  delete(id: string): Promise<boolean>;
}