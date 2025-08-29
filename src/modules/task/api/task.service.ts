import { Injectable, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from 'src/common/models/types/task.entity';
import { Event } from 'src/common/models/types/event.entity';
import { User } from 'src/common/models/types/user.entity';
import { CreateTaskDto } from '../dto/create-task.dto';
import { TaskStatus } from 'src/common/enum/task-status.enum';
import { MailService } from 'src/modules/mail/mail.service';
import { NotificationService } from 'src/modules/notification/api/notification.service';
import { Roles } from 'src/common/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enum/role.enum';
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { TaskScheduler } from './task.scheduler';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,

    @InjectRepository(Event)
    private eventRepository: Repository<Event>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationService,
  ) {}

  @UseGuards(JwtAuthGuard)
  async toggleTaskCompletion(taskId: string, userId: string) {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['assignedTo', 'event'],
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Vérifier si l'utilisateur est assigné à la tâche ou est responsable de l'événement
    if (task.assignedTo.id !== userId) {
      throw new Error('You are not authorized to update this task');
    }

    // Inverser le statut isDone
    task.isDone = !task.isDone;
    
    const updatedTask = await this.taskRepository.save(task);

    // Envoyer une notification
    await this.notificationService.create(
      task.assignedTo.id,
      `Task "${task.title}" has been marked as ${task.isDone ? 'completed' : 'uncompleted'}`,
      'event'
    );

    return updatedTask;
  }
@UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESPONSABLE)
  async createTask(eventId: string, userId: string, dto: CreateTaskDto) {
  const event = await this.eventRepository.findOne({ where: { id: eventId } });
  if (!event) throw new Error('Event not found');

  const user = await this.userRepository.findOne({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const task = this.taskRepository.create({
    title: dto.title,
    description: dto.description,
    event,
    assignedTo: user,
    status: TaskStatus.PENDING,
    deadline: dto.deadline, // Utilisation du champ deadline
  });

  const savedTask = await this.taskRepository.save(task);

  // ✅ Envoi d'un email à l'utilisateur assigné
  await this.mailService.sendMail(
    user.email,
    'Nouvelle tâche assignée',
    `Bonjour ${user.nom}, vous avez été assigné à une nouvelle tâche : ${task.title}`,
    `<p>Bonjour ${user.nom},</p>
     <p>Vous avez été assigné à une nouvelle tâche :</p>
     <ul>
       <li><strong>Titre :</strong> ${task.title}</li>
       <li><strong>Description :</strong> ${task.description}</li>
       <li><strong>Événement :</strong> ${event.titre}</li>
        deadline: dto.deadline ? new Date(dto.deadline) : null,

     </ul>
     <p>Merci de consulter TeamwillEvents pour confirmer ta participation.</p>`
  );

  // ✅ Création de la notification pour l'utilisateur assigné
  await this.notificationService.create(
    user.id,
    `Nouvelle tâche assignée : ${task.title}`,
   undefined,
    { eventId: event.id } // facultatif
  );

  return savedTask;
}



  async updateStatus(taskId: string, status: TaskStatus) {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');

    task.status = status;
    return this.taskRepository.save(task);
  }

async updateAssignedUser(taskId: string, userId: string) {
  const task = await this.taskRepository.findOne({
    where: { id: taskId },
    relations: ['event', 'assignedTo'], // récupère aussi l'utilisateur assigné actuel
  });
  if (!task) throw new Error('Task not found');

  const user = await this.userRepository.findOne({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  // Envoyer un mail à l'ancien assigné s'il y en a un et que ce n'est pas la même personne
  if (task.assignedTo && task.assignedTo.id !== userId) {
    await this.mailService.sendMail(
      task.assignedTo.email,
      'Mise à jour de votre tâche assignée',
      `Bonjour ${task.assignedTo.nom}, vous n'êtes plus assigné à la tâche : ${task.title}`,
      `<p>Bonjour ${task.assignedTo.nom},</p>
       <p>Vous n'êtes plus <strong>assigné</strong> à la tâche suivante :</p>
       <ul>
         <li><strong>Titre :</strong> ${task.title}</li>
         <li><strong>Description :</strong> ${task.description}</li>
         <li><strong>Événement :</strong> ${task.event?.titre ?? 'Non spécifié'}</li>
       </ul>
       <p>Merci de consulter TeamwillEvents pour voir les détails mis à jour.</p>`
    );
  }

  task.assignedTo = user;
  const updatedTask = await this.taskRepository.save(task);

  // Envoi d'un mail à la nouvelle personne assignée
  await this.mailService.sendMail(
    user.email,
    'Mise à jour de votre tâche assignée',
    `Bonjour ${user.nom}, vous avez été réassigné à une tâche : ${task.title}`,
    `<p>Bonjour ${user.nom},</p>
     <p>Vous avez été <strong>réassigné</strong> à une tâche :</p>
     <ul>
       <li><strong>Titre :</strong> ${task.title}</li>
       <li><strong>Description :</strong> ${task.description}</li>
       <li><strong>Événement :</strong> ${task.event?.titre ?? 'Non spécifié'}</li>
     </ul>
     <p>Merci de consulter TeamwillEvents pour voir les détails de cette tâche.</p>`
  );

  return updatedTask;
}


  async updateTitle(taskId: string, newTitle: string) {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');

    task.title = newTitle;
    return this.taskRepository.save(task);
  }

  async updateDescription(taskId: string, newDescription: string) {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');

    task.description = newDescription;
    return this.taskRepository.save(task);
  }

  async updateDeadline(taskId: string, newDeadline: Date) {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new Error('Task not found'); 
    task.deadline = newDeadline;
    return this.taskRepository.save(task);
  }
  async deleteTask(taskId: string) {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');

    return this.taskRepository.remove(task);
  }
   // ✅ Méthode 1 : récupérer toutes les tâches d’un événement
  async getTasksByEvent(eventId: string) {
    return this.taskRepository.find({
      where: { event: { id: eventId } },
      relations: ['assignedTo'], // facultatif selon ce que tu veux afficher
    });
  }

  // ✅ Méthode 2 : récupérer toutes les tâches d’un utilisateur
  async getTasksByUser(userId: string) {
    return this.taskRepository.find({
      where: { assignedTo: { id: userId } },
      relations: ['event'], // facultatif selon ce que tu veux afficher
    });
  }

  async testDeadlineReminders() {
    // Create a task with a deadline in 24 hours
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);

    // Find a user to assign the task to
    const user = await this.userRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' }
    });

    if (!user) {
      throw new Error('No user found to test with');
    }

    // Find an event to associate with
    const event = await this.eventRepository.createQueryBuilder('event')
      .orderBy('event.id', 'DESC')
      .getOne();

    // Create a test task
    const task = this.taskRepository.create({
      title: 'Test Deadline Task',
      description: 'This is a test task to verify deadline notifications',
      deadline: tomorrow,
      assignedTo: user,
      status: TaskStatus.PENDING,
      isDone: false,
      ...(event && { event }) // Only add event if one was found
    });

    await this.taskRepository.save(task);

    // Force check deadlines
    const scheduler = new TaskScheduler(
      this.taskRepository,
      this.mailService,
      this.notificationService
    );
    
    await scheduler.forceCheckDeadlines();

    return {
      message: 'Test task created and deadline check triggered',
      task: {
        id: task.id,
        title: task.title,
        deadline: task.deadline,
        assignedTo: user.email
      }
    };
  }
}
