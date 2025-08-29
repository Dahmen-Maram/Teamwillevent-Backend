import { Controller, Get, Param, OnModuleInit } from '@nestjs/common';
import { GoogleSheetsService } from './googleSheet.service';

@Controller('forms')
export class GoogleSheetController implements OnModuleInit {
  constructor(private readonly sheetsService: GoogleSheetsService) {
    console.log('GoogleSheetController constructor called');
  }

  onModuleInit() {
    console.log('GoogleSheetController initialized');
  }

  // Exemple: GET /forms/<sheetId>
  @Get(':sheetId')
  async getFormResponses(@Param('sheetId') sheetId: string) {
    console.log('Accessing sheet with ID:', sheetId);
    try {
      const responses = await this.sheetsService.getResponses(sheetId);
      console.log('Got responses:', responses ? 'data found' : 'no data');
      return responses;
    } catch (error) {
      console.error('Error getting responses:', error);
      throw error;
    }
  }
}
