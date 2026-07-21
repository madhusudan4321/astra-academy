import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProgress extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  completedLessons: mongoose.Types.ObjectId[];
  lastWatchedLessonId?: mongoose.Types.ObjectId;
  lastWatchedChapterId?: mongoose.Types.ObjectId;
  watchTime: number; // total seconds watched
  completionPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

const progressSchema = new Schema<IProgress>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    courseId: { type: Schema.Types.ObjectId, required: true, ref: 'Course' },
    completedLessons: [{ type: Schema.Types.ObjectId }],
    lastWatchedLessonId: { type: Schema.Types.ObjectId },
    lastWatchedChapterId: { type: Schema.Types.ObjectId },
    watchTime: { type: Number, default: 0 },
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const Progress: Model<IProgress> = mongoose.model<IProgress>('Progress', progressSchema);
export default Progress;
