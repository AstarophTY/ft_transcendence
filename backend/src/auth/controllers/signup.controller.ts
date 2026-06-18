import { Controller, Post, Body } from '@nestjs/common';
import { SignupService } from '@/auth/services/signup.service';
import { SignupDto } from '@/auth/dto/signup.dto';

@Controller('auth/signup')
export class SignupController {
  constructor(private readonly signupService: SignupService) {}

  @Post()
  signup(@Body() signupDto: SignupDto) {
    return this.signupService.signup(signupDto);
  }
}
