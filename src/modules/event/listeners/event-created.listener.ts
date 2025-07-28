// src/events/listeners/event-created.listener.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserRole } from 'src/common/enum/role.enum';
import { MailService } from 'src/common/utils/mail/mail.service';
import { UserService } from 'src/modules/user/api/user.service';

// Define the payload interface for event.created
export interface EventCreatedPayload {
  eventId: string;
  titre: string;
}

@Injectable()
export class EventCreatedListener {
  constructor(
    private readonly mailService: MailService,
    private readonly userService: UserService,
  ) {}

  @OnEvent('event.created')
  async handleEventCreatedEvent(event: EventCreatedPayload) {
    console.log('Notification: Événement créé', {
      eventId: event.eventId,
      titre: event.titre,
      timestamp: new Date().toISOString(),
    });

    try {
      const users = await this.userService.findAll();
      const recipients = users
        .filter(
          (user) => !user.isEmailConfirmed && user.role === UserRole.EMPLOYEE, // <-- ajout du filtre sur le rôle
        )
        .map((user) => user.email);

      const subject = `Nouvel événement créé : ${event.titre}`;
      const text = `Un nouvel événement "${event.titre}" a été créé avec l'ID ${event.eventId}.`;
      const html = `<p>Un nouvel événement <strong>"${event.titre}"</strong> a été créé avec l'ID <strong>${event.eventId}</strong>.</p>`;

      await Promise.all(
        recipients.map((email) =>
          this.mailService
            .sendMail(email, subject, text, html)
            .catch((error: unknown) => {
              const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
              console.error(`Failed to send email to ${email}:`, errorMessage);
            }),
        ),
      );
      console.log(`Emails sent to ${recipients.length} users`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('EventCreatedListener error:', errorMessage);
    }
  }
}
