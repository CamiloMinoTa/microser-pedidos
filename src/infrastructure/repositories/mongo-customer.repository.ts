import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer } from '../../application/ports/customer.repository';
import { CustomerRepository } from '../../application/ports/customer.repository';
import { CustomerId } from '../../domain/value-objects/customer-id.value-object';
import { CustomerDocument } from './schemas/customer.schema';

@Injectable()
export class MongoCustomerRepository implements CustomerRepository {
  constructor(@InjectModel('Customer') private customerModel: Model<CustomerDocument>) {}

  async create(customer: Customer): Promise<Customer> {
    const customerData = {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdCustomer = new this.customerModel(customerData);
    const savedCustomer = await createdCustomer.save();
    return this.mapToDomain(savedCustomer);
  }

  async findById(id: CustomerId): Promise<Customer | null> {
    const customerDoc = await this.customerModel
      .findById(id.toString())
      .exec();
    return customerDoc ? this.mapToDomain(customerDoc) : null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const customerDoc = await this.customerModel
      .findOne({ email })
      .exec();
    return customerDoc ? this.mapToDomain(customerDoc) : null;
  }

  async findAll(): Promise<Customer[]> {
    const customerDocs = await this.customerModel.find().exec();
    return customerDocs.map(doc => this.mapToDomain(doc));
  }

  async update(id: CustomerId, customer: Partial<Customer>): Promise<Customer | null> {
    const updateData = {
      ...customer,
      updatedAt: new Date(),
    };

    const updatedDoc = await this.customerModel
      .findByIdAndUpdate(id.toString(), updateData, { new: true })
      .exec();
    return updatedDoc ? this.mapToDomain(updatedDoc) : null;
  }

  async delete(id: CustomerId): Promise<boolean> {
    const result = await this.customerModel
      .findByIdAndDelete(id.toString())
      .exec();
    return !!result;
  }

  private mapToDomain(doc: CustomerDocument): Customer {
    return new Customer(
      new CustomerId(doc._id.toString()),
      doc.name,
      doc.email,
      doc.phone,
      doc.address,
      doc.createdAt,
    );
  }
}
