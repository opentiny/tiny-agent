import { z } from 'zod';
import type { ZodTypeAny } from 'zod';

// 类型定义
interface JsonSchema {
  type?: string | string[];
  const?: any;
  enum?: any[];
  oneOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  allOf?: JsonSchema[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema | JsonSchema[];
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  minProperties?: number;
  maxProperties?: number;
  additionalProperties?: boolean | JsonSchema;
  nullable?: boolean;
  description?: string;
  default?: any;
}

// 工具函数
const isNumber = (value: any): value is number => typeof value === 'number';
const createUnion = (schemas: ZodTypeAny[]) =>
  schemas.length === 1 ? schemas[0] : z.union([schemas[0], schemas[1], ...schemas.slice(2)]);

// 应用约束
const applyConstraints = (zodSchema: ZodTypeAny, schema: JsonSchema): ZodTypeAny => {
  let result = zodSchema;

  if (schema.nullable === true) {
    result = z.union([result, z.null()]);
  }

  if (schema.description) {
    result = result.describe(schema.description);
  }

  if (schema.default !== undefined) {
    result = result.default(schema.default);
  }

  return result;
};

// 创建对象字面量 schema
const createObjectLiteralSchema = (value: any): ZodTypeAny => {
  return z
    .object({})
    .passthrough()
    .refine((data) => JSON.stringify(data) === JSON.stringify(value), { message: `Expected ${JSON.stringify(value)}` });
};

// 处理枚举值
const handleEnum = (schema: JsonSchema): ZodTypeAny | null => {
  if (!Array.isArray(schema.enum)) return null;

  if (schema.enum.length === 0) return z.never();

  if (schema.enum.length === 1) {
    const value = schema.enum[0];
    const enumSchema =
      typeof value === 'object' && value !== null ? createObjectLiteralSchema(value) : z.literal(value);
    return applyConstraints(enumSchema, schema);
  }

  const schemas = schema.enum.map((value: any) =>
    typeof value === 'object' && value !== null ? createObjectLiteralSchema(value) : z.literal(value),
  );

  return applyConstraints(createUnion(schemas), schema);
};

// 处理联合类型（oneOf 和 anyOf）
const handleUnion = (schemas: JsonSchema[] | undefined, parentSchema: JsonSchema): ZodTypeAny | null => {
  if (!Array.isArray(schemas)) return null;
  if (schemas.length === 0) return z.never();
  if (schemas.length === 1) return jsonSchemaToZod(schemas[0]);

  const unionSchemas = schemas.map((subSchema) => jsonSchemaToZod(subSchema));
  return applyConstraints(createUnion(unionSchemas), parentSchema);
};

// 处理 allOf 交集类型
const handleAllOf = (schema: JsonSchema): ZodTypeAny | null => {
  if (!Array.isArray(schema.allOf) || schema.allOf.length === 0) return null;

  const mergedSchema = schema.allOf.reduce(
    (acc: any, subSchema: any) => {
      if (subSchema.type === 'object' && acc.type === 'object') {
        return {
          ...acc,
          ...subSchema,
          properties: { ...(acc.properties || {}), ...(subSchema.properties || {}) },
          required: [...(acc.required || []), ...(subSchema.required || [])],
        };
      }
      return acc;
    },
    { type: 'object' },
  );

  return jsonSchemaToZod(mergedSchema);
};

// 处理多类型数组
const handleMultipleTypes = (schema: JsonSchema): ZodTypeAny | null => {
  if (!Array.isArray(schema.type)) return null;

  if (schema.type.length === 1) {
    return jsonSchemaToZod({ ...schema, type: schema.type[0] });
  }

  const typeSchemas = schema.type.map((type: string) => jsonSchemaToZod({ ...schema, type }));
  return applyConstraints(createUnion(typeSchemas), schema);
};

// 处理字符串类型
const handleStringType = (schema: JsonSchema): ZodTypeAny => {
  let stringSchema = z.string();

  if (isNumber(schema.minLength)) {
    stringSchema = stringSchema.min(schema.minLength);
  }
  if (isNumber(schema.maxLength)) {
    stringSchema = stringSchema.max(schema.maxLength);
  }

  if (typeof schema.pattern === 'string') {
    try {
      if (schema.pattern.length <= 2048) {
        const unsafe = /(\.\*|\.\+|\[[^\]]+\]\+|\)[*+]){2,}/.test(schema.pattern);
        if (!unsafe) {
          stringSchema = stringSchema.regex(new RegExp(schema.pattern));
        } else {
          console.warn('Potentially unsafe regex pattern in schema, skipping:', schema.pattern);
        }
      } else {
        console.warn('Regex pattern too long in schema, skipping:', schema.pattern.length);
      }
    } catch {
      console.warn('Invalid regex pattern in schema:', schema.pattern);
    }
  }

  if (schema.format) {
    switch (schema.format) {
      case 'email':
        stringSchema = stringSchema.email();
        break;
      case 'url':
        stringSchema = stringSchema.url();
        break;
      case 'uuid':
        stringSchema = stringSchema.uuid();
        break;
      case 'date-time':
        stringSchema = stringSchema.datetime();
        break;
    }
  }

  return applyConstraints(stringSchema, schema);
};

