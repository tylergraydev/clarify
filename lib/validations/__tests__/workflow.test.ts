import { describe, expect, it } from 'vitest';

import { createWorkflowSchema, editWorkflowFormSchema, updateWorkflowSchema } from '../workflow';

describe('createWorkflowSchema', () => {
  const validWorkflow = {
    clarificationAgentId: '3',
    featureName: 'Add auth',
    featureRequest: 'Implement user authentication',
    projectId: '5',
    repositoryIds: [1],
    skipClarification: false,
    type: 'planning' as const,
  };

  it('passes with valid planning workflow', () => {
    const result = createWorkflowSchema.safeParse(validWorkflow);
    expect(result.success).toBe(true);
  });

  it('transforms projectId string to number', () => {
    const result = createWorkflowSchema.safeParse(validWorkflow);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projectId).toBe(5);
    }
  });

  it('transforms clarificationAgentId string to number', () => {
    const result = createWorkflowSchema.safeParse(validWorkflow);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.clarificationAgentId).toBe(3);
    }
  });

  it('transforms clarificationAgentId empty string to null', () => {
    const result = createWorkflowSchema.safeParse({
      ...validWorkflow,
      clarificationAgentId: '',
      skipClarification: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.clarificationAgentId).toBeNull();
    }
  });

  it('fails for planning workflow with skipClarification false and no agent', () => {
    const result = createWorkflowSchema.safeParse({
      ...validWorkflow,
      clarificationAgentId: '',
      skipClarification: false,
    });
    expect(result.success).toBe(false);
  });

  it('passes for planning workflow with skipClarification true and no agent', () => {
    const result = createWorkflowSchema.safeParse({
      ...validWorkflow,
      clarificationAgentId: '',
      skipClarification: true,
    });
    expect(result.success).toBe(true);
  });

  it('skips clarification validation for implementation workflow', () => {
    const result = createWorkflowSchema.safeParse({
      ...validWorkflow,
      clarificationAgentId: '',
      skipClarification: false,
      type: 'implementation',
    });
    expect(result.success).toBe(true);
  });

  it('fails with empty featureName', () => {
    const result = createWorkflowSchema.safeParse({ ...validWorkflow, featureName: '' });
    expect(result.success).toBe(false);
  });

  it('fails with empty repositoryIds', () => {
    const result = createWorkflowSchema.safeParse({ ...validWorkflow, repositoryIds: [] });
    expect(result.success).toBe(false);
  });

  it('transforms templateId string to number', () => {
    const result = createWorkflowSchema.safeParse({
      ...validWorkflow,
      templateId: '7',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.templateId).toBe(7);
    }
  });

  it('transforms templateId empty string to null', () => {
    const result = createWorkflowSchema.safeParse({
      ...validWorkflow,
      templateId: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.templateId).toBeNull();
    }
  });
});

describe('updateWorkflowSchema', () => {
  it('passes with partial update of featureName only', () => {
    const result = updateWorkflowSchema.safeParse({ featureName: 'Updated' });
    expect(result.success).toBe(true);
  });

  it('fails when skipClarification is false and clarificationAgentId is null', () => {
    const result = updateWorkflowSchema.safeParse({
      clarificationAgentId: null,
      skipClarification: false,
    });
    expect(result.success).toBe(false);
  });

  it('passes when only one of the pair is provided', () => {
    const skipOnly = updateWorkflowSchema.safeParse({ skipClarification: false });
    expect(skipOnly.success).toBe(true);

    const agentOnly = updateWorkflowSchema.safeParse({ clarificationAgentId: null });
    expect(agentOnly.success).toBe(true);
  });

  it('passes for implementation type even with skipClarification false and null agent', () => {
    const result = updateWorkflowSchema.safeParse({
      clarificationAgentId: null,
      skipClarification: false,
      type: 'implementation',
    });
    expect(result.success).toBe(true);
  });
});

describe('editWorkflowFormSchema', () => {
  const validEditData = {
    clarificationAgentId: 3,
    featureName: 'Edit feature',
    featureRequest: 'Implement editing',
    pauseBehavior: 'auto_pause' as const,
    skipClarification: false,
    type: 'planning' as const,
  };

  it('passes with valid edit form data', () => {
    const result = editWorkflowFormSchema.safeParse(validEditData);
    expect(result.success).toBe(true);
  });

  it('fails for planning workflow with skipClarification false and no agent', () => {
    const result = editWorkflowFormSchema.safeParse({
      ...validEditData,
      clarificationAgentId: null,
      skipClarification: false,
    });
    expect(result.success).toBe(false);
  });

  it('passes for planning workflow with skipClarification true and no agent', () => {
    const result = editWorkflowFormSchema.safeParse({
      ...validEditData,
      clarificationAgentId: null,
      skipClarification: true,
    });
    expect(result.success).toBe(true);
  });

  it('passes for implementation workflow with skipClarification false and no agent', () => {
    const result = editWorkflowFormSchema.safeParse({
      ...validEditData,
      clarificationAgentId: null,
      skipClarification: false,
      type: 'implementation',
    });
    expect(result.success).toBe(true);
  });

  it('fails with empty featureName', () => {
    const result = editWorkflowFormSchema.safeParse({
      ...validEditData,
      featureName: '',
    });
    expect(result.success).toBe(false);
  });
});
