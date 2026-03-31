import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import config from '../../ignoreSettingsConfig.json';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// TODO CHECK FOR ONLY STRINGS
export const extensionsUtil = new Set(config.settings);