// 处理数字类型
const handleNumberType = (schema: JsonSchema, isInteger = false): ZodTypeAny => {
  let numberSchema: ZodTypeAny = isInteger ? z.number().int() : z.number();

  const min = schema.exclusiveMinimum ?? schema.minimum;
  const max = schema.exclusiveMaximum ?? schema.maximum;

  if (isNumber(min)) {
    numberSchema =
      schema.exclusiveMinimum !== undefined
        ? (numberSchema as z.ZodNumber).gt(min)
        : (numberSchema as z.ZodNumber).gte(min);
  }
  if (isNumber(max)) {
    numberSchema =
      schema.exclusiveMaximum !== undefined
        ? (numberSchema as z.ZodNumber).lt(max)
        : (numberSchema as z.ZodNumber).lte(max);
  }
  if (isNumber(schema.multipleOf)) {
    numberSchema = (numberSchema as z.ZodNumber).multipleOf(schema.multipleOf);
  }

  return applyConstraints(numberSchema, schema);
};

// 处理数组类型
const handleArrayType = (schema: JsonSchema): ZodTypeAny => {
  if (Array.isArray(schema.items)) {
    if (schema.items.length === 0) {
      return applyConstraints(z.tuple([]), schema);
    }

    const tupleItems = schema.items.map((itemSchema) => jsonSchemaToZod(itemSchema));
    let tupleSchema: ZodTypeAny =
      tupleItems.length === 1
        ? z.tuple([tupleItems[0]])
        : z.tuple([tupleItems[0], ...tupleItems.slice(1)] as [ZodTypeAny, ...ZodTypeAny[]]);

    if (isNumber(schema.minItems)) {
      tupleSchema = tupleSchema.refine((arr) => arr.length >= schema.minItems!, {
        message: `Tuple must have at least ${schema.minItems} items`,
      });
    }
    if (isNumber(schema.maxItems)) {
      tupleSchema = tupleSchema.refine((arr) => arr.length <= schema.maxItems!, {
        message: `Tuple must have at most ${schema.maxItems} items`,
      });
    }

    return applyConstraints(tupleSchema, schema);
  }

  let arraySchema = z.array(jsonSchemaToZod(schema.items || {}));

  if (isNumber(schema.minItems)) {
    arraySchema = arraySchema.min(schema.minItems);
  }
  if (isNumber(schema.maxItems)) {
    arraySchema = arraySchema.max(schema.maxItems);
  }
  if (schema.uniqueItems === true) {
    arraySchema = arraySchema.refine((arr) => new Set(arr.map((item) => JSON.stringify(item))).size === arr.length, {
      message: 'Array items must be unique',
    }) as any;
  }

  return applyConstraints(arraySchema, schema);
};

// 处理对象类型
const handleObjectType = (schema: JsonSchema): ZodTypeAny => {
  const shape: Record<string, ZodTypeAny> = {};
  const properties = schema.properties || {};
  const required = schema.required || [];

  for (const [key, propSchema] of Object.entries(properties)) {
    let propertyZodSchema = jsonSchemaToZod(propSchema);
    if (!required.includes(key)) {
      propertyZodSchema = propertyZodSchema.optional();
    }
    shape[key] = propertyZodSchema;
  }

  let objectSchema: ZodTypeAny = z.object(shape);

  if (schema.additionalProperties === false) {
    objectSchema = (objectSchema as any).strict() as ZodTypeAny;
  } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    objectSchema = (objectSchema as any).catchall(jsonSchemaToZod(schema.additionalProperties));
  } else if (schema.additionalProperties === true) {
    objectSchema = (objectSchema as any).catchall(z.any());
  }

  if (isNumber(schema.minProperties)) {
    objectSchema = objectSchema.refine((obj) => Object.keys(obj).length >= schema.minProperties!, {
      message: `Object must have at least ${schema.minProperties} properties`,
    });
  }
  if (isNumber(schema.maxProperties)) {
    objectSchema = objectSchema.refine((obj) => Object.keys(obj).length <= schema.maxProperties!, {
      message: `Object must have at most ${schema.maxProperties} properties`,
    });
  }

  return applyConstraints(objectSchema, schema);
};

// 主函数：将 JSON Schema 转换为 Zod schema
export const jsonSchemaToZod = (schema: any): ZodTypeAny => {
  if (!schema || typeof schema !== 'object') {
    return z.any();
  }

  if (schema.const !== undefined) {
    const value = schema.const;
    const constSchema =
      typeof value === 'object' && value !== null ? createObjectLiteralSchema(value) : z.literal(value as any);
    return applyConstraints(constSchema, schema);
  }

  return (
    handleEnum(schema) ||
    handleUnion(schema.oneOf, schema) ||
    handleUnion(schema.anyOf, schema) ||
    handleAllOf(schema) ||
    handleMultipleTypes(schema) ||
    (() => {
      switch (schema.type) {
        case 'string':
          return handleStringType(schema);
        case 'number':
          return handleNumberType(schema, false);
        case 'integer':
          return handleNumberType(schema, true);
        case 'boolean':
          return applyConstraints(z.boolean(), schema);
        case 'null':
          return z.null();
        case 'array':
          return handleArrayType(schema);
        case 'object':
          return handleObjectType(schema);
        default:
          console.warn('Unknown schema type:', schema.type);
          return z.any();
      }
    })()
  );
};
