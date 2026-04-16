import { Controller, Get, Post, Body, Param, Inject, Patch, Delete } from '@nestjs/common';
import { CreateOrderUseCase } from '../../application/use-cases/checkout/create-order.use-case';
import { CancelOrderUseCase } from '../../application/use-cases/checkout/cancel-order.use-case';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/checkout/update-order-status.use-case';
import { GetUserOrderHistoryUseCase } from '../../application/use-cases/history/get-user-order-history.use-case';
import { GetOrderByIdUseCase } from '../../application/use-cases/history/get-order-by-id.use-case';
import { ORDER_REPOSITORY, type OrderRepository } from '../../application/ports/order.repository';
import { CustomerId } from '../../domain/value-objects/customer-id.value-object';
import { OrderStatus } from '../../domain/value-objects/order-status.value-object';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly getOrderByIdUseCase: GetOrderByIdUseCase,
    private readonly getOrderHistoryUseCase: GetUserOrderHistoryUseCase,
    @Inject(ORDER_REPOSITORY) private readonly orderRepository: OrderRepository,
  ) {}

  @Post()
  async create(@Body() orderData: any) {
    const customerId = new CustomerId(orderData.customerId);
    return this.createOrderUseCase.execute({
      customerId,
      items: orderData.items || [],
      totalAmount: orderData.totalAmount,
    });
  }

  @Get()
  async findAll() {
    return this.orderRepository.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.getOrderByIdUseCase.execute(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    const orderStatus = new OrderStatus(body.status);
    return this.updateOrderStatusUseCase.execute(id, orderStatus);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.cancelOrderUseCase.execute(id);
  }

  @Get('user/:userId')
  async getUserOrders(@Param('userId') userId: string) {
    const customerId = new CustomerId(userId);
    return this.getOrderHistoryUseCase.execute(customerId);
  }
}