import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Not, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'src/common/models/types/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ParticipantStatus } from 'src/common/enum/participantStatus.enum';
import { Participant } from 'src/common/models/types/participant.entity';
import { Event } from 'src/common/models/types/event.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
  ) {}

  // ✅ Création d'utilisateur avec mot de passe hashé
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, motDePasse, ...rest } = createUserDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email déjà utilisé');
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    const user = this.userRepository.create({
      ...rest,
      email,
      motDePasse: hashedPassword,
    });

    return this.userRepository.save(user);
  }
  async removeAvatar(userId: string): Promise<void> {
  const user = await this.userRepository.findOne({ where: { id: userId } });
  if (!user) {
    throw new NotFoundException('Utilisateur non trouvé');
  }

  // On met l'avatarUrl à null (ou chaîne vide)
  user.avatarUrl = "";
  await this.userRepository.save(user);
}

  async findAllExceptUser(userId: string): Promise<User[]> {
    return this.userRepository.find({
      where: {
        id: Not(userId),
      },
    });
  }

async findManyByIds(ids: string[]): Promise<User[]> {
  return this.userRepository.find({
    where: { id: In(ids) },
  });
}

  

  // ✅ Récupérer un utilisateur par ID (profil)
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'nom',
        'email',
        'role',
        'phone',
        'department',
        'position',
        'location',
        'address',
        'isEmailConfirmed',
        'avatarUrl',
        'createdAt',
        'updatedAt',
      ],
    });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return user;
  }

  // ✅ Récupérer tous les utilisateurs
  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: [
        'id',
        'nom',
        'email',
        'role',
        'phone',
        'department',
        'position',
        'location',
        'address',
        'isEmailConfirmed',
        'createdAt',
        'updatedAt',
      ],
    });
  }
  async updateAvatarUrl(userId: string, avatarUrl: string): Promise<void> {
  const user = await this.userRepository.findOne({ where: { id: userId } });
  if (!user) {
    throw new NotFoundException('User not found');
  }

  user.avatarUrl = avatarUrl;
  await this.userRepository.save(user);
}

  // ✅ Supprimer un utilisateur
  async remove(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
  }

  // ✅ Mise à jour (mot de passe exclu)
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.preload({
      id,
      ...updateUserDto,
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return this.userRepository.save(user);
  }

  // ✅ Inscription à un événement
  async participate(userId: string, eventId: string): Promise<Participant> {
    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      const event = await queryRunner.manager.findOne(Event, {
        where: { id: eventId } as FindOptionsWhere<Event>,
      });
      if (!event) {
        throw new NotFoundException('Événement non trouvé');
      }

      const existingParticipant = await queryRunner.manager.findOne(
        Participant,
        {
          where: {
            user: { id: userId },
            event: { id: eventId },
          },
        },
      );
      if (existingParticipant) {
        throw new ConflictException(
          'Utilisateur déjà inscrit ou demande en attente pour cet événement',
        );
      }

      const participant = queryRunner.manager.create(Participant, {
        user,
        event,
        status: ParticipantStatus.PENDING,
      });

      await queryRunner.manager.save(participant);
      await queryRunner.commitTransaction();
      return participant;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  // 🔍 Rechercher un utilisateur par email
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  // 🔍 Rechercher un utilisateur par ID (pour reset password)
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  // 🔄 Mise à jour de l'utilisateur (réutilisable pour changer le mot de passe)
  async updateUser(
    id: string,
    updateData: Partial<User>,
  ): Promise<User | null> {
    await this.userRepository.update(id, updateData);
    return this.findById(id);
  }
}
