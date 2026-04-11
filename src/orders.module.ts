import { Module } from '@nestjs/common';
import { OrdersController } from './application/orders.controller';
import { OrdersService } from './application/orders.service';
import { OrderSaga } from './saga/order-saga.service';
import { OrderRepository } from './domain/interfaces/order.repository';
import { InMemoryOrderRepository } from './infrastructure/in-memory-order.repository';

@Module({
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrderSaga,
    {
      provide: OrderRepository,
      useClass: InMemoryOrderRepository,
    },
  ],
})
export class OrdersModule {}
