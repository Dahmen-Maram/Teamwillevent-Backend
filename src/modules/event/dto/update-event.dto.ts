// src/events/dto/update-event.dto.ts
import { IsString, IsDateString, IsInt, IsOptional, IsBoolean, IsArray, IsUUID } from 'class-validator';
import { Column } from 'typeorm';

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  titre?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  lieu?: string;

  @IsString()
  @IsOptional()
  sheetId?: string | null;

  @IsInt()
  @IsOptional()
  capacite?: number;
  @IsString()
  @IsOptional()
  heure?: string;
  @IsString()
  @IsOptional()
  status?: string;
  @IsString()
  @IsOptional()
  formUrl?: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
@IsOptional()
@IsArray()
@IsUUID('all', { each: true })
invitedUserIds?: string[];

}
