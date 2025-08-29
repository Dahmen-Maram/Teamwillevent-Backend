import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Socket, Server } from 'socket.io';

import { ChatService } from './chat.service';
import { NotificationService } from 'src/modules/notification/api/notification.service';
import { MailService } from 'src/modules/mail/mail.service';
import { Event } from 'src/common/models/types/event.entity';


@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinEvent')
  async handleJoinEvent(
    @MessageBody() payload: { userId: string; eventId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId, eventId } = payload;
    const isAllowed = await this.chatService.isParticipant(userId, eventId);
    if (!isAllowed) {
      client.emit('error', 'User not authorized for this event');
      return;
    }
    client.join(eventId);
    client.emit('joinedEvent', `Joined event room: ${eventId}`);
  }

  @SubscribeMessage('markAsSeen')
  async handleMarkAsSeen(
    @MessageBody() payload: { messageId: string; userId: string },
  ) {
    await this.chatService.markAsSeen(payload.messageId, payload.userId);
  }

  @SubscribeMessage('deleteForMe')
  async handleDeleteForMe(
    @MessageBody() payload: { messageId: string; userId: string },
  ) {
    await this.chatService.deleteForMe(payload.messageId, payload.userId);
  }

  @SubscribeMessage('deleteForAll')
  async handleDeleteForAll(
    @MessageBody() payload: { messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.chatService.deleteForAll(payload.messageId);
    client.broadcast.emit('messageDeletedForAll', { messageId: payload.messageId });
  }

  @SubscribeMessage('joinUserRoom')
  async handleJoinUserRoom(
    @MessageBody() payload: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`user-${payload.userId}`);
    client.emit('joinedUserRoom', `Joined notification room for user ${payload.userId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody()
    payload: {
      userId: string;
      eventId: string;
      content: string;
      mediaUrl?: string;
      mentionedUserName?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId, eventId, content, mediaUrl, mentionedUserName } = payload;

    const isAllowed = await this.chatService.isParticipant(userId, eventId);
    if (!isAllowed) {
      client.emit('error', 'User not authorized for this event');
      return;
    }

    const message = await this.chatService.saveMessage(
      userId,
      eventId,
      content,
      mediaUrl,
    );

    // Gestion des mentions et notifications
    if (mentionedUserName) {
      this.logger.log(`🔍 Mention détectée dans le message : ${mentionedUserName}`);

      const mentionedUser = await this.chatService.findUserByName(mentionedUserName);
      this.logger.log(`👤 Utilisateur mentionné trouvé : ${mentionedUser?.nom ?? 'Aucun'}`);

      if (mentionedUser) {
        const event = await this.eventRepository.findOneBy({ id: eventId });
        if (!event) {
          this.logger.warn(`⚠️ Aucun événement trouvé avec l'ID : ${eventId}`);
        } else {
          const notifMessage = `Vous avez été tagué(e) dans l'événement : "${event.titre}"`;

          // Création notification dans la base
          const notif = await this.notificationService.create(
            mentionedUser.id,
            notifMessage,
            'message',
            { eventId },
          );

          // Envoi notification temps réel via socket
          this.server.to(`user-${mentionedUser.id}`).emit('newNotification', notif);

          // Envoi email
          const subject = `Vous avez été tagué(e) dans un événement : ${event.titre}`;
          const htmlContent = `
            <p>Bonjour ${mentionedUser.nom},</p>
            <p>Vous avez été tagué(e) dans l'événement <strong>${event.titre}</strong>.</p>
            <p>Message : "${content}"</p>
            <p>Pour voir l'événement, cliquez <a href="${process.env.FRONTEND_URL}/events/${event.id}">ici</a>.</p>
            <p>Bonne journée !</p>
          `;

          try {
            await this.mailService.sendMail(mentionedUser.email, subject, notifMessage, htmlContent);
            this.logger.log(`Email de notification envoyé à ${mentionedUser.email}`);
          } catch (error) {
            this.logger.error(`Erreur envoi email à ${mentionedUser.email}: ${error.message}`);
          }
        }
      }
    }

    client.to(eventId).emit('newMessage', message);
    client.emit('messageSent', message);
  }

  @SubscribeMessage('getMessages')
  async handleGetMessages(
    @MessageBody() payload: { eventId: string; userId: string },
  ): Promise<any> {
    const messages = await this.chatService.getMessagesForEvent(payload.eventId, payload.userId);
    return { messages };
  }
}
