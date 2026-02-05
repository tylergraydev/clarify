/**
 * Structured Output Validator
 *
 * Generic utility for validating structured outputs from Claude Agent SDK results.
 * This eliminates duplicate validation logic across agent step services by providing
 * a single, consistent validation interface that:
 * - Checks SDK result subtypes (success, error_max_structured_output_retries, etc.)
 * - Validates against Zod schemas
 * - Integrates with debug logging for validation failures
 * - Returns discriminated union types for type-safe error handling
 *
 * ## Usage Example
 *
 * ```typescript
 * const validator = new StructuredOutputValidator(mySchema);
 * const result = validator.validate(resultMessage, sessionId);
 *
 * if (result.success) {
 *   const data = result.data; // Fully typed from schema
 * } else {
 *   console.error(result.error); // Type-safe error message
 * }
 * ```
 *
 * @see {@link ../clarification-step.service.ts Clarification Service (reference pattern)}
 * @see {@link ../refinement-step.service.ts Refinement Service (reference pattern)}
 * @see {@link ../file-discovery.service.ts File Discovery Service (reference pattern)}
 */

import type { SDKResultMessage } from '@anthropic-ai/claude-agent-sdk';
import type { z } from 'zod';

import { debugLoggerService } from '../debug-logger.service';

/**
 * Failed validation result with error message.
 */
export interface ValidationFailure {
  /** Validated data is undefined for error results */
  data?: undefined;
  /** Error message describing what went wrong */
  error: string;
  /** Success discriminator */
  success: false;
}

/**
 * Discriminated union of validation results.
 * Enables type-safe error handling with proper narrowing.
 */
export type ValidationResult<TSchema> = ValidationFailure | ValidationSuccess<TSchema>;

/**
 * Successful validation result with typed data.
 */
export interface ValidationSuccess<TSchema> {
  /** The validated and typed data from the schema */
  data: TSchema;
  /** Error is undefined for success results */
  error?: undefined;
  /** Success discriminator */
  success: true;
}

/**
 * Generic validator for SDK structured outputs with Zod schema support.
 *
 * Provides consistent validation across all agent step services by:
 * 1. Checking SDK result subtypes (success, error_max_structured_output_retries, etc.)
 * 2. Validating structured_output field presence
 * 3. Running Zod schema validation with safeParse
 * 4. Logging validation failures to debug logger
 * 5. Returning discriminated union for type-safe error handling
 *
 * ## Type Safety
 *
 * The validator infers the output type from the Zod schema, ensuring
 * that successful validation results are fully typed without manual casting:
 *
 * ```typescript
 * const schema = z.object({ name: z.string(), age: z.number() });
 * const validator = new StructuredOutputValidator(schema);
 * const result = validator.validate(resultMessage, sessionId);
 *
 * if (result.success) {
 *   result.data.name; // Type: string
 *   result.data.age;  // Type: number
 * }
 * ```
 */
export class StructuredOutputValidator<TSchema extends z.ZodTypeAny> {
  private schema: TSchema;

  /**
   * Create a new validator for structured outputs.
   *
   * @param schema - Zod schema to validate against
   */
  constructor(schema: TSchema) {
    this.schema = schema;
  }

