"use client";

import { AlertCircle } from "lucide-react";

import { useFormContext } from "@/lib/forms/form-hook";
import { cn } from "@/lib/utils";

type FormErrorProps = ClassName;

export function FormError({ className }: FormErrorProps) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.errors}>
      {(errors) => {
        if (errors.length === 0) {
          return null;
        }

        return (
          <div
            aria-live={"assertive"}
            className={cn(
              `
                flex items-start gap-2 rounded-md border border-destructive/50
                bg-destructive/10 p-3 text-sm text-destructive
              `,
              className
            )}
            role={"alert"}
          >
            <AlertCircle
              aria-hidden={"true"}
              className={`
              mt-0.5 size-4 shrink-0
            `}
            />
            <div className={"flex flex-col gap-1"}>
              {errors.map((error, index) => {
                // Handle both string and object error formats from TanStack Form/Zod
                const message =
                  typeof error === "string" ? error : error?.message;
                return message ? <p key={index}>{message}</p> : null;
              })}
            </div>
          </div>
        );
      }}
    </form.Subscribe>
  );
}
