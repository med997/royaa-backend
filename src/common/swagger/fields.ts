import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

type Opts = { example?: unknown; optional?: boolean };

const base = (description: string, { example, optional }: Opts, extra: object = {}) =>
  (optional ? ApiPropertyOptional : ApiProperty)({ description, example, ...extra });
const opt = (o: Opts) => (o.optional ? IsOptional() : () => undefined);

export const Str = (description: string, o: Opts = {}) => applyDecorators(base(description, o), opt(o), IsString());
export const Num = (description: string, o: Opts & { min?: number } = {}) =>
  applyDecorators(base(description, o), opt(o), Type(() => Number), IsNumber(), ...(o.min !== undefined ? [Min(o.min)] : []));
export const Bool = (description: string, o: Opts = {}) => applyDecorators(base(description, o), opt(o), IsBoolean());
export const Enum = (description: string, values: string[], o: Opts = {}) =>
  applyDecorators(base(description, o, { enum: values }), opt(o), IsIn(values));
export const IsoDate = (description: string, o: Opts = {}) =>
  applyDecorators(base(description, o, { type: String, format: 'date-time' }), opt(o), IsDateString());
