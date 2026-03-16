// Placeholder — implementation in Task 2
import type { ComponentDef, ComponentEntry } from './types';

export const WEBFLOW_COMPONENT_REGISTRY: Record<string, ComponentDef> = {};

export function detectComponents(_doc: Document): ComponentEntry[] {
  return [];
}

export function detectInteractions(_doc: Document): boolean {
  return false;
}
