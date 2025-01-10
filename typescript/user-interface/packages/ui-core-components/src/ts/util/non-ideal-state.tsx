import type { IconName } from '@blueprintjs/core';
import { Icon, Intent, NonIdealState, Spinner } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import React from 'react';

/**
 * Creates a NonIdealState blueprint JSX with the option of passing a title and description
 *
 * @param title optional description of the title that will be displayed
 * @param description optional description that will be displayed
 * @param icon optional the icon state that will be displayed
 */
export function nonIdealStateWithNoSpinner(
  title?: string,
  description?: string,
  icon?: IconName
): any {
  return <NonIdealState icon={icon} title={title || null} description={description || undefined} />;
}

/**
 * Creates a NonIdealState blueprint JSX with an icon with intent color
 * with the option of passing a title and description
 *
 * @param title optional description of the title that will be displayed
 * @param description optional description that will be displayed
 * @param icon optional the icon state that will be displayed
 * @param intent optional the intent state that will be displayed
 */
export function nonIdealStateWithIntent(
  title: string,
  description?: string,
  icon?: IconName,
  intent: Intent = Intent.PRIMARY
): JSX.Element {
  return (
    <NonIdealState
      className="non-ideal-intent-icon"
      icon={<Icon icon={icon} intent={intent} size={48} />}
      title={title || null}
      description={description || undefined}
    />
  );
}

/**
 * Creates a NonIdealState blueprint JSX with a red error icon
 * with the option of passing a title and description
 *
 * @param title optional description of the title that will be displayed
 * @param description optional description that will be displayed
 */
export function nonIdealStateWithError(title?: string, description?: string): JSX.Element {
  return nonIdealStateWithIntent(title || '', description, IconNames.ISSUE, Intent.DANGER);
}

/**
 * Creates a NonIdealState blueprint JSX with a yellow warning
 * with the option of passing a title and description
 *
 * @param title optional description of the title that will be displayed
 * @param description optional description that will be displayed
 */
export function nonIdealStateWithWarning(title?: string, description?: string): JSX.Element {
  return nonIdealStateWithIntent(title || '', description, IconNames.WarningSign, Intent.WARNING);
}

/**
 * Creates a NonIdealState blueprint JSX with a spinner action
 * with the option of passing a title and description
 *
 * @param title optional description of the title that will be displayed
 * @param description optional description that will be displayed
 * @param icon optional the icon state that will be displayed
 * @param intent optional the intent state that will be displayed
 */
export function nonIdealStateWithSpinner(
  title?: string,
  description?: string,
  icon?: IconName,
  intent: Intent = Intent.PRIMARY
): JSX.Element {
  return (
    <NonIdealState
      action={<Spinner intent={intent} />}
      icon={icon}
      title={title || null}
      description={description || undefined}
    />
  );
}

/**
 * Creates a NonIdealState Blueprint JSX Element
 * with a widget ('action' in Blueprint terms) for resolving the non-ideal state
 */
export function nonIdealStateWithWidget(
  widget: JSX.Element,
  title?: string,
  description?: string,
  icon?: IconName
): JSX.Element {
  return (
    <NonIdealState
      action={widget}
      icon={icon}
      title={title || null}
      description={description || undefined}
    />
  );
}
