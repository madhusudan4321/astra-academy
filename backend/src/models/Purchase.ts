import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPurchase extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'refunded';
  paymentMethod?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseSchema = new Schema<IPurchase>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    courseId: { type: Schema.Types.ObjectId, required: true, ref: 'Course' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'completed', 'refunded'],
      default: 'completed',
    },
    paymentMethod: { type: String },
    transactionId: { type: String },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate purchases
purchaseSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const Purchase: Model<IPurchase> = mongoose.model<IPurchase>('Purchase', purchaseSchema);
export default Purchase;
