import { z } from 'zod';

import { AllColorMaps } from '../color/types';
import { constructZodLiteralUnionType } from '../type-util/zod-util';

/**  UserMode COI */
export enum UserMode {
  IAN = 'IAN'
}

/**
 * DefaultLayoutNames COI
 *
 * Defines the possible layout names.
 */
export enum DefaultLayoutNames {
  ANALYST_LAYOUT = 'ANALYST_LAYOUT'
}

/** A zod schema defining the user preferences. */
const userPreferenceSchema = z
  .object({
    /**
     * The name (unique) of the color map that should be used for generating images such as FK spectra
     */
    colorMap: constructZodLiteralUnionType(
      AllColorMaps.map(literal => z.literal(literal))
    ).readonly(),

    /**
     * The name (unique) of the UI theme that should be applied to GMS. The theme with this name
     * will be looked up in processing config. If not found, GMS will fall back to the default theme.
     */
    currentTheme: z.string().min(1).readonly()
  })
  .readonly();

// UI specific since backend accepts any json object
export type UserPreferences = z.infer<typeof userPreferenceSchema>;

/** A zod schema defining the user layout. */
const userLayoutSchema = z
  .object({
    /** the unique layout name */
    name: z.string().min(1).readonly(),

    /** the supported interface modes */
    supportedUserInterfaceModes: z.array(z.nativeEnum(UserMode)).min(1),

    /** the golden layout URI encoded json layout configuration */
    layoutConfiguration: z.string().min(1).readonly()
  })
  .readonly();

/**
 * User UserLayout COI
 *
 * A URI encoded json representation of a golden layout.
 * Includes metadata like supported user interface modes and the name of the layout.
 */
export type UserLayout = z.infer<typeof userLayoutSchema>;

/** A zod schema defining the user profile. */
export const userProfileSchema = z
  .object({
    /** the unique user id */
    userId: z.string().min(1).readonly(),

    /** stores the default for Analyst mode */
    defaultAnalystLayoutName: z.string().min(1).readonly(),

    /** the configured workspace layouts */
    workspaceLayouts: z.array(userLayoutSchema).min(1).readonly(),

    /** user preferences */
    preferences: userPreferenceSchema.readonly()
  })
  .readonly();

/**  User profile COI */
export type UserProfile = z.infer<typeof userProfileSchema>;
