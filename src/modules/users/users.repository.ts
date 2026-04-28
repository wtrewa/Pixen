import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from './entities/user.entity';
import { QueryUserDto } from './dto/query-user.dto';
import { paginate, buildPaginatedResult } from '../../common/utils/pagination.util';

@Injectable()
export class UsersRepository {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  async findAll(query: QueryUserDto) {
    const { skip, take } = paginate(query.page, query.limit);
    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.search) where.fullName = ILike(`%${query.search}%`);

    const [data, total] = await this.repo.findAndCount({ where, skip, take });
    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id }, relations: ['vendor'] });
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email }, relations: ['vendor'] });
  }

  create(data: Partial<User>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<User>) {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  softDelete(id: string) {
    return this.repo.softDelete(id);
  }
}
