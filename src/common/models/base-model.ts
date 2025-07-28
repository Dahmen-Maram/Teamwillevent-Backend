import {
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
@Entity()
export class BaseModel {
  @CreateDateColumn({ nullable: true, type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ nullable: true, type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true, type: 'timestamp' })
  deletedAt: Date;
}
