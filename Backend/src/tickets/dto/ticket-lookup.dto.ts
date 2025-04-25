import { ApiProperty } from '@nestjs/swagger';

export class TicketLookupDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}

export class TicketTypeDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description?: string | null;
}

export class TicketUserDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ nullable: true })
  username: string | null;
}