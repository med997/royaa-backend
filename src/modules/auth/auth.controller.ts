import { Body, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrors, ApiNoData, ApiOk } from '../../common/swagger/api-response.js';
import { AuthResultModel, MobileModel, UserModel } from '../../common/swagger/response-models.js';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { SendOtpDto, VerifyOtpDto } from './dto/otp.dto.js';
import { ChangePasswordDto, RefreshDto, ResetPasswordDto, UpdateProfileDto } from './dto/profile.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './current-user.decorator.js';

const AUTH_401 = [401, 'غير مصرّح: الرمز مفقود أو غير صالح'] as [number, string];

@ApiTags('المصادقة')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'إنشاء حساب جديد', description: 'ينشئ الحساب ويُصدر رمز OTP (حالياً 1234 ويُطبع في سجل الخادم). يجب التحقق منه عبر `/auth/otp/verify` قبل تسجيل الدخول.' })
  @ApiOk(MobileModel, 'تم إنشاء الحساب وإرسال رمز التحقق', { status: 201 })
  @ApiErrors([400, 'بيانات غير صالحة (مثلاً كلمة المرور أقل من 6 أحرف)'], [409, 'رقم الجوال مسجَّل مسبقاً'])
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'تسجيل الدخول', description: 'قناة العملاء. يُرجع رمز وصول `token` ورمز تجديد `refreshToken`. الحساب يجب أن يكون موثَّقاً.' })
  @ApiOk(AuthResultModel, 'تم تسجيل الدخول', { status: 201 })
  @ApiErrors([401, 'بيانات الدخول خاطئة أو الحساب غير موثَّق'], [403, 'الحساب معطَّل'])
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.mobileNo, dto.password);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'تجديد الجلسة', description: 'يستبدل رمز التجديد بزوج رموز جديد.' })
  @ApiOk(AuthResultModel, 'تم التجديد', { status: 201 })
  @ApiErrors([401, 'رمز التجديد غير صالح أو منتهٍ'])
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('otp/send')
  @ApiOperation({ summary: 'إعادة إرسال رمز التحقق', description: 'يُصدر رمز OTP جديداً صالحاً 5 دقائق. يُسمح بطلب واحد كل 60 ثانية.' })
  @ApiOk(MobileModel, 'تم إرسال الرمز', { status: 201 })
  @ApiErrors([400, 'المستخدم غير موجود'], [429, 'طلبات كثيرة، انتظر قبل إعادة المحاولة'])
  sendOtp(@Body() dto: SendOtpDto) {
    return this.auth.sendOtp(dto.mobileNo);
  }

  @Post('otp/verify')
  @ApiOperation({ summary: 'التحقق من رمز OTP', description: 'يوثّق الحساب ويُرجع الرموز وبيانات المستخدم. بعد 5 محاولات خاطئة يجب طلب رمز جديد.' })
  @ApiOk(AuthResultModel, 'تم التحقق', { status: 201 })
  @ApiErrors([400, 'لم يُطلب رمز، أو الرمز خاطئ، أو منتهي الصلاحية'], [429, 'محاولات كثيرة'])
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto.mobileNo, dto.code);
  }

  @Post('password/forgot')
  @ApiOperation({ summary: 'نسيت كلمة المرور', description: 'يُرسل رمز OTP إلى الجوال المسجَّل.' })
  @ApiOk(MobileModel, 'تم إرسال الرمز', { status: 201 })
  @ApiErrors([400, 'المستخدم غير موجود'], [429, 'طلبات كثيرة'])
  forgot(@Body() dto: SendOtpDto) {
    return this.auth.forgotPassword(dto.mobileNo);
  }

  @Post('password/reset')
  @ApiOperation({ summary: 'إعادة تعيين كلمة المرور', description: 'يتحقق من الرمز ويغيّر كلمة المرور، ويُنهي الجلسات القديمة ويُرجع جلسة جديدة.' })
  @ApiOk(AuthResultModel, 'تم التغيير', { status: 201 })
  @ApiErrors([400, 'الرمز خاطئ أو منتهٍ'], [429, 'محاولات كثيرة'])
  reset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.mobileNo, dto.code, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'بيانات المستخدم الحالي', description: 'يُستخدم لاستعادة الجلسة والتحقق من صلاحية الرمز.' })
  @ApiOk(UserModel, 'بيانات المستخدم')
  @ApiErrors(AUTH_401)
  @Get('me')
  me(@CurrentUser() user: { userId: string }) {
    return this.auth.me(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تعديل الملف الشخصي', description: 'الاسم والبريد والصورة واللغة والعملة المفضلتان ورمز FCM. كل الحقول اختيارية.' })
  @ApiOk(UserModel, 'البيانات بعد التعديل')
  @ApiErrors(AUTH_401)
  @Patch('me')
  updateMe(@CurrentUser() user: { userId: string }, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حذف الحساب', description: 'يُجهَّل الحساب (تُمسح بياناته الشخصية) وتبقى الطلبات السابقة. لا يمكن التراجع.' })
  @ApiNoData('تم الحذف')
  @ApiErrors(AUTH_401)
  @Delete('me')
  deleteMe(@CurrentUser() user: { userId: string }) {
    return this.auth.deleteAccount(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تغيير كلمة المرور', description: 'يُنهي الجلسات الأخرى ويُرجع جلسة جديدة.' })
  @ApiOk(AuthResultModel, 'تم التغيير', { status: 201 })
  @ApiErrors(AUTH_401)
  @Post('password/change')
  change(@CurrentUser() user: { userId: string }, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user.userId, dto.currentPassword, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تسجيل الخروج', description: 'يُبطل رموز التجديد ويمسح رمز FCM.' })
  @ApiNoData('تم الخروج', 201)
  @ApiErrors(AUTH_401)
  @Post('logout')
  logout(@CurrentUser() user: { userId: string }) {
    return this.auth.logout(user.userId);
  }
}
