import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AwardWorkDocument = AwardWork & Document;

@Schema({ timestamps: true })
export class AwardWork {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  author: string;

  @Prop({ required: true })
  school: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop()
  audioUrl: string;

  @Prop()
  certificateUrl: string;

  @Prop()
  modelUrl: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ 
    type: String, 
    enum: ['draft', 'published', 'archived'], 
    default: 'draft' 
  })
  status: string;
}

export const AwardWorkSchema = SchemaFactory.createForClass(AwardWork);