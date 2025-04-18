// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserProfileDto } from '../users/dto/user-profile.dto'; // Asegúrate que la ruta es correcta

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Iniciar sesión', description: 'Autentica y devuelve token JWT.' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: 'Login exitoso.', type: AuthResponseDto })
    @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
    async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
        console.log('Login attempt received:', loginDto.emailOrUsername);
        const result = await this.authService.login(loginDto);
        // Nota: El user está dentro de result ahora según AuthResponseDto
        console.log('Login successful for user ID:', result.user.id);
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    @ApiOperation({ summary: 'Obtener perfil', description: 'Devuelve perfil del usuario autenticado.' })
    @ApiBearerAuth('access-token') // Nombre lógico de la seguridad JWT
    @ApiResponse({ status: 200, description: 'Perfil del usuario.', type: UserProfileDto })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    getProfile(@Req() req): UserProfileDto {
        console.log('Profile request by user:', req.user.username);
        // req.user ya tiene la forma de UserProfileDto gracias a JwtStrategy
        return req.user;
    }
}