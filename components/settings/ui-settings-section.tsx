"use client";

import type { ReactElement } from "react";

import { ThemeSelector } from "@/components/ui/theme-selector";

import { SettingsSection } from "./settings-section";

/**
 * UI settings section for managing appearance preferences.
 * Contains the theme selector and any future UI preference controls.
 *
 * Note: Unlike other settings sections, the theme selector is a standalone
 * component that manages its own state through ThemeProvider, not a form field.
 */
export const UISettingsSection = (): ReactElement => {
  return (
    <SettingsSection title={"Appearance"}>
      {/* Theme Selection */}
      <ThemeSelector />
    </SettingsSection>
  );
};
