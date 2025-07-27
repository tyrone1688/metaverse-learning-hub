import { IsString, IsNumber, IsArray, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkDto {
  @ApiProperty({ description: '作品标题' })
  @IsString()
  title: string;

  @ApiProperty({ description: '作品描述' })
  @IsString()
  description: string;

  @ApiProperty({ description: '作品分类' })
  @IsString()
  category: string;

  @ApiProperty({ description: '获奖年份' })
  @IsNumber()
  year: number;

  @ApiProperty({ description: '作者' })
  @IsString()
  author: string;

  @ApiProperty({ description: '学校' })
  @IsString()
  school: string;

  @ApiProperty({ description: '标签', required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ description: '状态', required: false })
  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: string;
}