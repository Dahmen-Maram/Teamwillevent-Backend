// src/events/dto/create-event.dto.ts
import { IsString, IsDateString, IsInt, Matches, IsOptional, IsBoolean, IsArray, IsUUID} from 'class-validator';
import { Column } from 'typeorm';

export class CreateEventDto {
  @IsString()
  titre: string;

  @IsString()
  description: string;

  @IsDateString()
  date: string;
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'heure must be in HH:mm format',})
heure: string;


  @IsString()
  lieu: string;

  @IsString()
  @IsOptional()
  sheetId?: string;

  @IsInt()
  capacite: number;
  @Column({ nullable: true })
formUrl: string;


  @IsString()
  imageUrl?: string;
   // Optional field for event image URL
   @IsOptional()
@IsBoolean()
isPrivate?: boolean;
@IsOptional()
@IsArray()
@IsUUID('all', { each: true })
invitedIds?: string[];

}