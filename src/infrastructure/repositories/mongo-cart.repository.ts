import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart as CartEntity, CartItem } from '../../domain/entities/cart.entity';
import { CartRepository } from '../../application/ports/cart.repository';
import { CustomerId } from '../../domain/value-objects/customer-id.value-object';
import { ProductId } from '../../domain/value-objects/product-id.value-object';
import { Quantity } from '../../domain/value-objects/quantity.value-object';
import { Money } from '../../domain/value-objects/money.value-object';
import { CartDocument } from './schemas/cart.schema';

@Injectable()
export class MongoCartRepository implements CartRepository {
  constructor(@InjectModel('Cart') private cartModel: Model<CartDocument>) {}

  async create(cart: CartEntity): Promise<CartEntity> {
    const cartData = {
      userId: cart.userId.toString(),
      items: cart.items.map(item => ({
        productId: item.productId.toString(),
        quantity: item.quantity.toNumber(),
        price: item.price.getAmount(),
      })),
      totalAmount: cart.totalAmount.getAmount(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdCart = new this.cartModel(cartData);
    const savedCart = await createdCart.save();
    return this.mapToDomain(savedCart);
  }

  async findByUserId(userId: CustomerId): Promise<CartEntity | null> {
    const cartDoc = await this.cartModel
      .findOne({ userId: userId.toString() })
      .exec();
    return cartDoc ? this.mapToDomain(cartDoc) : null;
  }

  async update(id: string, cart: CartEntity): Promise<CartEntity | null> {
    const cartData = {
      items: cart.items.map(item => ({
        productId: item.productId.toString(),
        quantity: item.quantity.toNumber(),
        price: item.price.getAmount(),
      })),
      totalAmount: cart.totalAmount.getAmount(),
      updatedAt: new Date(),
    };

    const updatedDoc = await this.cartModel
      .findByIdAndUpdate(id, cartData, { new: true })
      .exec();
    return updatedDoc ? this.mapToDomain(updatedDoc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.cartModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  private mapToDomain(doc: CartDocument): CartEntity {
    const userId = new CustomerId(doc.userId);
    const items = doc.items.map(
      item =>
        new CartItem(
          new ProductId(item.productId),
          new Quantity(item.quantity),
          new Money(item.price),
        ),
    );

    return new CartEntity(
      doc._id.toString(),
      userId,
      items,
      new Money(doc.totalAmount),
    );
  }
}
