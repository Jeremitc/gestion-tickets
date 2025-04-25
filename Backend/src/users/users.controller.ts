// src/users/users.controller.ts
import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { UserProfileDto } from './dto/user-profile.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Obtener lista de usuarios (solo admin)' })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, type: [UserProfileDto] })
  @ApiResponse({ status: 403, description: 'No autorizado (no admin).' })
  async findAll(@Req() req): Promise<UserProfileDto[]> {
    return this.usersService.findAll(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiOperation({ summary: 'Actualizar mi perfil' })
  @ApiBearerAuth('access-token')
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, type: UserProfileDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async updateMyProfile(
    @Req() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    const userId = req.user.id;
    console.log(`Updating profile for user ID: ${userId}`);
    return this.usersService.updateProfile(userId, updateProfileDto);
  }
}