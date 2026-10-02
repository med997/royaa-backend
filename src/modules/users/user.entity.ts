import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_name' })
  userName: string;

  @Column({ name: 'mobile_no', unique: true })
  mobileNo: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'otp_code', type: 'varchar', nullable: true })
  otpCode: string | null;

  @Column({ name: 'otp_expires_at', type: 'timestamptz', nullable: true })
  otpExpiresAt: Date | null;

  @Column({ type: 'simple-array', default: 'customer' })
  roles: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  language: string | null;

  @Column({ type: 'varchar', nullable: true })
  currency: string | null;

  @Column({ name: 'fcm_token', type: 'varchar', nullable: true })
  fcmToken: string | null;

  @Column({ name: 'token_version', type: 'int', default: 0 })
  tokenVersion: number;

  @Column({ name: 'otp_attempts', type: 'int', default: 0 })
  otpAttempts: number;

  @Column({ name: 'otp_sent_at', type: 'timestamptz', nullable: true })
  otpSentAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
