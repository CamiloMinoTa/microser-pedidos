import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema()
export class Payment {
  @Prop({ required: true })
  orderId!: string;

  @Prop({ required: true })
  amount!: number;

  @Prop({ enum: ['pending', 'completed', 'failed'], default: 'pending' })
  status!: string;

  @Prop({ required: true })
  paymentMethod!: string;

  @Prop({ required: true })
  transactionId!: string;

  @Prop({ default: Date.now })
  createdAt!: Date;

  constructor() {
    // Mongoose will handle initialization
  }
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
