import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginService } from '@/auth/services/login.service';
import { LoginDto } from '@/auth/dto/login.dto';

@ApiTags('auth')
@Controller('auth/login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Invalid credentials' })
  login(@Body() loginDto: LoginDto) {
    return this.loginService.login(loginDto);
  }
}
