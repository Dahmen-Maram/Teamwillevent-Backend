// src/events/dto/create-event.dto.ts
import { IsString, IsDateString, IsInt, Matches} from 'class-validator';

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

  @IsInt()
  capacite: number;
  @IsString()
  imageUrl?: string; // Optional field for event image URL
}
