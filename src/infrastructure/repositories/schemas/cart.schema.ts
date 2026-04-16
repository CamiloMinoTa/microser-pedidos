import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CartDocument = Cart & Document;

@Schema()
export class Cart {
  @Prop({ required: true })
  userId!: string;

  @Prop({
    type: [
      {
        productId: String,
        quantity: Number,
        price: Number,
      },
    ],
    default: [],
  })
  items!: Array<{ productId: string; quantity: number; price: number }>;

  @Prop({ required: true, default: 0 })
  totalAmount!: number;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ default: Date.now })
  updatedAt!: Date;

  constructor() {
    // Mongoose will handle initialization
  }
}

export const CartSchema = SchemaFactory.createForClass(Cart);
