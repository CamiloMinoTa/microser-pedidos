import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InventoryDocument = Inventory & Document;

@Schema()
export class Inventory {
  @Prop({ required: true, unique: true, index: true })
  productId!: string;

  @Prop({ required: true, default: 0 })
  quantity!: number;

  @Prop({ required: true, default: 0 })
  reservedQuantity!: number;

  @Prop({ default: Date.now })
  lastUpdated!: Date;

  constructor() {
    // Mongoose will handle initialization
  }
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);
