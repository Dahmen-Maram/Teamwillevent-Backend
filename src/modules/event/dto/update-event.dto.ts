// src/events/dto/update-event.dto.ts
import { IsString, IsDateString, IsInt, IsOptional } from 'class-validator';

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

  @IsInt()
  @IsOptional()
  capacite?: number;
  @IsString()
  @IsOptional()
  heure?: string;
  @IsString()
  @IsOptional()
  status?: string;
}
