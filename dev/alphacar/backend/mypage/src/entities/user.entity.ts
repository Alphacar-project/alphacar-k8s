// src/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, name: 'socialId' })
  socialId: string;

  @Column({ nullable: true })
  nickname: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  password: string; // 이메일 회원가입용 비밀번호 (해시)

  @Column({ default: 'kakao' })
  provider: string; // kakao, google, email 등

  @Column({ default: 0 })
  point: number;

  @Column({ default: 0, name: 'quote_count' })
  quoteCount: number;

  @Column({ default: 'user' })
  role: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
