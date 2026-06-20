import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SignupService } from "@/auth/services/signup.service";
import { SignupDto } from "@/auth/dto/signup.dto";

@ApiTags("auth")
@Controller("auth/signup")
export class SignupController {
  public constructor(private readonly signupService: SignupService) {}

  @Post()
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ description: "User successfully created", status: 201 })
  @ApiResponse({ description: "Validation failed", status: 400 })
  public async signup(@Body() signupDto: SignupDto): Promise<unknown> {
    return this.signupService.signup(signupDto);
  }
}
