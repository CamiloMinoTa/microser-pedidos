import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment } from '../../application/ports/payment.repository';
import { PaymentRepository } from '../../application/ports/payment.repository';
import { OrderId } from '../../domain/value-objects/order-id.value-object';
import { Money } from '../../domain/value-objects/money.value-object';
import { PaymentDocument } from './schemas/payment.schema';

@Injectable()
export class MongoPaymentRepository implements PaymentRepository {
  constructor(@InjectModel('Payment') private paymentModel: Model<PaymentDocument>) {}

  async create(payment: Payment): Promise<Payment> {
    const paymentData = {
      orderId: payment.orderId.toString(),
      amount: payment.amount.getAmount(),
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      createdAt: new Date(),
    };

    const createdPayment = new this.paymentModel(paymentData);
    const savedPayment = await createdPayment.save();
    return this.mapToDomain(savedPayment);
  }

  async findById(id: string): Promise<Payment | null> {
    const paymentDoc = await this.paymentModel.findById(id).exec();
    return paymentDoc ? this.mapToDomain(paymentDoc) : null;
  }

  async findByOrderId(orderId: OrderId): Promise<Payment | null> {
    const paymentDoc = await this.paymentModel
      .findOne({ orderId: orderId.toString() })
      .exec();
    return paymentDoc ? this.mapToDomain(paymentDoc) : null;
  }

  async findAll(): Promise<Payment[]> {
    const paymentDocs = await this.paymentModel.find().exec();
    return paymentDocs.map(doc => this.mapToDomain(doc));
  }

  async update(id: string, payment: Partial<Payment>): Promise<Payment | null> {
    const updateData = {
      ...payment,
      amount: payment.amount?.getAmount(),
      orderId: payment.orderId?.toString(),
    };

    const updatedDoc = await this.paymentModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    return updatedDoc ? this.mapToDomain(updatedDoc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.paymentModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  private mapToDomain(doc: PaymentDocument): Payment {
    return new Payment(
      doc._id.toString(),
      new OrderId(doc.orderId),
      new Money(doc.amount),
      doc.status as 'pending' | 'completed' | 'failed',
      doc.paymentMethod,
      doc.transactionId,
      doc.createdAt,
    );
  }
}
