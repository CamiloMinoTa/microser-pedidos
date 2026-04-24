import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order as OrderEntity, OrderItem } from '../../domain/entities/order.entity';
import { OrderRepository } from '../../domain/ports/order.repository';
import { CustomerId } from '../../domain/value-objects/customer-id.value-object';
import { OrderId } from '../../domain/value-objects/order-id.value-object';
import { ProductId } from '../../domain/value-objects/product-id.value-object';
import { Quantity } from '../../domain/value-objects/quantity.value-object';
import { Money } from '../../domain/value-objects/money.value-object';
import { OrderStatus } from '../../domain/value-objects/order-status.value-object';
import { OrderDocument } from './schemas/order.schema';

@Injectable()
export class MongoOrderRepository implements OrderRepository {
  constructor(@InjectModel('Order') private orderModel: Model<OrderDocument>) {}

  async create(order: OrderEntity): Promise<OrderEntity> {
    const orderData = {
      customerId: order.customerId.toString(),
      items: order.items.map(item => ({
        productId: item.productId.toString(),
        quantity: item.quantity.toNumber(),
        price: item.price.getAmount(),
      })),
      totalAmount: order.totalAmount.getAmount(),
      status: order.status.toString(),
      createdAt: new Date(),
    };

    const createdOrder = new this.orderModel(orderData);
    const savedOrder = await createdOrder.save();
    return this.mapToDomain(savedOrder);
  }

  async findById(id: string): Promise<OrderEntity | null> {
    const orderDoc = await this.orderModel.findById(id).exec();
    return orderDoc ? this.mapToDomain(orderDoc) : null;
  }

  async findByUserId(userId: CustomerId): Promise<OrderEntity[]> {
    const orderDocs = await this.orderModel
      .find({ customerId: userId.toString() })
      .exec();
    return orderDocs.map(doc => this.mapToDomain(doc));
  }

  async findAll(): Promise<OrderEntity[]> {
    const orderDocs = await this.orderModel.find().exec();
    return orderDocs.map(doc => this.mapToDomain(doc));
  }

  async update(id: string, order: OrderEntity): Promise<OrderEntity | null> {
    const orderData = {
      customerId: order.customerId.toString(),
      items: order.items.map(item => ({
        productId: item.productId.toString(),
        quantity: item.quantity.toNumber(),
        price: item.price.getAmount(),
      })),
      totalAmount: order.totalAmount.getAmount(),
      status: order.status.toString(),
    };

    const updatedDoc = await this.orderModel
      .findByIdAndUpdate(id, orderData, { new: true })
      .exec();
    return updatedDoc ? this.mapToDomain(updatedDoc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.orderModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  private mapToDomain(doc: OrderDocument): OrderEntity {
    const customerId = new CustomerId(doc.customerId);
    const items = doc.items.map(
      item =>
        new OrderItem(
          new ProductId(item.productId),
          new Quantity(item.quantity),
          new Money(item.price),
        ),
    );

    return new OrderEntity(
      new OrderId(doc._id.toString()),
      customerId,
      items,
      new Money(doc.totalAmount),
      new OrderStatus(doc.status),
      doc.createdAt,
    );
  }
}