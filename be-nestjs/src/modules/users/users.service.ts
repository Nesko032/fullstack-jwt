import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';
import { hashPasswordHelper } from '@/utils/helper';
import aqp from 'api-query-params';
import { CodeAuthDto, CreateAuthDto } from '@/auth/dto/create-auth.dto';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly mailerService: MailerService,
  ) {}

  isEmailExist = async (email: string) => {
    const user = await this.userModel.exists({ email });

    if (user) {
      return true;
    } else {
      return false;
    }
  };

  async create(createUserDto: CreateUserDto) {
    const { name, email, password, phone, address, image } = createUserDto;

    //check email
    const isExist = await this.isEmailExist(email);

    if (isExist) {
      throw new BadRequestException(
        `This email ${email} existed. Please try another email`,
      );
    }

    //hash password
    const hashPassword = await hashPasswordHelper(password);
    const user = await this.userModel.create({
      name,
      email,
      password: hashPassword,
      phone,
      address,
      image,
    });

    return {
      _id: user._id,
    };
  }

  async findAll(query: string, current: number, pageSize: number) {
    const { filter, sort } = aqp(query);
    if (filter.current) delete filter.current;
    if (filter.pageSize) delete filter.pageSize;

    if (!current) current = 1;
    if (!pageSize) pageSize = 10;

    const totalItems = (await this.userModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const skip = (current - 1) * pageSize;

    const results = await this.userModel
      .find(filter)
      .limit(pageSize)
      .skip(skip)
      .sort(sort as any)
      .select('-password');

    return { results, totalPages };
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async findByEmail(email: string) {
    return await this.userModel.findOne({ email });
  }

  async update(updateUserDto: UpdateUserDto) {
    return await this.userModel.updateOne(
      { _id: updateUserDto._id },
      { ...updateUserDto },
    );
  }

  async remove(_id: string) {
    if (mongoose.isValidObjectId(_id)) {
      //delete
      return this.userModel.deleteOne({ _id });
    } else {
      throw new BadRequestException('Invalid value');
    }
  }

  async handleRegister(registerDto: CreateAuthDto) {
    const { name, email, password } = registerDto;

    //check email
    const isExist = await this.isEmailExist(email);

    if (isExist) {
      throw new BadRequestException(
        `This email ${email} existed. Please try another email`,
      );
    }

    //hash password
    const hashPassword = await hashPasswordHelper(password);
    const codeId = uuidv4();
    const user = await this.userModel.create({
      name,
      email,
      password: hashPassword,
      isActive: false,
      codeId: codeId,
      codeExpired: dayjs().add(5, 'minutes'),
    });

    this.mailerService.sendMail({
      to: user.email,
      subject: 'Active your account at @Nesko',
      template: 'register',
      context: {
        name: 'Nesko',
        activationCode: codeId,
      },
    });
    console.log(codeId);

    return {
      _id: user._id,
    };
  }

  async handleActive(codeDto: CodeAuthDto) {
    const user = await this.userModel.findOne({
      _id: codeDto._id,
      codeId: codeDto.code,
    });

    if (!user) {
      throw new BadRequestException('Invalid code or expired code');
    }

    const isBeforeExpired = dayjs().isBefore(user.codeExpired);
    if (!isBeforeExpired) {
      throw new BadRequestException(
        'This code has expired, please press the button to get another code',
      );
    } else {
      await this.userModel.updateOne({ _id: codeDto._id }, { isActive: true });
    }

    return {
      isBeforeExpired,
    };
  }
}
