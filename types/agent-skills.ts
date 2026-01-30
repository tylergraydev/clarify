/**
 * Agent Skills Types
 *
 * Type definitions for managing skill selection state in the agent editor.
 */

/**
 * Pending skill data for creating a new agent skill
 */
export interface PendingSkillData {
  /** Whether this skill is required */
  isRequired: boolean;
  /** The name of the skill */
  skillName: string;
}
