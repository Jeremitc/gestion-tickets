import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketLookupDto, TicketTypeDto, TicketUserDto,  } from './ticket-lookup.dto';
import { CommentDto } from './comment.dto';

export class TicketSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({ type: () => TicketLookupDto })
  status: TicketLookupDto;

  @ApiProperty({ type: () => TicketLookupDto })
  priority: TicketLookupDto;

  @ApiProperty({ type: () => TicketLookupDto })
  category: TicketLookupDto;

  @ApiProperty({ type: () => TicketTypeDto })
  type: TicketTypeDto;

  @ApiProperty({ type: () => TicketUserDto })
  creator: TicketUserDto;

  @ApiPropertyOptional({ type: () => TicketUserDto, nullable: true })
  assignedTo?: TicketUserDto | null;

  @ApiProperty({ type: () => [CommentDto]})
  comments: CommentDto[];

  @ApiProperty ({ type: [Object], description: 'URLS de los archivos adjuntos'})
  attachments: { id: number; file_url: string }[];

  
}