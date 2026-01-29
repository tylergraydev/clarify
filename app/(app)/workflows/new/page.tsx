"use client";

import { ArrowLeft, FileText } from "lucide-react";
import { $path } from "next-typesafe-url";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import type { CreateWorkflowFormValues } from "@/lib/validations/workflow";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { TemplatePickerDialog } from "@/components/workflows/template-picker-dialog";
import { pauseBehaviors, workflowTypes } from "@/db/schema/workflows.schema";
import { useProjects } from "@/hooks/queries/use-projects";
import { useActiveTemplates } from "@/hooks/queries/use-templates";
import { useCreateWorkflow } from "@/hooks/queries/use-workflows";
import { useAppForm } from "@/lib/forms/form-hook";
import { createWorkflowSchema } from "@/lib/validations/workflow";

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

export default function NewWorkflowPage() {
  const router = useRouter();
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
        const workflow = await createWorkflowMutation.mutateAsync({
          featureName: value.featureName,
          featureRequest: value.featureRequest,
          pauseBehavior: value.pauseBehavior,
          projectId: Number(value.projectId),
          type: value.type,
        });
        // Redirect to workflow detail page if it exists, otherwise to workflows list
        router.push(
          $path({
            route: "/workflows/[id]",
            routeParams: { id: String(workflow.id) },
          })
        );
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

  const handleCancel = () => {
    router.push($path({ route: "/workflows" }));
  };

  // Handle template insertion from TemplatePicker dialog
  const handleTemplateInsert = useCallback(
    (content: string) => {
      const currentValue = form.getFieldValue("featureRequest") ?? "";
      // Append template content to existing content, with a newline separator if needed
      const newValue = currentValue
        ? `${currentValue}\n\n${content}`
        : content;
      form.setFieldValue("featureRequest", newValue);
    },
    [form]
  );

  return (
    <div className={"space-y-6"}>
      {/* Page Header */}
      <header className={"space-y-1"}>
        <Link
          className={
            "inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          }
          href={$path({ route: "/workflows" })}
        >
          <ArrowLeft aria-hidden={"true"} className={"size-4"} />
          {"Back to Workflows"}
        </Link>
        <h1 className={"text-2xl font-semibold tracking-tight"}>
          {"Create New Workflow"}
        </h1>
        <p className={"text-muted-foreground"}>
          {
            "Create a new workflow to plan or implement a feature. Select a project and describe what you want to build."
          }
        </p>
      </header>

      {/* Form Card */}
      <Card className={"max-w-2xl"}>
        <CardHeader>
          <CardTitle>{"Workflow Details"}</CardTitle>
          <CardDescription>
            {"Fill in the details below to create your workflow."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
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
                    description={
                      "Select a template to pre-fill the feature request"
                    }
                    label={"Template"}
                    options={templateOptions}
                    placeholder={"Select a template (optional)"}
                  />
                )}
              </form.AppField>

              {/* Feature Request with Template Picker */}
              <div className={"flex flex-col gap-2"}>
                {/* Insert Template Button Row */}
                <div className={"flex justify-end"}>
                  <Tooltip
                    content={
                      "Browse and insert pre-defined templates with customizable placeholders"
                    }
                    side={"top"}
                  >
                    <TemplatePickerDialog
                      onInsert={handleTemplateInsert}
                      trigger={
                        <Button
                          className={"gap-1.5"}
                          size={"sm"}
                          type={"button"}
                          variant={"outline"}
                        >
                          <FileText aria-hidden={"true"} className={"size-4"} />
                          {"Insert Template"}
                        </Button>
                      }
                    />
                  </Tooltip>
                </div>

                {/* Feature Request Textarea */}
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
              </div>

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
              <div className={"mt-4 flex justify-end gap-3"}>
                <Button
                  disabled={isSubmitting}
                  onClick={handleCancel}
                  type={"button"}
                  variant={"outline"}
                >
                  {"Cancel"}
                </Button>
                <form.AppForm>
                  <form.SubmitButton>
                    {isSubmitting ? "Creating..." : "Create Workflow"}
                  </form.SubmitButton>
                </form.AppForm>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
