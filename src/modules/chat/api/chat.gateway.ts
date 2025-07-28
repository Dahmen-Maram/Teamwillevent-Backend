import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private logger: Logger = new Logger('ChatGateway');

  constructor(private readonly chatService: ChatService) {}

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
  // Tu peux émettre un événement pour MAJ UI côté client
}

@SubscribeMessage('deleteForAll')
async handleDeleteForAll(
  @MessageBody() payload: { messageId: string },
  @ConnectedSocket() client: Socket,
) {
  await this.chatService.deleteForAll(payload.messageId);
  client.broadcast.emit('messageDeletedForAll', { messageId: payload.messageId });
}


  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody()
    payload: {
      userId: string;
      eventId: string;
      content: string;
      mediaUrl?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId, eventId, content, mediaUrl } = payload;

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

    // Diffuse à tous dans la room eventId sauf l’émetteur
    client.to(eventId).emit('newMessage', message);
    client.emit('messageSent', message);
  }

  @SubscribeMessage('getMessages')
async handleGetMessages(
  @MessageBody() payload: { eventId: string; userId: string }, // 👈 Ajoute userId ici
): Promise<any> {
  const messages = await this.chatService.getMessagesForEvent(payload.eventId, payload.userId);
  return { messages };
}
}
