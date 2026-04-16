import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateOrderUseCase } from '../../application/use-cases/checkout/create-order.use-case';
import { CancelOrderUseCase } from '../../application/use-cases/checkout/cancel-order.use-case';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/checkout/update-order-status.use-case';
import { GetUserOrderHistoryUseCase } from '../../application/use-cases/history/get-user-order-history.use-case';
import { GetOrderByIdUseCase } from '../../application/use-cases/history/get-order-by-id.use-case';
import { ORDER_REPOSITORY, type OrderRepository } from '../../application/ports/order.repository';
import { Order } from '../../domain/entities/order.entity';
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
    if (
      !orderData?.customerId ||
      !Array.isArray(orderData.items) ||
      orderData.items.length === 0 ||
      orderData.totalAmount == null
    ) {
      throw new BadRequestException(
        'customerId, items y totalAmount son obligatorios',
      );
    }

    const customerId = new CustomerId(orderData.customerId);
    const order = await this.createOrderUseCase.execute({
      customerId,
      items: orderData.items || [],
      totalAmount: orderData.totalAmount,
    });

    return this.toResponse(order);
  }

  @Get()
  async findAll() {
    const orders = await this.orderRepository.findAll();
    return orders.map(order => this.toResponse(order));
  }

  @Get('user/:userId')
  async getUserOrders(@Param('userId') userId: string) {
    const customerId = new CustomerId(userId);
    const orders = await this.getOrderHistoryUseCase.execute(customerId);
    return orders.map(order => this.toResponse(order));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const order = await this.getOrderByIdUseCase.execute(id);
    if (!order) {
      throw new NotFoundException(`Pedido ${id} no encontrado`);
    }
    return this.toResponse(order);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    const orderStatus = new OrderStatus(body.status);
    const order = await this.updateOrderStatusUseCase.execute(id, orderStatus);
    if (!order) {
      throw new NotFoundException(`Pedido ${id} no encontrado`);
    }
    return this.toResponse(order);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const deleted = await this.cancelOrderUseCase.execute(id);
    if (!deleted) {
      throw new NotFoundException(`Pedido ${id} no encontrado`);
    }
    return { deleted: true };
  }

  private toResponse(order: Order) {
    return {
      id: this.toStringValue(order.id),
      customerId: this.toStringValue(order.customerId),
      items: order.items.map(item => ({
        productId: this.toStringValue(item.productId),
        quantity: this.toNumberValue(item.quantity),
        price: this.toMoneyValue(item.price),
      })),
      totalAmount: this.toMoneyValue(order.totalAmount),
      status: this.toStringValue(order.status),
      createdAt: order.createdAt,
    };
  }

  private toStringValue(value: unknown) {
    if (typeof value === 'string') {
      return value;
    }

    if (value && typeof (value as { toString: () => string }).toString === 'function') {
      return value.toString();
    }

    return String(value);
  }

  private toNumberValue(value: unknown) {
    if (typeof value === 'number') {
      return value;
    }

    const numberValue = value as { toNumber?: () => number } | null;
    if (numberValue && typeof numberValue.toNumber === 'function') {
      return numberValue.toNumber();
    }

    return Number(value);
  }

  private toMoneyValue(value: unknown) {
    if (typeof value === 'number') {
      return value;
    }

    const moneyValue = value as { getAmount?: () => number } | null;
    if (moneyValue && typeof moneyValue.getAmount === 'function') {
      return moneyValue.getAmount();
    }

    return Number(value);
  }
}
