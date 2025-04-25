import { Injectable, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateCommentDto } from './dto/comment.dto';
import { Prisma, Ticket, User, Status, Priority, Category, TicketType } from '@prisma/client';
import { UserProfileDto } from '../users/dto/user-profile.dto';

// Selects
const ticketSummarySelect: Prisma.TicketSelect = {
  id: true,
  title: true,
  created_at: true,
  updated_at: true,
  status: { select: { id: true, name: true } },
  priority: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
  type: { select: { id: true, name: true, description: true } },
  creator: { select: { id: true, username: true } },
  assignedTo: { select: { id: true, username: true } },
};

const ticketDetailSelect: Prisma.TicketSelect = {
  ...ticketSummarySelect,
  description: true,
  closedAt: true,
  resolutionMessage: true,
  comments: {
    select: { id: true, content: true, created_at: true, user: { select: { id: true, username: true, role: true } } },
    orderBy: { created_at: 'asc' },
  },
  attachments: { select: { id: true, file_url: true } },
};

// Tipo Helper
type PrismaLookupDelegate = any;

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(private prisma: PrismaService) {}

  async create(createTicketDto: CreateTicketDto, creator: UserProfileDto): Promise<Ticket> {
    this.logger.log(`User ${creator.id} attempting to create ticket: "${createTicketDto.title}"`);

    // Obtener el tipo de ticket para determinar el estado y prioridad por defecto
    const ticketType = await this.prisma.ticketType.findUnique({
      where: { id: createTicketDto.typeId },
      select: { id: true, defaultStatusId: true, defaultPriorityId: true },
    });

    if (!ticketType) {
      this.logger.warn(`Ticket type with ID ${createTicketDto.typeId} not found.`);
      throw new BadRequestException('El tipo de ticket especificado no existe.');
    }

    // Usar los valores por defecto del tipo de ticket, o valores fallback si no están definidos
    const statusId = ticketType.defaultStatusId || (await this.findLookupIdOrFail(this.prisma.status, 'Nuevo', 'Status'));
    const priorityId = ticketType.defaultPriorityId || (await this.findLookupIdOrFail(this.prisma.priority, 'Media', 'Priority'));

    try {
      const newTicket = await this.prisma.ticket.create({
        data: {
          title: createTicketDto.title,
          description: createTicketDto.description,
          creator: { connect: { id: creator.id } },
          category: { connect: { id: createTicketDto.categoryId } },
          type: { connect: { id: createTicketDto.typeId } },
          status: { connect: { id: statusId } },
          priority: { connect: { id: priorityId } },
        },
        select: ticketDetailSelect,
      });
      this.logger.log(`Ticket ${newTicket.id} created successfully by User ${creator.id}`);
      return newTicket;
    } catch (error) {
      this.logger.error(`Failed to create ticket for User ${creator.id}: ${error.message}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new BadRequestException('La categoría, tipo, estado o prioridad proporcionada no existe.');
        }
      }
      throw new InternalServerErrorException('No se pudo crear el ticket.');
    }
  }

  async findAll(user: UserProfileDto): Promise<any[]> {
    this.logger.log(`User ${user.id} (Role: ${user.role}) requesting all tickets.`);
    const whereClause: Prisma.TicketWhereInput = {};

    if (user.role === 'client') {
      whereClause.creatorId = user.id;
      this.logger.log(`Filtering tickets for CLIENT ${user.id}`);
    } else if (user.role === 'agent' || user.role === 'support') {
      whereClause.OR = [{ creatorId: user.id }, { assignedToId: user.id }];
      this.logger.log(`Filtering tickets for AGENT/SUPPORT ${user.id} (created or assigned)`);
    }

    try {
      const tickets = await this.prisma.ticket.findMany({
        where: whereClause,
        select: ticketSummarySelect,
        orderBy: { updated_at: 'desc' },
      });
      this.logger.log(`Found ${tickets.length} tickets for User ${user.id}`);
      return tickets;
    } catch (error) {
      this.logger.error(`Failed to find all tickets for User ${user.id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('No se pudieron obtener los tickets.');
    }
  }

  async findOne(id: number, user: UserProfileDto): Promise<any> {
    this.logger.log(`User ${user.id} (Role: ${user.role}) requesting details for Ticket ${id}`);
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      select: ticketDetailSelect,
    });

    if (!ticket) {
      this.logger.warn(`Ticket ${id} not found for User ${user.id}`);
      throw new NotFoundException(`Ticket con ID ${id} no encontrado.`);
    }

    const isOwner = ticket.creator.id === user.id;
    const isAssignee = ticket.assignedTo?.id === user.id;
    const isAgentOrAdmin = user.role === 'agent' || user.role === 'admin' || user.role === 'support';

    if (!isOwner && !isAssignee && !isAgentOrAdmin) {
      this.logger.warn(`User ${user.id} forbidden to access Ticket ${id}`);
      throw new ForbiddenException('No tienes permiso para ver este ticket.');
    }

    this.logger.log(`Ticket ${id} details retrieved for User ${user.id}`);
    return ticket;
  }

  async update(id: number, updateTicketDto: UpdateTicketDto, user: UserProfileDto): Promise<Ticket> {
    this.logger.log(`User ${user.id} (Role: ${user.role}) attempting to update Ticket ${id}`);

    const ticket = await this.prisma.ticket.findUnique({ where: { id }, select: { id: true, statusId: true } });
    if (!ticket) {
      this.logger.warn(`Update failed: Ticket ${id} not found.`);
      throw new NotFoundException(`Ticket con ID ${id} no encontrado.`);
    }

    const canUpdate = user.role === 'agent' || user.role === 'admin' || user.role === 'support';
    if (!canUpdate) {
      this.logger.warn(`Update forbidden for User ${user.id} on Ticket ${id}.`);
      throw new ForbiddenException('No tienes permiso para actualizar este ticket.');
    }

    if (updateTicketDto.resolutionMessage || (updateTicketDto.statusId && updateTicketDto.statusId !== ticket.statusId)) {
      if (user.role !== 'admin') {
        this.logger.warn(`User ${user.id} attempted to update resolutionMessage or change status without admin privileges.`);
        throw new ForbiddenException('Solo los administradores pueden cerrar tickets o añadir mensajes de resolución.');
      }
    }

    const dataToUpdate: Prisma.TicketUpdateInput = {};
    if (updateTicketDto.title !== undefined) dataToUpdate.title = updateTicketDto.title;
    if (updateTicketDto.description !== undefined) dataToUpdate.description = updateTicketDto.description;
    if (updateTicketDto.statusId !== undefined) dataToUpdate.status = { connect: { id: updateTicketDto.statusId } };
    if (updateTicketDto.priorityId !== undefined) dataToUpdate.priority = { connect: { id: updateTicketDto.priorityId } };
    if (updateTicketDto.categoryId !== undefined) dataToUpdate.category = { connect: { id: updateTicketDto.categoryId } };
    if (updateTicketDto.typeId !== undefined) dataToUpdate.type = { connect: { id: updateTicketDto.typeId } };
    if (updateTicketDto.hasOwnProperty('assignedToId')) {
      if (updateTicketDto.assignedToId === null) {
        dataToUpdate.assignedTo = { disconnect: true };
      } else if (updateTicketDto.assignedToId !== undefined) {
        dataToUpdate.assignedTo = { connect: { id: updateTicketDto.assignedToId } };
      }
    }
    if (updateTicketDto.hasOwnProperty('closedAt')) dataToUpdate.closedAt = updateTicketDto.closedAt;
    if (updateTicketDto.resolutionMessage !== undefined) dataToUpdate.resolutionMessage = updateTicketDto.resolutionMessage;

    if (Object.keys(dataToUpdate).length === 0) {
      this.logger.log(`No fields to update for Ticket ${id}. Returning existing ticket data.`);
      const currentTicket = await this.prisma.ticket.findUnique({
        where: { id },
        select: ticketDetailSelect,
      });
      if (!currentTicket) {
        throw new NotFoundException(`Ticket con ID ${id} no encontrado al intentar devolver datos no modificados.`);
      }
      return currentTicket;
    }

    try {
      const updatedTicket = await this.prisma.ticket.update({
        where: { id },
        data: dataToUpdate,
        select: ticketDetailSelect,
      });
      this.logger.log(`Ticket ${id} updated successfully by User ${user.id}`);
      return updatedTicket;
    } catch (error) {
      this.logger.error(`Failed to update Ticket ${id} by User ${user.id}: ${error.message}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new BadRequestException('El estado, prioridad, categoría, tipo o usuario asignado proporcionado no existe.');
        }
      }
      throw new InternalServerErrorException('No se pudo actualizar el ticket.');
    }
  }

  async addComment(ticketId: number, createCommentDto: CreateCommentDto, author: UserProfileDto): Promise<any> {
    this.logger.log(`User ${author.id} (Role: ${author.role}) attempting to add comment to Ticket ${ticketId}`);

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, creatorId: true, assignedToId: true, status: { select: { name: true } } },
    });
    if (!ticket) {
      this.logger.warn(`Add comment failed: Ticket ${ticketId} not found.`);
      throw new NotFoundException(`Ticket con ID ${ticketId} no encontrado.`);
    }

    const isOwner = ticket.creatorId === author.id;
    const isAssignee = ticket.assignedToId === author.id;
    const canCommentAny = author.role === 'agent' || author.role === 'admin' || author.role === 'support';
    if (!isOwner && !isAssignee && !canCommentAny) {
      this.logger.warn(`Add comment forbidden for User ${author.id} on Ticket ${ticketId}`);
      throw new ForbiddenException('No tienes permiso para comentar en este ticket.');
    }

    if (ticket.status.name === 'Cerrado') {
      this.logger.warn(`Comment forbidden: Ticket ${ticketId} is closed.`);
      throw new ForbiddenException('No se pueden añadir comentarios a un ticket cerrado.');
    }

    try {
      const newComment = await this.prisma.comment.create({
        data: {
          content: createCommentDto.content,
          ticket: { connect: { id: ticketId } },
          user: { connect: { id: author.id } },
        },
        include: { user: { select: { id: true, username: true, role: true } } },
      });
      this.logger.log(`Comment ${newComment.id} added to Ticket ${ticketId} by User ${author.id}`);
      await this.prisma.ticket.update({ where: { id: ticketId }, data: { updated_at: new Date() } });
      return newComment;
    } catch (error) {
      this.logger.error(`Failed to add comment to Ticket ${ticketId} by User ${author.id}: ${error.message}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Ticket con ID ${ticketId} no encontrado al intentar crear comentario.`);
      }
      throw new InternalServerErrorException('No se pudo añadir el comentario.');
    }
  }

  private async findLookupIdOrFail(model: any, name: string, modelNameForError?: string): Promise<number> {
    try {
      const record = await model.findUnique({ where: { name } });
      if (!record) {
        const errorModelName = modelNameForError || 'LookupTable';
        this.logger.error(`Lookup record with name "${name}" not found for type ${errorModelName}. Please seed the database.`);
        throw new InternalServerErrorException(`Configuración inicial incompleta: Falta el registro '${name}' de tipo ${errorModelName}.`);
      }
      return record.id;
    } catch (error) {
      const errorModelName = modelNameForError || 'LookupTable';
      this.logger.error(`Error finding lookup record "${name}" of type ${errorModelName}: ${error.message}`, error.stack);
      if (error instanceof InternalServerErrorException) throw error;
      throw new InternalServerErrorException(`Error al buscar el registro '${name}'.`);
    }
  }

  async findAllStatuses(): Promise<Pick<Status, 'id' | 'name'>[]> {
    this.logger.log('Requesting all ticket statuses');
    try {
      return await this.prisma.status.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Failed to find all statuses: ${error.message}`, error.stack);
      throw new InternalServerErrorException('No se pudieron obtener los estados.');
    }
  }

  async findAllPriorities(): Promise<Pick<Priority, 'id' | 'name'>[]> {
    this.logger.log('Requesting all ticket priorities');
    try {
      return await this.prisma.priority.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Failed to find all priorities: ${error.message}`, error.stack);
      throw new InternalServerErrorException('No se pudieron obtener las prioridades.');
    }
  }

  async findAllCategories(): Promise<Pick<Category, 'id' | 'name'>[]> {
    this.logger.log('Requesting all ticket categories');
    try {
      return await this.prisma.category.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Failed to find all categories: ${error.message}`, error.stack);
      throw new InternalServerErrorException('No se pudieron obtener las categorías.');
    }
  }

  async findAllTicketTypes(): Promise<Pick<TicketType, 'id' | 'name' | 'description'>[]> {
    this.logger.log('Requesting all ticket types');
    try {
      return await this.prisma.ticketType.findMany({
        select: { id: true, name: true, description: true },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Failed to find all ticket types: ${error.message}`, error.stack);
      throw new InternalServerErrorException('No se pudieron obtener los tipos de ticket.');
    }
  }

  async delete(id: number, user: UserProfileDto): Promise<void> {
    this.logger.log(`User ${user.id} (Role: ${user.role}) attempting to delete Ticket ${id}`);
    if (user.role !== 'admin') {
      this.logger.warn(`Delete forbidden for User ${user.id} on Ticket ${id}`);
      throw new ForbiddenException('Solo los administradores pueden eliminar tickets.');
    }
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      this.logger.warn(`Ticket ${id} not found for deletion`);
      throw new NotFoundException(`Ticket con ID ${id} no encontrado.`);
    }
    try {
      await this.prisma.ticket.delete({ where: { id } });
      this.logger.log(`Ticket ${id} deleted by User ${user.id}`);
    } catch (error) {
      this.logger.error(`Failed to delete Ticket ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('No se pudo eliminar el ticket.');
    }
  }
}