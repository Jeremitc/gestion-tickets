import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Req,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import { TicketsService } from './tickets.service';
  import { CreateTicketDto } from './dto/create-ticket.dto';
  import { UpdateTicketDto } from './dto/update-ticket.dto';
  import { CreateCommentDto } from './dto/comment.dto';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
    ApiParam,
  } from '@nestjs/swagger';
  import { TicketDto } from './dto/ticket.dto';
  import { TicketSummaryDto } from './dto/ticket-summary.dto';
  import { CommentDto } from './dto/comment.dto';
  import { TicketLookupDto, TicketTypeDto } from './dto/ticket-lookup.dto';
  
  @ApiTags('Tickets')
  @Controller('tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) {}
  
    @Post()
    @ApiOperation({ summary: 'Crear un nuevo ticket' })
    @ApiBody({ type: CreateTicketDto })
    @ApiResponse({ status: 201, description: 'Ticket creado.', type: TicketDto })
    @ApiResponse({ status: 400, description: 'Datos inválidos.' })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    async create(@Body() createTicketDto: CreateTicketDto, @Req() req): Promise<any> {
      return this.ticketsService.create(createTicketDto, req.user);
    }
  
    @Get()
    @ApiOperation({ summary: 'Obtener lista de tickets' })
    @ApiResponse({ status: 200, description: 'Lista de tickets.', type: [TicketSummaryDto] })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
    async findAll(@Req() req): Promise<any[]> {
      return this.ticketsService.findAll(req.user);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Obtener detalles de un ticket' })
    @ApiParam({ name: 'id', type: Number, description: 'ID del ticket' })
    @ApiResponse({ status: 200, description: 'Detalles del ticket.', type: TicketDto })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    @ApiResponse({ status: 403, description: 'No tienes permiso para ver este ticket.' })
    @ApiResponse({ status: 404, description: 'Ticket no encontrado.' })
    async findOne(@Param('id', ParseIntPipe) id: number, @Req() req): Promise<any> {
      return this.ticketsService.findOne(id, req.user);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar un ticket existente' })
    @ApiParam({ name: 'id', type: Number, description: 'ID del ticket' })
    @ApiBody({ type: UpdateTicketDto })
    @ApiResponse({ status: 200, description: 'Ticket actualizado.', type: TicketDto })
    @ApiResponse({ status: 400, description: 'Datos inválidos.' })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    @ApiResponse({ status: 403, description: 'No tienes permiso para actualizar este ticket.' })
    @ApiResponse({ status: 404, description: 'Ticket no encontrado.' })
    async update(
      @Param('id', ParseIntPipe) id: number,
      @Body() updateTicketDto: UpdateTicketDto,
      @Req() req,
    ): Promise<any> {
      return this.ticketsService.update(id, updateTicketDto, req.user);
    }
  
    @Post(':id/comments')
    @ApiOperation({ summary: 'Añadir comentario a un ticket' })
    @ApiParam({ name: 'id', type: Number, description: 'ID del ticket' })
    @ApiBody({ type: CreateCommentDto })
    @ApiResponse({ status: 201, description: 'Comentario añadido.', type: CommentDto })
    @ApiResponse({ status: 400, description: 'Datos inválidos.' })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    @ApiResponse({ status: 403, description: 'No tienes permiso para comentar.' })
    @ApiResponse({ status: 404, description: 'Ticket no encontrado.' })
    async addComment(
      @Param('id', ParseIntPipe) ticketId: number,
      @Body() createCommentDto: CreateCommentDto,
      @Req() req,
    ): Promise<any> {
      return this.ticketsService.addComment(ticketId, createCommentDto, req.user);
    }
  
    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar un ticket (solo admin)' })
    @ApiParam({ name: 'id', type: Number, description: 'ID del ticket' })
    @ApiResponse({ status: 204, description: 'Ticket eliminado.' })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    @ApiResponse({ status: 403, description: 'No autorizado (no admin).' })
    @ApiResponse({ status: 404, description: 'Ticket no encontrado.' })
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Param('id', ParseIntPipe) id: number, @Req() req): Promise<void> {
      return this.ticketsService.delete(id, req.user);
    }
  
    @Get('lookup/statuses')
    @ApiOperation({ summary: 'Obtener lista de estados posibles' })
    @ApiResponse({ status: 200, description: 'Lista de estados.', type: [TicketLookupDto] })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
    async getStatuses(): Promise<TicketLookupDto[]> {
      return this.ticketsService.findAllStatuses();
    }
  
    @Get('lookup/priorities')
    @ApiOperation({ summary: 'Obtener lista de prioridades posibles' })
    @ApiResponse({ status: 200, description: 'Lista de prioridades.', type: [TicketLookupDto] })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
    async getPriorities(): Promise<TicketLookupDto[]> {
      return this.ticketsService.findAllPriorities();
    }
  
    @Get('lookup/categories')
    @ApiOperation({ summary: 'Obtener lista de categorías posibles' })
    @ApiResponse({ status: 200, description: 'Lista de categorías.', type: [TicketLookupDto] })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
    async getCategories(): Promise<TicketLookupDto[]> {
      return this.ticketsService.findAllCategories();
    }
  
    @Get('lookup/ticket-types')
    @ApiOperation({ summary: 'Obtener lista de tipos de ticket posibles' })
    @ApiResponse({ status: 200, description: 'Lista de tipos de ticket.', type: [TicketTypeDto] })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
    async getTicketTypes(): Promise<TicketTypeDto[]> {
      return this.ticketsService.findAllTicketTypes();
    }
  }