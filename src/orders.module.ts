import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersController } from './infrastructure/controllers/orders.controller';
import { CartController } from './infrastructure/controllers/cart.controller';
import { MongoOrderRepository } from './infrastructure/repositories/mongo-order.repository';
import { MongoCartRepository } from './infrastructure/repositories/mongo-cart.repository';
import { MongoProductRepository } from './infrastructure/repositories/mongo-product.repository';
import { MongoCustomerRepository } from './infrastructure/repositories/mongo-customer.repository';
import { MongoInventoryRepository } from './infrastructure/repositories/mongo-inventory.repository';
import { ORDER_REPOSITORY } from './domain/ports/order.repository';
import { CART_REPOSITORY } from './domain/ports/cart.repository';
import { PRODUCT_REPOSITORY } from './domain/ports/product.repository';
import { CUSTOMER_REPOSITORY } from './domain/ports/customer.repository';
import { INVENTORY_REPOSITORY } from './domain/ports/inventory.repository';
import { OrderSchema } from './infrastructure/repositories/schemas/order.schema';
import { CartSchema } from './infrastructure/repositories/schemas/cart.schema';
import { ProductSchema } from './infrastructure/repositories/schemas/product.schema';
import { CustomerSchema } from './infrastructure/repositories/schemas/customer.schema';
import { InventorySchema } from './infrastructure/repositories/schemas/inventory.schema';
import { CreateOrderUseCase } from './application/use-cases/checkout/create-order.use-case';
import { CancelOrderUseCase } from './application/use-cases/checkout/cancel-order.use-case';
import { UpdateOrderStatusUseCase } from './application/use-cases/checkout/update-order-status.use-case';
import { AddItemToCartUseCase } from './application/use-cases/cart/add-item-to-cart.use-case';
import { UpdateCartItemQuantityUseCase } from './application/use-cases/cart/update-cart-item-quantity.use-case';
import { RemoveItemFromCartUseCase } from './application/use-cases/cart/remove-item-from-cart.use-case';
import { GetUserCartUseCase } from './application/use-cases/cart/get-user-cart.use-case';
import { ClearCartUseCase } from './application/use-cases/cart/clear-cart.use-case';
import { GetUserOrderHistoryUseCase } from './application/use-cases/history/get-user-order-history.use-case';
import { GetOrderByIdUseCase } from './application/use-cases/history/get-order-by-id.use-case';
import { CheckoutSaga } from './application/sagas/checkout.saga';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Order', schema: OrderSchema },
      { name: 'Cart', schema: CartSchema },
      { name: 'Product', schema: ProductSchema },
      { name: 'Customer', schema: CustomerSchema },
      { name: 'Inventory', schema: InventorySchema },
    ]),
  ],
  controllers: [OrdersController, CartController],
  providers: [
    // Checkout Use Cases
    CreateOrderUseCase,
    CancelOrderUseCase,
    UpdateOrderStatusUseCase,
    // Cart Use Cases
    AddItemToCartUseCase,
    UpdateCartItemQuantityUseCase,
    RemoveItemFromCartUseCase,
    GetUserCartUseCase,
    ClearCartUseCase,
    // History Use Cases
    GetUserOrderHistoryUseCase,
    GetOrderByIdUseCase,
    // Sagas
    CheckoutSaga,
    // Repositories
    {
      provide: ORDER_REPOSITORY,
      useClass: MongoOrderRepository,
    },
    {
      provide: CART_REPOSITORY,
      useClass: MongoCartRepository,
    },
    {
      provide: PRODUCT_REPOSITORY,
      useClass: MongoProductRepository,
    },
    {
      provide: CUSTOMER_REPOSITORY,
      useClass: MongoCustomerRepository,
    },
    {
      provide: INVENTORY_REPOSITORY,
      useClass: MongoInventoryRepository,
    },
  ],
  exports: [
    ORDER_REPOSITORY,
    CART_REPOSITORY,
    PRODUCT_REPOSITORY,
    CUSTOMER_REPOSITORY,
    INVENTORY_REPOSITORY,
  ],
})
export class OrdersModule {}
