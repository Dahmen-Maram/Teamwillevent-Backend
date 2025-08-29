import {
  Controller,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Get,
} from '@nestjs/common';

import { CreateTaskDto } from '../dto/create-task.dto';
import { TaskStatus } from 'src/common/enum/task-status.enum';
import { TaskService } from './task.service';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  // Créer une tâche pour un événement et un utilisateur donné
  @Post(':eventId/:userId')
  async createTask(
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.taskService.createTask(eventId, userId, dto);
  }
  // Test deadline reminders
  @Post('test-reminders')
  async testDeadlineReminders() {
    return this.taskService.testDeadlineReminders();
  }

  // Toggle le statut de complétion d'une tâche
  @Patch(':taskId/toggle-completion/:userId')
  async toggleTaskCompletion(
    @Param('taskId') taskId: string,
    @Param('userId') userId: string,
  ) {
    return this.taskService.toggleTaskCompletion(taskId, userId);
  }

  // Mettre à jour la deadline d'une tâche
  @Patch(':taskId/deadline')
  async updateDeadline(
    @Param('taskId') taskId: string,
    @Body('deadline') deadline: Date,
  ) {
    return this.taskService.updateDeadline(taskId, deadline);
  }

  // Mettre à jour le statut d'une tâche
  @Patch(':taskId/status')
  async updateStatus(
    @Param('taskId') taskId: string,
    @Body('status') status: TaskStatus,
  ) {
    return this.taskService.updateStatus(taskId, status);
  }

  // Modifier l'utilisateur assigné à une tâche
  @Patch(':taskId/assign')
  async updateAssignedUser(
    @Param('taskId') taskId: string,
    @Body('userId') userId: string,
  ) {
    return this.taskService.updateAssignedUser(taskId, userId);
  }

  // Modifier le titre d'une tâche
  @Patch(':taskId/title')
  async updateTitle(
    @Param('taskId') taskId: string,
    @Body('title') title: string,
  ) {
    return this.taskService.updateTitle(taskId, title);
  }

  // Modifier la description d'une tâche
  @Patch(':taskId/description')
  async updateDescription(
    @Param('taskId') taskId: string,
    @Body('description') description: string,
  ) {
    return this.taskService.updateDescription(taskId, description);
  }

  // Supprimer une tâche
  @Delete(':taskId')
  async deleteTask(@Param('taskId') taskId: string) {
    return this.taskService.deleteTask(taskId);
  }

  // Récupérer toutes les tâches d'un événement
  @Get('/event/:eventId')
  async getTasksByEvent(@Param('eventId') eventId: string) {
    return this.taskService.getTasksByEvent(eventId);
  }

  // Récupérer les tâches assignées à un utilisateur
  @Get('/user/:userId')
  async getTasksByUser(@Param('userId') userId: string) {
    return this.taskService.getTasksByUser(userId);
  }
}
