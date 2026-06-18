import { Injectable } from '@nestjs/common';
import { SignupDto } from '@/auth/dto/signup.dto';

@Injectable()
export class SignupService {
  signup(signupDto: SignupDto) {
    return {
      message: 'Signup successful (mock)',
      user: {
        id: 2,
        username: signupDto.username,
      },
    };
  }
}
