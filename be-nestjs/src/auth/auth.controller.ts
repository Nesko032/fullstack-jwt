import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { JwtAuthGuard } from './passport/jwt-auth.guard';
import { Public, ResponseMessage } from '@/decorator/customize';
import { CodeAuthDto, CreateAuthDto } from './dto/create-auth.dto';
import { MailerService } from '@nestjs-modules/mailer';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mailerService: MailerService,
  ) {}

  @Post('login')
  @Public() // For check jwt
  @UseGuards(LocalAuthGuard)
  @ResponseMessage('Fetch login success')
  handleLogin(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Post('register')
  @Public()
  register(@Body() register: CreateAuthDto) {
    return this.authService.handleRegister(register);
  }

  @Post('check-code')
  @Public()
  checkCode(@Body() checkCode: CodeAuthDto) {
    return this.authService.checkCode(checkCode);
  }

  @Get('mail')
  @Public()
  handleSendMail() {
    this.mailerService.sendMail({
      to: 'ads.nesko@gmail.com',
      subject: 'Testing Nest MailerModule ✔',
      text: 'Welcome to NestJS MailerModule!',
      template: 'register',
      context: {
        name: 'Nesko',
        activationCode: 123456789,
      },
    });
    return 'ok';
  }
}
