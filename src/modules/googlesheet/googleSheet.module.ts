import { Module } from '@nestjs/common';
import { GoogleSheetsService } from './api/googleSheet.service';
import { GoogleSheetController } from './api/googleSheet.controller';

@Module({
  imports: [],
  providers: [GoogleSheetsService],
  controllers: [GoogleSheetController],
  exports: [GoogleSheetsService]
})
export class GoogleSheetModule {}
