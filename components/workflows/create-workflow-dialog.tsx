"use client";

import type { ReactNode } from "react";

import { useEffect, useRef, useState } from "react";

import type { CreateWorkflowFormValues } from "@/lib/validations/workflow";

import { Button } from "@/components/ui/button";
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  pauseBehaviors,
  workflowTypes,
} from "@/db/schema/workflows.schema";
import { useProjects } from "@/hooks/queries/use-projects";
import { useActiveTemplates } from "@/hooks/queries/use-templates";
import { useCreateWorkflow } from "@/hooks/queries/use-workflows";
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
  templateId: "",
  type: "planning",
};

export const CreateWorkflowDialog = ({
  onSuccess,
  trigger,
}: CreateWorkflowDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const previousTemplateIdRef = useRef<string>("");

  const { data: projects = [] } = useProjects();
  const { data: templates = [] } = useActiveTemplates();
  const createWorkflowMutation = useCreateWorkflow();

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

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        await createWorkflowMutation.mutateAsync({
          featureName: value.featureName,
          featureRequest: value.featureRequest,
          pauseBehavior: value.pauseBehavior,
          projectId: Number(value.projectId),
          type: value.type,
        });
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

  // Set default project when projects load
  useEffect(() => {
    const firstProject = projects[0];
    if (firstProject) {
      const currentProjectId = form.getFieldValue("projectId");
      if (currentProjectId === "") {
        form.setFieldValue("projectId", String(firstProject.id));
      }
    }
  }, [projects, form]);

  // Subscribe to template field changes using form subscription
  useEffect(() => {
    const unsubscribe = form.store.subscribe(() => {
      const templateId = form.getFieldValue("templateId") ?? "";
      if (templateId !== selectedTemplateId) {
        setSelectedTemplateId(templateId);
      }
    });
    return () => unsubscribe();
  }, [form, selectedTemplateId]);

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
    setSelectedTemplateId("");
    previousTemplateIdRef.current = "";
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
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
        <DialogPopup className={"max-w-lg"}>
          {/* Header */}
          <DialogTitle>{"Create Workflow"}</DialogTitle>
          <DialogDescription>
            {
              "Create a new workflow to plan or implement a feature. Select a project and describe what you want to build."
            }
          </DialogDescription>

          {/* Form */}
          <form
            className={"mt-6"}
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
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
                    description={"Select a template to pre-fill the feature request"}
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

              {/* Action Buttons */}
              <div className={"mt-2 flex justify-end gap-3"}>
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
              </div>
            </div>
          </form>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
