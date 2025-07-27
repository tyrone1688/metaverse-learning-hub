import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MuseumController } from './museum.controller';
import { MuseumService } from './museum.service';
import { AwardWork, AwardWorkSchema } from './schemas/award-work.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AwardWork.name, schema: AwardWorkSchema },
    ]),
  ],
  controllers: [MuseumController],
  providers: [MuseumService],
  exports: [MuseumService],
})
export class MuseumModule {}