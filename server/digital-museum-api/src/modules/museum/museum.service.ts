import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AwardWork, AwardWorkDocument } from './schemas/award-work.schema';
import { CreateWorkDto } from './dto/create-work.dto';
import { GetWorksDto } from './dto/get-works.dto';

@Injectable()
export class MuseumService {
  constructor(
    @InjectModel(AwardWork.name) 
    private awardWorkModel: Model<AwardWorkDocument>,
  ) {}

  async createWork(createWorkDto: CreateWorkDto, files?: any[]): Promise<AwardWork> {
    const workData: any = {
      ...createWorkDto,
      images: [],
      audioUrl: null,
      certificateUrl: null,
      modelUrl: null,
    };

    if (files && files.length > 0) {
      for (const file of files) {
        // 修复路径处理，确保路径格式正确
        let relativePath = file.path.replace(/\\/g, '/');
        
        // 确保路径以 uploads 开始
        if (!relativePath.startsWith('uploads/')) {
          const pathParts = relativePath.split('/');
          const filename = pathParts[pathParts.length - 1];
          
          if (file.path.includes('images')) {
            relativePath = `uploads/images/${filename}`;
          } else if (file.path.includes('audio')) {
            relativePath = `uploads/audio/${filename}`;
          } else if (file.path.includes('certificates')) {
            relativePath = `uploads/certificates/${filename}`;
          } else if (file.path.includes('models')) {
            relativePath = `uploads/models/${filename}`;
          }
        }
        
        console.log(`处理文件: ${file.originalname}, 最终路径: ${relativePath}`);
        
        if (file.path.includes('images')) {
          workData.images.push(relativePath);
        } else if (file.path.includes('audio')) {
          workData.audioUrl = relativePath;
        } else if (file.path.includes('certificates')) {
          workData.certificateUrl = relativePath;
        } else if (file.path.includes('models')) {
          workData.modelUrl = relativePath;
        }
      }
    }

    console.log('最终保存的作品数据:', workData);
    const createdWork = new this.awardWorkModel(workData);
    return createdWork.save();
  }
  async getWorks(query: GetWorksDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const { category, year, keyword, status } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    
    if (category) {
      filter.category = category;
    }
    
    if (year) {
      filter.year = year;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { author: { $regex: keyword, $options: 'i' } },
        { school: { $regex: keyword, $options: 'i' } },
        { tags: { $in: [new RegExp(keyword, 'i')] } },
      ];
    }

    const [works, total] = await Promise.all([
      this.awardWorkModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.awardWorkModel.countDocuments(filter).exec(),
    ]);

    return {
      data: works,
      pagination: {
        current: page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getWorkById(id: string): Promise<AwardWork> {
    const work = await this.awardWorkModel.findById(id).exec();
    if (!work) {
      throw new NotFoundException(`作品 ID ${id} 未找到`);
    }

    await this.awardWorkModel.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).exec();

    return work;
  }

  async updateWork(id: string, updateData: Partial<CreateWorkDto>): Promise<AwardWork> {
    const updatedWork = await this.awardWorkModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    
    if (!updatedWork) {
      throw new NotFoundException(`作品 ID ${id} 未找到`);
    }
    
    return updatedWork;
  }

  async deleteWork(id: string): Promise<void> {
    const result = await this.awardWorkModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`作品 ID ${id} 未找到`);
    }
  }

  async getCategories(): Promise<string[]> {
    return this.awardWorkModel.distinct('category').exec();
  }

  async searchWorks(keyword: string): Promise<AwardWork[]> {
    return this.awardWorkModel
      .find({
        $or: [
          { title: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
          { tags: { $in: [new RegExp(keyword, 'i')] } },
        ],
        status: 'published',
      })
      .sort({ viewCount: -1, createdAt: -1 })
      .limit(20)
      .exec();
  }
}