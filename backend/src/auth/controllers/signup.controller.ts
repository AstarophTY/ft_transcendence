import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SignupService } from '@/auth/services/signup.service';
import { SignupDto } from '@/auth/dto/signup.dto';

@ApiTags('auth')
@Controller('auth/signup')
export class SignupController {
  constructor(private readonly signupService: SignupService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  signup(@Body() signupDto: SignupDto) {
    return this.signupService.signup(signupDto);
  }
}
