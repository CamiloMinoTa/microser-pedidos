import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Order } from '../domain/entities/order.entity';
import { OrderRepository } from '../domain/interfaces/order.repository';
import { OrderSaga } from '../saga/order-saga.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(OrderRepository)
    private readonly orderRepository: OrderRepository,
    private readonly orderSaga: OrderSaga,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const order = new Order(randomUUID(), createOrderDto.items);
    await this.orderRepository.save(order);
    await this.orderSaga.handleOrderCreated(order);
    return order;
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.findAll();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }
}
