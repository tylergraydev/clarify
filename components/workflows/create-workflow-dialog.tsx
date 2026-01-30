"use client";

import { ReactNode, useEffectEvent } from "react";
import { useEffect, useRef, useState } from "react";

import type { CreateWorkflowFormValues } from "@/lib/validations/workflow";

import { Button } from "@/components/ui/button";
import {
  DialogBackdrop,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { pauseBehaviors, workflowTypes } from "@/db/schema/workflows.schema";
import { useProjects } from "@/hooks/queries/use-projects";
import { useRepositoriesByProject } from "@/hooks/queries/use-repositories";
import { useActiveTemplates } from "@/hooks/queries/use-templates";
import { useCreateWorkflow } from "@/hooks/queries/use-workflows";
import { useElectron } from "@/hooks/use-electron";
import { useAppForm } from "@/lib/forms/form-hook";
import { createWorkflowSchema } from "@/lib/validations/workflow";

interface CreateWorkflowDialogProps {
  /** Callback when workflow is successfully created */
  onSuccess?: () => void;
  /** The trigger element that opens the dialog */
  trigger: ReactNode;
}

const workflowTypeOptions = workflowTypes.map((type) => ({
  label: type === "planning" ? "Planning" : "Implementation",
  value: type,
}));

const pauseBehaviorOptions = pauseBehaviors.map((behavior) => ({
  label:
    behavior === "continuous"
      ? "Continuous (no pauses)"
      : behavior === "auto_pause"
        ? "Auto Pause (pause between steps)"
        : "Gates Only (pause at quality gates)",
  value: behavior,
}));

const defaultValues: CreateWorkflowFormValues = {
  featureName: "",
  featureRequest: "",
  pauseBehavior: "auto_pause",
  projectId: "",
  repositoryIds: [],
  skipClarification: false,
  templateId: "",
  type: "planning",
};

export const CreateWorkflowDialog = ({
  onSuccess,
  trigger,
}: CreateWorkflowDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const previousTemplateIdRef = useRef<string>("");

  const { api } = useElectron();
  const { data: projects = [] } = useProjects();
  const { data: templates = [] } = useActiveTemplates();
  const { data: repositories = [] } =
    useRepositoriesByProject(selectedProjectId);
  const createWorkflowMutation = useCreateWorkflow({ autoStart: true });

  const isSubmitting = createWorkflowMutation.isPending;

  const projectOptions = projects.map((project) => ({
    label: project.name,
    value: String(project.id),
  }));

  const templateOptions = [
    { label: "None", value: "" },
    ...templates.map((template) => ({
      label: template.name,
      value: String(template.id),
    })),
  ];

  const repositoryOptions = repositories.map((repo) => ({
    label: repo.name,
    value: repo.id,
  }));

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        // Create the workflow (auto-started via hook option)
        const workflow = await createWorkflowMutation.mutateAsync({
          featureName: value.featureName,
          featureRequest: value.featureRequest,
          pauseBehavior: value.pauseBehavior,
          projectId: Number(value.projectId),
          skipClarification: value.skipClarification,
          type: value.type,
        });

        // Add repository associations
        if (api && value.repositoryIds.length > 0) {
          const primaryRepositoryId = value.primaryRepositoryId
            ? Number(value.primaryRepositoryId)
            : value.repositoryIds[0];
          await api.workflowRepository.addMultiple(
            workflow.id,
            value.repositoryIds,
            primaryRepositoryId
          );
        }

        handleClose();
        onSuccess?.();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to create workflow. Please try again.";
        throw new Error(message);
      }
    },
    validators: {
      onSubmit: createWorkflowSchema,
    },
  });

  const updateSelectedProject = useEffectEvent((id: number) => {
    setSelectedProjectId(id);
  });

  // Set default project when projects load
  useEffect(() => {
    const firstProject = projects[0];
    if (firstProject) {
      const currentProjectId = form.getFieldValue("projectId");
      if (currentProjectId === "") {
        form.setFieldValue("projectId", String(firstProject.id));
        updateSelectedProject(firstProject.id);
      }
    }
  }, [projects, form]);

  // Subscribe to form field changes
  useEffect(() => {
    const unsubscribe = form.store.subscribe(() => {
      // Track template changes
      const templateId = form.getFieldValue("templateId") ?? "";
      if (templateId !== selectedTemplateId) {
        setSelectedTemplateId(templateId);
      }

      // Track project changes to fetch repositories
      const projectId = form.getFieldValue("projectId");
      const numericProjectId = projectId ? Number(projectId) : 0;
      if (numericProjectId !== selectedProjectId) {
        setSelectedProjectId(numericProjectId);
        // Reset repository selection when project changes
        form.setFieldValue("repositoryIds", []);
      }
    });
    return () => unsubscribe();
  }, [form, selectedTemplateId, selectedProjectId]);

  // Handle template selection - populate feature request with template text
  useEffect(() => {
    if (selectedTemplateId !== previousTemplateIdRef.current) {
      previousTemplateIdRef.current = selectedTemplateId;

      if (selectedTemplateId) {
        const selectedTemplate = templates.find(
          (t) => String(t.id) === selectedTemplateId
        );
        if (selectedTemplate) {
          form.setFieldValue("featureRequest", selectedTemplate.templateText);
        }
      }
    }
  }, [selectedTemplateId, templates, form]);

  const handleClose = () => {
    setIsOpen(false);
    form.reset();
    setSelectedProjectId(0);
    setSelectedTemplateId("");
    previousTemplateIdRef.current = "";
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
      setSelectedProjectId(0);
      setSelectedTemplateId("");
      previousTemplateIdRef.current = "";
    }
  };

  return (
    <DialogRoot onOpenChange={handleOpenChange} open={isOpen}>
      {/* Trigger */}
      <DialogTrigger>{trigger}</DialogTrigger>

      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup scrollable={true} size={"lg"}>
          {/* Header */}
          <DialogHeader>
            <DialogTitle>{"Create Workflow"}</DialogTitle>
            <DialogDescription>
              {
                "Create a new workflow to plan or implement a feature. Select a project and describe what you want to build."
              }
            </DialogDescription>
          </DialogHeader>

          {/* Form wraps DialogBody + DialogFooter for submit to work */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <DialogBody>
              <div className={"flex flex-col gap-4"}>
                {/* Project Selection */}
                <form.AppField name={"projectId"}>
                  {(field) => (
                    <field.SelectField
                      label={"Project"}
                      options={projectOptions}
                      placeholder={"Select a project"}
                    />
                  )}
                </form.AppField>

                {/* Repository Selection */}
                {repositoryOptions.length > 0 && (
                  <form.AppField name={"repositoryIds"}>
                    {(field) => (
                      <field.MultiSelectField
                        description={
                          "Select the repositories this workflow will work with"
                        }
                        isRequired
                        label={"Repositories"}
                        options={repositoryOptions}
                      />
                    )}
                  </form.AppField>
                )}

                {/* Feature Name */}
                <form.AppField name={"featureName"}>
                  {(field) => (
                    <field.TextField
                      isRequired
                      label={"Feature Name"}
                      placeholder={"Enter a short feature title"}
                    />
                  )}
                </form.AppField>

                {/* Template Selection */}
                <form.AppField name={"templateId"}>
                  {(field) => (
                    <field.SelectField
                      description={
                        "Select a template to pre-fill the feature request"
                      }
                      label={"Template"}
                      options={templateOptions}
                      placeholder={"Select a template (optional)"}
                    />
                  )}
                </form.AppField>

                {/* Feature Request */}
                <form.AppField name={"featureRequest"}>
                  {(field) => (
                    <field.TextareaField
                      description={
                        "Describe the feature you want to build in detail"
                      }
                      label={"Feature Request"}
                      placeholder={"Describe the feature you want to build..."}
                      rows={6}
                    />
                  )}
                </form.AppField>

                {/* Workflow Type */}
                <form.AppField name={"type"}>
                  {(field) => (
                    <field.SelectField
                      description={
                        "Planning workflows refine requirements, Implementation workflows build features"
                      }
                      label={"Workflow Type"}
                      options={workflowTypeOptions}
                      placeholder={"Select workflow type"}
                    />
                  )}
                </form.AppField>

                {/* Pause Behavior */}
                <form.AppField name={"pauseBehavior"}>
                  {(field) => (
                    <field.SelectField
                      description={
                        "Control how the workflow pauses between steps"
                      }
                      label={"Pause Behavior"}
                      options={pauseBehaviorOptions}
                      placeholder={"Select pause behavior"}
                    />
                  )}
                </form.AppField>

                {/* Skip Clarification */}
                <form.AppField name={"skipClarification"}>
                  {(field) => (
                    <field.SwitchField
                      description={
                        "Skip the clarification step and proceed directly to refinement"
                      }
                      label={"Skip Clarification"}
                    />
                  )}
                </form.AppField>
              </div>
            </DialogBody>

            {/* Sticky Footer */}
            <DialogFooter>
              <DialogClose>
                <Button
                  disabled={isSubmitting}
                  type={"button"}
                  variant={"outline"}
                >
                  {"Cancel"}
                </Button>
              </DialogClose>
              <form.AppForm>
                <form.SubmitButton>
                  {isSubmitting ? "Creating..." : "Create Workflow"}
                </form.SubmitButton>
              </form.AppForm>
            </DialogFooter>
          </form>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
