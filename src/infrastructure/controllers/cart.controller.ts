import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AddItemToCartUseCase } from '../../application/use-cases/cart/add-item-to-cart.use-case';
import { ClearCartUseCase } from '../../application/use-cases/cart/clear-cart.use-case';
import { GetUserCartUseCase } from '../../application/use-cases/cart/get-user-cart.use-case';
import { RemoveItemFromCartUseCase } from '../../application/use-cases/cart/remove-item-from-cart.use-case';
import { UpdateCartItemQuantityUseCase } from '../../application/use-cases/cart/update-cart-item-quantity.use-case';
import { Cart } from '../../domain/entities/cart.entity';
import { CustomerId } from '../../domain/value-objects/customer-id.value-object';
import { Money } from '../../domain/value-objects/money.value-object';
import { ProductId } from '../../domain/value-objects/product-id.value-object';
import { Quantity } from '../../domain/value-objects/quantity.value-object';

@Controller('cart')
export class CartController {
  constructor(
    private readonly addItemToCartUseCase: AddItemToCartUseCase,
    private readonly updateCartItemQuantityUseCase: UpdateCartItemQuantityUseCase,
    private readonly removeItemFromCartUseCase: RemoveItemFromCartUseCase,
    private readonly getUserCartUseCase: GetUserCartUseCase,
    private readonly clearCartUseCase: ClearCartUseCase,
  ) {}

  @Get(':userId')
  async getCart(@Param('userId') userId: string) {
    const cart = await this.getUserCartUseCase.execute(new CustomerId(userId));
    if (!cart) {
      throw new NotFoundException(`Carrito de ${userId} no encontrado`);
    }

    return this.toResponse(cart);
  }

  @Post(':userId/items')
  async addItem(
    @Param('userId') userId: string,
    @Body() body: { productId: string; quantity: number; price: number },
  ) {
    this.validateItemBody(body);

    const cart = await this.addItemToCartUseCase.execute(
      new CustomerId(userId),
      {
        productId: new ProductId(body.productId),
        quantity: new Quantity(Number(body.quantity)),
        price: new Money(Number(body.price)),
      },
    );

    return this.toResponse(cart);
  }

  @Patch(':userId/items/:productId')
  async updateQuantity(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
    @Body() body: { quantity: number },
  ) {
    if (body.quantity == null) {
      throw new BadRequestException('quantity es obligatorio');
    }

    try {
      const cart = await this.updateCartItemQuantityUseCase.execute(
        new CustomerId(userId),
        new ProductId(productId),
        new Quantity(Number(body.quantity)),
      );

      if (!cart) {
        throw new NotFoundException(`Carrito de ${userId} no encontrado`);
      }

      return this.toResponse(cart);
    } catch (error) {
      this.handleUseCaseError(error);
    }
  }

  @Delete(':userId/items/:productId')
  async removeItem(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
  ) {
    try {
      const cart = await this.removeItemFromCartUseCase.execute(
        new CustomerId(userId),
        new ProductId(productId),
      );

      if (!cart) {
        throw new NotFoundException(`Carrito de ${userId} no encontrado`);
      }

      return this.toResponse(cart);
    } catch (error) {
      this.handleUseCaseError(error);
    }
  }

  @Delete(':userId')
  async clearCart(@Param('userId') userId: string) {
    const cleared = await this.clearCartUseCase.execute(new CustomerId(userId));
    if (!cleared) {
      throw new NotFoundException(`Carrito de ${userId} no encontrado`);
    }

    return { cleared: true };
  }

  private validateItemBody(body: {
    productId: string;
    quantity: number;
    price: number;
  }) {
    if (!body?.productId || body.quantity == null || body.price == null) {
      throw new BadRequestException(
        'productId, quantity y price son obligatorios',
      );
    }
  }

  private handleUseCaseError(error: unknown): never {
    if (error instanceof NotFoundException) {
      throw error;
    }

    if (error instanceof Error) {
      throw new BadRequestException(error.message);
    }

    throw new BadRequestException('No se pudo procesar la operacion');
  }

  private toResponse(cart: Cart) {
    return {
      id: cart.id,
      userId: cart.userId.toString(),
      items: cart.items.map((item) => ({
        productId: item.productId.toString(),
        quantity: item.quantity.toNumber(),
        price: item.price.getAmount(),
      })),
      totalAmount: cart.totalAmount.getAmount(),
    };
  }
}
