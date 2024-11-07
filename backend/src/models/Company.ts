import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  email: string;
  status: 'active' | 'inactive';
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    unique: true
  },
  email: {
    type: String,
    required: [true, 'Company email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  userCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  versionKey: false
});

// Add indexes
CompanySchema.index({ name: 1 });
CompanySchema.index({ email: 1 });
CompanySchema.index({ status: 1 });

export default mongoose.model<ICompany>('Company', CompanySchema);