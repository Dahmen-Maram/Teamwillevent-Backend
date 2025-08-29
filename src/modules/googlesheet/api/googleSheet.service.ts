import { Injectable, OnModuleInit } from '@nestjs/common';
import { google } from 'googleapis';
import * as path from 'path';
import { existsSync } from 'fs';

@Injectable()
export class GoogleSheetsService {
  private sheets: any;

  constructor() {
    try {
      const credentialsPath = path.join(process.cwd(), 'config', 'credentials.json');
      console.log('Looking for credentials at:', credentialsPath);
      
      if (!existsSync(credentialsPath)) {
        throw new Error(`Credentials file not found at: ${credentialsPath}`);
      }

      const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.file'
      ],
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      console.log('Google Sheets service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Sheets service:', error);
      throw error;
    }
  }

  async getResponses(sheetId: string, range: string = 'A:Z') {
    try {
      console.log('Attempting to fetch sheet data for ID:', sheetId);
      console.log('Using sheets API instance:', !!this.sheets);
      
      const res = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
      });
      
      console.log('Response received:', res ? 'success' : 'null');
      if (!res || !res.data) {
        throw new Error('No data received from Google Sheets API');
      }
      
      return res.data.values || []; // Return empty array if no values
    } catch (error) {
      console.error('GoogleSheetsService error:', error);
      throw new Error(`Failed to fetch sheet data: ${error.message}`);
    }
  }
}
