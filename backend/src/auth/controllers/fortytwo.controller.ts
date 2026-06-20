import { BadRequestException, Controller, Get, Logger, Query, Res } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { ConfigService } from "@nestjs/config";
import type { Response } from "express";
import type { FortyTwoService } from "@/auth/services/fortytwo.service";

@ApiTags("auth")
@Controller("auth/42")
export class FortyTwoController {
  private readonly logger = new Logger(FortyTwoController.name);

  public constructor(
    private readonly fortyTwoService: FortyTwoService,
    private readonly config: ConfigService,
  ) {}

  @Get("login")
  @ApiOperation({ summary: "Redirect to 42 OAuth login page" })
  @ApiResponse({ description: "Redirects browser to 42 login portal", status: 302 })
  public login(@Res() res: Response): void {
    const url = this.fortyTwoService.getAuthUrl();
    res.redirect(url);
  }

  @Get("callback")
  @ApiOperation({ summary: "Callback for 42 OAuth authentication" })
  @ApiResponse({
    description: "Authenticates and redirects back to frontend with JWT token",
    status: 302,
  })
  public async callback(@Query("code") code: string, @Res() res: Response): Promise<void> {
    if (!code) {
      throw new BadRequestException("Authorization code is missing");
    }

    try {
      const token = await this.fortyTwoService.login(code);
      const frontendUrl = this.config.get<string>("FRONTEND_URL", "https://localhost");

      res.redirect(`${frontendUrl}/?token=${token}`);
    } catch (error) {
      this.logger.error(
        `OAuth callback failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      const frontendUrl = this.config.get<string>("FRONTEND_URL", "https://localhost");
      res.redirect(`${frontendUrl}/?error=unauthorized`);
    }
  }
}