  /**
   * Validate structured output from an SDK result message.
   *
   * This method performs comprehensive validation:
   * 1. Checks for SDK-level errors (error_max_structured_output_retries)
   * 2. Checks for non-success subtypes (error, timeout, etc.)
   * 3. Validates that structured_output field exists
   * 4. Runs Zod schema validation
   * 5. Logs failures to debug logger
   *
   * @param resultMessage - The SDK result message to validate
   * @param sessionId - Session ID for debug logging
   * @returns Discriminated union with success/error and typed data
   *
   * @example
   * ```typescript
   * const result = validator.validate(resultMessage, sessionId);
   *
   * if (result.success) {
   *   console.log('Validated data:', result.data);
   * } else {
   *   console.error('Validation failed:', result.error);
   * }
   * ```
   */
  validate(resultMessage: SDKResultMessage, sessionId: string): ValidationResult<z.infer<TSchema>> {
    // Check for structured output validation failure
    // This occurs when the SDK retries structured output parsing multiple times
    // and all attempts fail to produce valid output matching the schema
    if (resultMessage.subtype === 'error_max_structured_output_retries') {
      const errors = 'errors' in resultMessage ? resultMessage.errors : [];
      const errorMessage = `Agent could not produce valid structured output: ${errors.join(', ')}`;

      debugLoggerService.logSdkEvent(sessionId, 'Structured output max retries exceeded', {
        errors,
        subtype: resultMessage.subtype,
      });

      return {
        error: errorMessage,
        success: false,
      };
    }

    // Check for other error subtypes (non-success results)
    // The SDK may return various error subtypes like 'error', 'timeout', 'cancelled', etc.
    if (resultMessage.subtype !== 'success') {
      const errors = 'errors' in resultMessage ? resultMessage.errors : [];
      const errorMessage = `Agent execution failed: ${resultMessage.subtype} - ${errors.join(', ')}`;

      debugLoggerService.logSdkEvent(sessionId, 'SDK result subtype is not success', {
        errors,
        subtype: resultMessage.subtype,
      });

      return {
        error: errorMessage,
        success: false,
      };
    }

    // Extract structured output field
    // For success subtypes, this field should always be present
    const structuredOutput = resultMessage.structured_output;
    if (!structuredOutput) {
      const errorMessage = 'Agent completed successfully but no structured output was returned';

      debugLoggerService.logSdkEvent(sessionId, 'Missing structured_output field', {
        hasStructuredOutput: false,
        subtype: resultMessage.subtype,
      });

      return {
        error: errorMessage,
        success: false,
      };
    }

    // Validate with Zod schema
    // safeParse returns { success: true, data } or { success: false, error }
    const parsed = this.schema.safeParse(structuredOutput);

    if (!parsed.success) {
      const errorMessage = `Structured output validation failed: ${parsed.error.message}`;

      debugLoggerService.logSdkEvent(sessionId, 'Zod schema validation failed', {
        error: parsed.error.message,
        issues: parsed.error.issues,
        structuredOutput,
      });

      return {
        error: errorMessage,
        success: false,
      };
    }

    // Success: return validated and typed data
    debugLoggerService.logSdkEvent(sessionId, 'Structured output validation succeeded', {
      hasData: !!parsed.data,
    });

    return {
      data: parsed.data,
      success: true,
    };
  }

  /**
   * Validate that a required field exists on validated data.
   *
   * This is a convenience helper for checking specific fields after
   * successful schema validation. Useful for discriminated unions
   * where certain fields are required based on the type.
   *
   * @param data - The validated data object
   * @param fieldName - Name of the field to check
   * @param sessionId - Session ID for debug logging
   * @returns ValidationResult indicating if field exists
   *
   * @example
   * ```typescript
   * const result = validator.validate(resultMessage, sessionId);
   * if (result.success) {
   *   if (result.data.type === 'QUESTIONS_FOR_USER') {
   *     const fieldCheck = validator.validateField(
   *       result.data,
   *       'questions',
   *       sessionId
   *     );
   *     if (!fieldCheck.success) {
   *       console.error(fieldCheck.error);
   *     }
   *   }
   * }
   * ```
   */
  validateField<TData extends Record<string, unknown>>(
    data: TData,
    fieldName: keyof TData,
    sessionId: string
  ): ValidationResult<TData> {
    const fieldValue = data[fieldName];

    if (fieldValue === undefined || fieldValue === null) {
      const errorMessage = `Missing required field: "${String(fieldName)}"`;

      debugLoggerService.logSdkEvent(sessionId, 'Field validation failed', {
        data,
        fieldName: String(fieldName),
      });

      return {
        error: errorMessage,
        success: false,
      };
    }

    // For array fields, also check if non-empty
    if (Array.isArray(fieldValue) && fieldValue.length === 0) {
      const errorMessage = `Required field "${String(fieldName)}" is an empty array`;

      debugLoggerService.logSdkEvent(sessionId, 'Field validation failed (empty array)', {
        data,
        fieldName: String(fieldName),
      });

      return {
        error: errorMessage,
        success: false,
      };
    }

    // For string fields, also check if non-empty after trimming
    if (typeof fieldValue === 'string' && fieldValue.trim().length === 0) {
      const errorMessage = `Required field "${String(fieldName)}" is an empty string`;

      debugLoggerService.logSdkEvent(sessionId, 'Field validation failed (empty string)', {
        data,
        fieldName: String(fieldName),
      });

      return {
        error: errorMessage,
        success: false,
      };
    }

    return {
      data,
      success: true,
    };
  }
}
