import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiProperty, ApiResponse, getSchemaPath } from '@nestjs/swagger';

export class ErrorEnvelope {
  @ApiProperty({ description: 'رسالة الخطأ', example: 'Product not found' })
  errorMessage: string;

  @ApiProperty({ description: 'رمز الخطأ (يطابق رمز حالة HTTP)', example: 404 })
  errorNo: number;

  @ApiProperty({ description: 'دائماً null عند الخطأ', type: 'object', additionalProperties: true, nullable: true, example: null })
  data: null;
}

export const ApiOk = <T>(model: Type<T>, description: string, opts: { isArray?: boolean; status?: number } = {}) => {
  const data = opts.isArray ? { type: 'array', items: { $ref: getSchemaPath(model) } } : { $ref: getSchemaPath(model) };
  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status: opts.status ?? 200,
      description,
      schema: {
        properties: {
          errorMessage: { type: 'string', description: 'فارغ عند النجاح', example: '' },
          errorNo: { type: 'number', description: '0 عند النجاح', example: 0 },
          data,
        },
      },
    }),
  );
};

export const ApiErrors = (...statuses: [number, string][]) =>
  applyDecorators(...statuses.map(([status, description]) => ApiResponse({ status, description, type: ErrorEnvelope })));

export const ApiNoData = (description: string, status = 200) => ApiResponse({ status, description: `${description} (data = null)`, type: SuccessEmpty });

export class SuccessEmpty {
  @ApiProperty({ example: '' })
  errorMessage: string;

  @ApiProperty({ example: 0 })
  errorNo: number;

  @ApiProperty({ type: 'object', additionalProperties: true, nullable: true, example: null })
  data: null;
}
