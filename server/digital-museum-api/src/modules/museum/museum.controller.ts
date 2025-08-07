import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { MuseumService } from './museum.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { GetWorksDto } from './dto/get-works.dto';

@ApiTags('数字馆')
@Controller('api/museum')
export class MuseumController {
  constructor(private readonly museumService: MuseumService) {}

  @Post('works')
  @ApiOperation({ summary: '创建作品' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: diskStorage({
        destination: (req, file, callback) => {
          let uploadPath = './uploads';
          if (file.mimetype.startsWith('image/')) {
            uploadPath = './uploads/images';
          } else if (file.mimetype.startsWith('audio/')) {
            uploadPath = './uploads/audio';
          } else if (file.mimetype === 'application/pdf') {
            uploadPath = './uploads/certificates';
          } else if (file.originalname.match(/\.(obj|fbx|gltf|glb)$/i)) {
            uploadPath = './uploads/models';
          }
          
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          
          callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedTypes = /jpeg|jpg|png|gif|mp3|wav|mp4|pdf|obj|fbx|gltf|glb/;
        const extName = allowedTypes.test(extname(file.originalname).toLowerCase());
        const mimeType = file.mimetype.startsWith('image/') || 
                        file.mimetype.startsWith('audio/') ||
                        file.mimetype.startsWith('video/') ||
                        file.mimetype === 'application/pdf' ||
                        allowedTypes.test(file.mimetype);
        
        if (mimeType || extName) {
          return callback(null, true);
        } else {
          callback(new Error('不支持的文件类型'), false);
        }
      },
      limits: {
        fileSize: 100 * 1024 * 1024,
      },
    }),
  )
  async createWork(
    @Body() body: any,
    @UploadedFiles() files?: Array<Express.Multer.File>,
  ) {
    try {
      console.log('=== 创建作品请求开始 ===');
      console.log('原始body数据:', body);
      console.log('上传文件:', files?.map(f => ({ 
        fieldname: f.fieldname, 
        filename: f.filename, 
        originalname: f.originalname,
        size: f.size,
        mimetype: f.mimetype,
        path: f.path
      })));
      
      const createWorkDto: CreateWorkDto = {
        title: body.title,
        description: body.description,
        category: body.category,
        year: parseInt(body.year),
        author: body.author,
        school: body.school,
        status: body.status || 'draft',
        tags: []
      };

      if (body.tags) {
        if (Array.isArray(body.tags)) {
          createWorkDto.tags = body.tags.filter(tag => tag && tag.trim() !== '');
        } else if (typeof body.tags === 'string' && body.tags.trim() !== '') {
          createWorkDto.tags = [body.tags.trim()];
        }
      }

      console.log('处理后的数据:', createWorkDto);

      if (!createWorkDto.title || !createWorkDto.description || !createWorkDto.author) {
        throw new Error('缺少必填字段');
      }

      if (isNaN(createWorkDto.year)) {
        throw new Error('年份必须是有效数字');
      }

      const result = await this.museumService.createWork(createWorkDto, files);
      
      console.log('创建成功');
      console.log('=== 创建作品请求结束 ===');
      
      return {
        statusCode: HttpStatus.CREATED,
        message: '作品创建成功',
        data: result,
      };
    } catch (error) {
      console.error('=== 创建作品失败 ===');
      console.error('错误详情:', error);
      throw error;
    }
  }

  @Post('works/simple')
  @ApiOperation({ summary: '创建作品（简化测试版）' })
  async createWorkSimple(@Body() createWorkDto: CreateWorkDto) {
    try {
      console.log('=== 简化创建作品请求 ===');
      console.log('请求数据:', createWorkDto);
      
      const result = await this.museumService.createWork(createWorkDto);
      
      console.log('简化创建成功:', result);
      
      return {
        statusCode: HttpStatus.CREATED,
        message: '作品创建成功（简化版）',
        data: result,
      };
    } catch (error) {
      console.error('=== 简化创建失败 ===');
      console.error('错误详情:', error);
      throw error;
    }
  }

  @Get('works')
  @ApiOperation({ summary: '获取作品列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getWorks(@Query() query: GetWorksDto) {
    return {
      statusCode: HttpStatus.OK,
      message: '获取成功',
      ...(await this.museumService.getWorks(query)),
    };
  }

  @Get('works/:id')
  @ApiOperation({ summary: '获取作品详情' })
  async getWork(@Param('id') id: string) {
    return {
      statusCode: HttpStatus.OK,
      message: '获取成功',
      data: await this.museumService.getWorkById(id),
    };
  }

  @Put('works/:id')
  @ApiOperation({ summary: '更新作品' })
  async updateWork(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateWorkDto>,
  ) {
    return {
      statusCode: HttpStatus.OK,
      message: '更新成功',
      data: await this.museumService.updateWork(id, updateData),
    };
  }

  @Delete('works/:id')
  @ApiOperation({ summary: '删除作品' })
  async deleteWork(@Param('id') id: string) {
    await this.museumService.deleteWork(id);
    return {
      statusCode: HttpStatus.OK,
      message: '删除成功',
    };
  }

  @Get('categories')
  @ApiOperation({ summary: '获取分类列表' })
  async getCategories() {
    return {
      statusCode: HttpStatus.OK,
      message: '获取成功',
      data: await this.museumService.getCategories(),
    };
  }

  @Get('search')
  @ApiOperation({ summary: '搜索作品' })
  async searchWorks(@Query('keyword') keyword: string) {
    return {
      statusCode: HttpStatus.OK,
      message: '搜索完成',
      data: await this.museumService.searchWorks(keyword),
    };
  }
}