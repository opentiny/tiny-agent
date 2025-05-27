import { Tool } from "@modelcontextprotocol/sdk/types";
import { JsonSchema, jsonSchemaToZod } from "json-schema-to-zod";
import { z, ZodRawShape} from 'zod';

export function getZodType(jsonSchema: JsonSchema): z.ZodTypeAny {
  return new Function('z', `return ${jsonSchemaToZod(jsonSchema, {depth: 1})}`)(z);
}

export function getZodRawShape(inputSchema: Tool['inputSchema']): ZodRawShape {
  return Object.fromEntries(
    Object.entries(inputSchema.properties || {}).map(([key, value]) => {
      let zodValue = getZodType(value as JsonSchema);
      if (inputSchema.required && !inputSchema.required.includes(key)) {
        zodValue = zodValue.optional();
      }
      return [key, zodValue];
    })
  )
}
