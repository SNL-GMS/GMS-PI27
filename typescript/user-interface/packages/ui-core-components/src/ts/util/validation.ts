import type { Message } from '../components/ui-widgets/form/types';

export interface ValidationDefinition<T, M extends Message | ((value: T) => M) = Message> {
  valueIsInvalid: (value: T) => boolean;
  invalidMessage: M;
}

/**
 * Returns a function that can be used to validate a given input
 * against multiple different conditions. Accepts a callback function
 * to handle the error results.
 *
 * @param invalidHandler Callback to handler error results
 * @param definitions List of error conditions with their corresponding error message
 * @returns Validator function. Returns `true` if valid.
 */
export function getValidator<T, M extends Message | ((value: T) => M) = Message>(
  invalidHandler: (invalid: boolean, invalidMessage: M | undefined) => void,
  definitions: ValidationDefinition<T, M>[]
) {
  return function validate(value: T): boolean {
    let isInvalid = false;
    let invalidMessage: M | undefined;

    definitions.forEach(def => {
      if (def.valueIsInvalid(value)) {
        isInvalid = true;
        if (typeof def.invalidMessage === 'function') {
          invalidMessage = def.invalidMessage(value);
        } else {
          invalidMessage = def.invalidMessage;
        }
      }
    });

    invalidHandler(isInvalid, invalidMessage);
    return !isInvalid;
  };
}

/**
 * Returns a function that can be used to validate a given input
 * against multiple different conditions. Accepts a callback function
 * to handle the error results.
 *
 * @param invalidHandler Callback to handler error results
 * @param definitions List of error conditions with their corresponding error message
 * @returns Validator function. Returns `true` if valid.
 */
export function getMessageValidator<T, M extends Message = Message>(
  definitions: ValidationDefinition<T, M | ((value: T) => M)>[]
) {
  return function validate(value: T): M[] | undefined {
    const invalidMessages = definitions
      .filter(def => {
        return def.valueIsInvalid(value);
      })
      .map<M>(validationDef => {
        if (typeof validationDef.invalidMessage === 'function') {
          return validationDef.invalidMessage(value);
        }
        return validationDef.invalidMessage;
      })
      .filter(message => message != null);
    return invalidMessages.length > 0 ? invalidMessages : undefined;
  };
}

export function getPriorityMessage<M extends Message>(messages: M[]) {
  if (messages == null || messages.length === 0) {
    return undefined;
  }
  return (
    messages.find(message => message.intent === 'danger') ??
    messages.find(message => message.intent === 'warning') ??
    messages.find(message => message.intent === 'success') ??
    messages.find(message => message.intent === 'primary') ??
    messages.find(message => message.intent === 'none') ??
    messages[0]
  );
}
