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
import { extname, join } from 'path';
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
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedTypes = /jpeg|jpg|png|gif|mp3|wav|pdf|obj|fbx|gltf|glb/;
        const extName = allowedTypes.test(extname(file.originalname).toLowerCase());
        const mimeType = allowedTypes.test(file.mimetype);
        
        if (mimeType && extName) {
          return callback(null, true);
        } else {
          callback(new Error('不支持的文件类型'), false);
        }
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  )
  async createWork(
    @Body() createWorkDto: CreateWorkDto,
    @UploadedFiles() files?: Array<Express.Multer.File>,
  ) {
    try {
      console.log('=== 创建作品请求开始 ===');
      console.log('请求数据:', createWorkDto);
      console.log('上传文件:', files);
      
      const result = await this.museumService.createWork(createWorkDto, files);
      
      console.log('创建成功:', result);
      console.log('=== 创建作品请求结束 ===');
      
      return {
        statusCode: HttpStatus.CREATED,
        message: '作品创建成功',
        data: result,
      };
    } catch (error) {
      console.error('=== 创建作品失败 ===');
      console.error('错误详情:', error);
      console.error('错误堆栈:', error.stack);
      throw error;
    }
  }

  // 添加一个简化的测试接口
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