import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product as ProductEntity } from '../../domain/entities/product.entity';
import { ProductRepository } from '../../domain/ports/product.repository';
import { ProductDocument } from './schemas/product.schema';

@Injectable()
export class MongoProductRepository implements ProductRepository {
  constructor(@InjectModel('Product') private productModel: Model<ProductDocument>) {}

  async create(product: ProductEntity): Promise<ProductEntity> {
    const productData = {
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdProduct = new this.productModel(productData);
    const savedProduct = await createdProduct.save();
    return this.mapToDomain(savedProduct);
  }

  async findById(id: string): Promise<ProductEntity | null> {
    const productDoc = await this.productModel.findById(id).exec();
    return productDoc ? this.mapToDomain(productDoc) : null;
  }

  async findByCategory(category: string): Promise<ProductEntity[]> {
    const productDocs = await this.productModel
      .find({ category })
      .exec();
    return productDocs.map(doc => this.mapToDomain(doc));
  }

  async findAll(): Promise<ProductEntity[]> {
    const productDocs = await this.productModel.find().exec();
    return productDocs.map(doc => this.mapToDomain(doc));
  }

  async update(id: string, product: Partial<ProductEntity>): Promise<ProductEntity | null> {
    const updateData = {
      ...product,
      updatedAt: new Date(),
    };

    const updatedDoc = await this.productModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    return updatedDoc ? this.mapToDomain(updatedDoc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.productModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async decreaseStock(id: string, quantity: number): Promise<ProductEntity | null> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      return null;
    }

    if (product.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    product.stock -= quantity;
    product.updatedAt = new Date();
    await product.save();
    return this.mapToDomain(product);
  }

  private mapToDomain(doc: ProductDocument): ProductEntity {
    return new ProductEntity(
      doc._id.toString(),
      doc.name,
      doc.description,
      doc.price,
      doc.category,
      doc.stock,
    );
  }
}
