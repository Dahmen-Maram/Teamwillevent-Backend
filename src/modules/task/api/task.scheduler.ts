import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Task } from 'src/common/models/types/task.entity';
import { MailService } from 'src/modules/mail/mail.service';
import { NotificationService } from 'src/modules/notification/api/notification.service';

@Injectable()
export class TaskScheduler {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkUpcomingDeadlines() {
    console.log('Checking for upcoming deadlines...');
    const now = new Date();
    console.log('Current time:', now);
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find tasks with deadlines in the next 24 hours that haven't been notified
    const upcomingTasks = await this.taskRepository.find({
      where: {
        deadline: Between(now, twentyFourHoursFromNow),
        isDone: false,
      },
      relations: ['assignedTo', 'event'],
      join: {
        alias: "task",
        leftJoinAndSelect: {
          event: "task.event"
        }
      }
    });

    for (const task of upcomingTasks) {
      if (task.assignedTo && task.assignedTo.email) {
        // Send email notification
        await this.mailService.sendMail(
          task.assignedTo.email,
          `Reminder: Task "${task.title}" due in 24 hours`,
          `Hello ${task.assignedTo.nom},\n\nThis is a reminder that your task "${task.title}" is due in 24 hours.\n\nTask Details:\nTitle: ${task.title}\nDescription: ${task.description}\nDeadline: ${new Date(task.deadline).toLocaleString()}\nEvent: ${task.event ? `${task.event.titre} (ID: ${task.event.id})` : 'No associated event'}\n\nPlease make sure to complete it before the deadline.`,
          `<p>Hello ${task.assignedTo.nom},</p>
           <p>This is a reminder that your task is due in 24 hours.</p>
           <h3>Task Details:</h3>
           <ul>
             <li><strong>Title:</strong> ${task.title}</li>
             <li><strong>Description:</strong> ${task.description}</li>
             <li><strong>Deadline:</strong> ${new Date(task.deadline).toLocaleString()}</li>
             ${task.event ? 
               `<li><strong>Event:</strong> ${task.event.titre}</li>
                <li><strong>Event Description:</strong> ${task.event.description || 'No description'}</li>
                <li><strong>Event Date:</strong> ${new Date(task.event.date).toLocaleString()}</li>` 
               : '<li><strong>Event:</strong> No associated event</li>'
             }
           </ul>
           <p>Please make sure to complete it before the deadline.</p>`
        );

        // Create a notification in the system
        await this.notificationService.create(
          task.assignedTo.id,
          `Reminder: Task "${task.title}" is due in 24 hours`,
          'event',
          { eventId: task.event?.id }
        );
      }
    }
    console.log(`Found ${upcomingTasks.length} tasks with upcoming deadlines`);
  }

  // Method to manually trigger deadline check
  async forceCheckDeadlines() {
    console.log('Manually checking deadlines...');
    await this.checkUpcomingDeadlines();
  }
}
