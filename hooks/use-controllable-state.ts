import { useState } from 'react';

interface UseControllableStateOptions<T> {
  defaultValue: T;
  onChange?: (value: T) => void;
  value?: T;
}

const noop = () => {
  /* empty on purpose */
};

export function useControllableState<T>({
  defaultValue,
  onChange,
  value: controlledValue,
}: UseControllableStateOptions<T>): [T, (value: T) => void] {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;
  const setValue = isControlled ? (onChange ?? noop) : setUncontrolledValue;

  return [value, setValue];
}
