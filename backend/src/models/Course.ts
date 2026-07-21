import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILesson extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  blobName: string;
  container: string;
  duration?: number; // in seconds
  order: number;
  notesBlobName?: string;
  notesContainer?: string;
  chapterId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChapter extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  order: number;
  courseId: mongoose.Types.ObjectId;
  lessons: ILesson[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICourse extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  shortDescription: string;
  thumbnailBlobName: string;
  thumbnailContainer: string;
  price: number;
  published: boolean;
  totalLessons: number;
  totalDuration: number; // in seconds
  tags: string[];
  chapters: IChapter[];
  createdAt: Date;
  updatedAt: Date;
}

// Lesson Schema
const lessonSchema = new Schema<ILesson>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    blobName: { type: String, required: true },
    container: { type: String, required: true },
    duration: { type: Number, default: 0 },
    order: { type: Number, required: true },
    notesBlobName: { type: String },
    notesContainer: { type: String },
    chapterId: { type: Schema.Types.ObjectId, required: true },
    courseId: { type: Schema.Types.ObjectId, required: true, ref: 'Course' },
  },
  { timestamps: true }
);

// Chapter Schema
const chapterSchema = new Schema<IChapter>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    order: { type: Number, required: true },
    courseId: { type: Schema.Types.ObjectId, required: true, ref: 'Course' },
    lessons: [lessonSchema],
  },
  { timestamps: true }
);

// Course Schema
const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    shortDescription: { type: String, required: true, maxlength: 200 },
    thumbnailBlobName: { type: String, required: true },
    thumbnailContainer: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    published: { type: Boolean, default: false },
    totalLessons: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }],
    chapters: [chapterSchema],
  },
  { timestamps: true }
);

const Course: Model<ICourse> = mongoose.model<ICourse>('Course', courseSchema);
export default Course;
