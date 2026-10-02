import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

const opt = (description: string, example: number, min: number, max: number, int = false) => {
  const api = ApiPropertyOptional({ description, example, minimum: min, maximum: max });
  return (target: object, key: string) => {
    api(target, key);
    IsOptional()(target, key);
    (int ? IsInt() : IsNumber())(target, key);
    Min(min)(target, key);
    Max(max)(target, key);
  };
};

export class CreatePrescriptionDto {
  @ApiProperty({ description: 'اسم الوصفة', example: 'وصفتي الحالية' })
  @IsString()
  label: string;

  @opt('SPH العين اليمنى', -2.5, -20, 20) rightSph?: number;
  @opt('CYL العين اليمنى', -0.75, -10, 10) rightCyl?: number;
  @opt('AXIS العين اليمنى', 90, 0, 180, true) rightAxis?: number;
  @opt('SPH العين اليسرى', -2.25, -20, 20) leftSph?: number;
  @opt('CYL العين اليسرى', -0.5, -10, 10) leftCyl?: number;
  @opt('AXIS العين اليسرى', 85, 0, 180, true) leftAxis?: number;
  @opt('ADD للقراءة (العدسات المتعددة البؤر)', 1.5, 0, 5) addPower?: number;
  @opt('المسافة بين البؤبؤين PD (مم)', 63, 40, 80) pd?: number;

  @ApiPropertyOptional({ description: 'رابط صورة الوصفة الطبية' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}
