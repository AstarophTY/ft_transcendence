import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { LoginService } from "@/auth/services/login.service";
import { LoginDto } from "@/auth/dto/login.dto";

@ApiTags("auth")
@Controller("auth/login")
export class LoginController {
  public constructor(private readonly loginService: LoginService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login a user" })
  @ApiResponse({ description: "Login successful", status: 200 })
  @ApiResponse({ description: "Invalid credentials", status: 400 })
  public async login(@Body() loginDto: LoginDto): Promise<unknown> {
    return this.loginService.login(loginDto);
  }
}
