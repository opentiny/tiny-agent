import { z } from 'zod';
import type { ZodTypeAny } from 'zod';

export const jsonSchemaToZod = (schema: any): ZodTypeAny => {
  if (!schema) return z.any();
  switch (schema.type) {
    case 'string': {
      let str = z.string();
      if (schema.description) str = str.describe(schema.description);
      return str;
    }
    case 'number':
    case 'integer': {
      let num = z.number();
      if (schema.description) num = num.describe(schema.description);
      return num;
    }
    case 'boolean': {
      let bool = z.boolean();
      if (schema.description) bool = bool.describe(schema.description);
      return bool;
    }
    case 'array': {
      // 修复：将 case 代码块用花括号包裹，避免 case 内部声明变量导致的语法错误
      return z.array(jsonSchemaToZod(schema.items));
    }
    case 'object': {
      const shape: Record<string, ZodTypeAny> = {};
      const props = schema.properties || {};
      const required = schema.required || [];
      for (const key in props) {
        let propSchema = jsonSchemaToZod(props[key]);
        if (!required.includes(key)) propSchema = propSchema.optional();
        shape[key] = propSchema;
      }
      let obj = z.object(shape);
      if (schema.description) obj = obj.describe(schema.description);
      return obj;
    }
    default:
      return z.any();
  }
};
