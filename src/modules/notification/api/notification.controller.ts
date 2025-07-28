// src/modules/notification/notification.controller.ts

import { Controller, Get, Patch, Param,Post,Body } from '@nestjs/common';
import { NotificationService } from './notification.service';

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