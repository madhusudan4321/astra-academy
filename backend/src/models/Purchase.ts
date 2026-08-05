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
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
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
      default: 'pending',
    },
    paymentMethod: { type: String, default: 'razorpay' },
    transactionId: { type: String },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
  },
  { timestamps: true }
);

// Prevent duplicate *completed* purchases (partial unique index).
// Pending/refunded records are allowed to coexist so the payment flow
// can safely create and clean-up pending orders without duplicate-key errors.
purchaseSchema.index(
  { userId: 1, courseId: 1 },
  { unique: true, partialFilterExpression: { status: 'completed' } }
);

// Speed up look-ups by order ID during payment verification
purchaseSchema.index({ razorpayOrderId: 1 });

const Purchase: Model<IPurchase> = mongoose.model<IPurchase>('Purchase', purchaseSchema);
export default Purchase;
