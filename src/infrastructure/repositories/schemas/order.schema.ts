import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema()
export class Order {
  @Prop({ required: true })
  customerId!: string;

  @Prop({ type: [Object], required: true })
  items!: Array<{ productId: string; quantity: number; price: number }>;

  @Prop({ required: true })
  totalAmount!: number;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ default: 'pending' })
  status!: string;

  constructor() {
    // Mongoose will handle initialization
  }
}

export const OrderSchema = SchemaFactory.createForClass(Order);