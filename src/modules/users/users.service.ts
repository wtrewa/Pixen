import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { CACHE_KEYS } from '../../common/constants';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly redis: RedisService,
  ) {}

  async create(dto: CreateUserDto) {
    const exists = await this.usersRepository.findByEmail(dto.email);
    if (exists) throw new ConflictException('Email already in use');
    return this.usersRepository.create(dto);
  }

  findAll(query: QueryUserDto) {
    return this.usersRepository.findAll(query);
  }

  async findOne(id: string) {
    const cached = await this.redis.get(CACHE_KEYS.USER_PROFILE(id));
    if (cached) return cached;

    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);

    await this.redis.set(CACHE_KEYS.USER_PROFILE(id), user);
    return user;
  }

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async update(id: string, dto: UpdateUserDto | UpdateProfileDto) {
    await this.findOne(id);

    // `repository.update` bypasses TypeORM entity hooks, so the @BeforeUpdate
    // password hash never runs — hash here to avoid storing plaintext passwords.
    const data: any = { ...dto };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const updated = await this.usersRepository.update(id, data);
    await this.redis.del(CACHE_KEYS.USER_PROFILE(id));
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.usersRepository.softDelete(id);
    await this.redis.del(CACHE_KEYS.USER_PROFILE(id));
  }
}
