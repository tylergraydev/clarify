import { GLOBAL_PROJECT_VALUE } from '@/lib/validations/agent';

export const projectIdToFormValue = (id: null | number | undefined): string => {
  return id === null || id === undefined ? GLOBAL_PROJECT_VALUE : String(id);
};

export const formValueToProjectId = (value: string): null | number => {
  return value === GLOBAL_PROJECT_VALUE ? null : Number(value);
};
