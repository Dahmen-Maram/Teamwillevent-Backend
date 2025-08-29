// src/modules/notification/notification.controller.ts

import { Controller, Get, Patch, Param,Post,Body, Delete, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('user/:userId')
  async getNotifications(@Param('userId') userId: string) {
    return this.notificationService.findForUser(userId);
  }

  @Patch(':notifId/read')
  async markAsRead(@Param('notifId') notifId: string) {
    return this.notificationService.markOneAsRead(notifId);
  }
    @UseGuards(JwtAuthGuard)
  @Delete(':id/:userId')
  async deleteNotification(
    @Param('id') id: string,
    @Param('userId') userId: string
  ): Promise<void> {
    return this.notificationService.delete(id, userId);
  }

  @Patch('user/:userId/read-all')
  async markAllAsRead(@Param('userId') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }

  @Get('user/:userId/unread-count')
  async getUnreadCount(@Param('userId') userId: string) {
    return this.notificationService.countUnread(userId);
  }
  @Post('create')
async createNotification(@Body() body: { userId: string; title: string }) {
  return this.notificationService.create(body.userId, body.title);
}
@Get
()
async getAllNotifications() {
  return this.notificationService.findAll();
}
}