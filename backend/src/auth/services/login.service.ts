import { Injectable } from '@nestjs/common';
import { LoginDto } from '@/auth/dto/login.dto';

@Injectable()
export class LoginService {
  login(loginDto: LoginDto) {
    return {
      message: 'Login successful (mock)',
      user: {
        id: 1,
        username: loginDto.username,
      },
      accessToken: `mock-jwt-token-for-${loginDto.username}`,
    };
  }
}
