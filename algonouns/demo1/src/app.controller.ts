import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("mbd")
  async getMbdEntries(@Query('fid') fid: string): Promise<string> {
    return await this.appService.getEntries(fid);
  }
}
