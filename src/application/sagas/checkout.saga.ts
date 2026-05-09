import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../domain/entities/order.entity';
import { CustomerId } from '../../domain/value-objects/customer-id.value-object';
import { Money } from '../../domain/value-objects/money.value-object';
import { OrderStatus } from '../../domain/value-objects/order-status.value-object';
import { ProductId } from '../../domain/value-objects/product-id.value-object';
import { Quantity } from '../../domain/value-objects/quantity.value-object';
import {
  INVENTORY_REPOSITORY,
  type InventoryRepository,
} from '../../domain/ports/inventory.repository';
import { CreateOrderUseCase } from '../use-cases/checkout/create-order.use-case';
import { UpdateOrderStatusUseCase } from '../use-cases/checkout/update-order-status.use-case';
import { CancelOrderUseCase } from '../use-cases/checkout/cancel-order.use-case';
import { ClearCartUseCase } from '../use-cases/cart/clear-cart.use-case';

type CheckoutItemInput = {
  productId: ProductId | string;
  quantity: Quantity | number;
  price: Money | number;
};

type ReservedStock = {
  productId: ProductId;
  quantity: Quantity;
};

export type CheckoutSagaInput = {
  customerId: CustomerId;
  items: CheckoutItemInput[];
  totalAmount?: Money | number;
  reserveInventory?: boolean;
  clearCart?: boolean;
};

@Injectable()
export class CheckoutSaga {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
    private readonly clearCartUseCase: ClearCartUseCase,
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepository,
  ) {}

  async execute(input: CheckoutSagaInput): Promise<Order> {
    const order = await this.createOrderUseCase.execute({
      customerId: input.customerId,
      items: input.items,
      totalAmount: input.totalAmount,
    });

    const reservedStock: ReservedStock[] = [];

    try {
      if (input.reserveInventory) {
        await this.reserveInventory(input.items, reservedStock);

        if (input.clearCart !== false) {
          await this.clearCartUseCase.execute(input.customerId);
        }

        const confirmedOrder = await this.updateOrderStatusUseCase.execute(
          order.id.toString(),
          OrderStatus.confirmed(),
        );

        if (!confirmedOrder) {
          throw new Error('Order could not be confirmed');
        }

        return confirmedOrder;
      }

      if (input.clearCart) {
        await this.clearCartUseCase.execute(input.customerId);
      }

      return order;
    } catch (error) {
      await this.releaseReservedStock(reservedStock);
      await this.cancelOrderUseCase.execute(order.id.toString());
      throw error;
    }
  }

  private async reserveInventory(
    items: CheckoutItemInput[],
    reservedStock: ReservedStock[],
  ): Promise<void> {
    for (const item of items) {
      const productId = this.toProductId(item.productId);
      const quantity = this.toQuantity(item.quantity);
      const updatedInventory = await this.inventoryRepository.reserve(
        productId,
        quantity,
      );

      if (!updatedInventory) {
        throw new Error(
          `Insufficient inventory for product ${productId.toString()}`,
        );
      }

      reservedStock.push({ productId, quantity });
    }
  }

  private async releaseReservedStock(
    reservedStock: ReservedStock[],
  ): Promise<void> {
    await Promise.all(
      reservedStock.map((item) =>
        this.inventoryRepository.release(item.productId, item.quantity),
      ),
    );
  }

  private toProductId(value: ProductId | string): ProductId {
    return value instanceof ProductId ? value : new ProductId(value);
  }

  private toQuantity(value: Quantity | number): Quantity {
    return value instanceof Quantity ? value : new Quantity(value);
  }
}
