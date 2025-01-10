import { Dialog } from '@blueprintjs/core';
import { ArrayUtil } from '@gms/common-model';
import { DropDown } from '@gms/ui-core-components';
import {
  analystActions,
  selectPhaseSelectorFavorites,
  selectPhaseSelectorPhaseList,
  useAppDispatch,
  useAppSelector,
  usePhaseLists
} from '@gms/ui-state';
import { getTabbableElementsByClassname, handleTabOrArrows } from '@gms/ui-util';
import classnames from 'classnames';
import React from 'react';
import { toast } from 'react-toastify';

import type { PhaseHotkey } from '~analyst-ui/components/waveform/types';
import { KeyComboMarks } from '~common-ui/components/keyboard-shortcuts/key-combo-marks';

import { PhaseCategoryList } from './phase-category-list';
import { useHasScrolled } from './phase-selector-utils';

/**
 * The type of the props for the {@link PhaseSelectorDialog} component
 */
export interface PhaseSelectorDialogProps {
  readonly phaseHotkeys?: PhaseHotkey[];

  readonly isOpen: boolean;
  /**
   * The title of the popup
   */
  readonly title: string;

  /**
   * Hotkey combos. Within one hotkey combo, separated by `+` characters.
   * Multiple hotkeys may be configured to support different operating systems.
   * In this case, each hotkey should be separated by a comma and a space: `, `,
   *
   * @example `Alt + e, option + e`
   */
  readonly hotkeyCombo?: string;

  /**
   * Selected phases for selection
   */
  readonly selectedPhases?: string[];

  /**
   * Callback that accepts the selected phases
   */
  readonly phaseSelectorCallback: (selectedPhases: string[]) => void;

  /**
   * callback to close the popup
   */
  readonly closeCallback: () => void;

  /**
   * A child jsx element for an extra optional selector
   */
  readonly children?: React.ReactNode;
}

function InternalPhaseSelectorDialog({
  selectedPhases = [],
  hotkeyCombo = '',
  isOpen = false,
  title,
  phaseHotkeys,
  phaseSelectorCallback,
  closeCallback,
  children
}: PhaseSelectorDialogProps) {
  const dialogClassName = 'phase-selector_dialog';
  const tabbableClassName = 'phase-selector-tabbable';
  const dispatch = useAppDispatch();
  const phaseLists = usePhaseLists();
  const selectedPhaseListTitle =
    useAppSelector(selectPhaseSelectorPhaseList) || phaseLists?.[0]?.listTitle;
  const favoritesList = useAppSelector(selectPhaseSelectorFavorites);

  const selectedPhaseList = React.useMemo(
    () => phaseLists.find(list => list.listTitle === selectedPhaseListTitle),
    [phaseLists, selectedPhaseListTitle]
  );

  const defaultPhase = selectedPhaseList?.defaultPhaseLabelAssignment;
  const currentPhase = useAppSelector(state => state.app.analyst.currentPhase);

  const updateFavoritesList = React.useCallback(
    (phase: string) => {
      if (phase === defaultPhase) {
        toast.info(`Cannot remove default phase from favorites.`, {
          toastId: 'toast-remove-favorite-default'
        });
        return;
      }
      if (favoritesList[selectedPhaseListTitle].includes(phase)) {
        dispatch(
          analystActions.setPhaseSelectorFavorites({
            listName: selectedPhaseListTitle,
            favorites: favoritesList[selectedPhaseListTitle].filter(fav => fav !== phase)
          })
        );
      } else {
        dispatch(
          analystActions.setPhaseSelectorFavorites({
            listName: selectedPhaseListTitle,
            favorites: [...favoritesList[selectedPhaseListTitle], phase]
          })
        );
      }
    },
    [defaultPhase, dispatch, favoritesList, selectedPhaseListTitle]
  );

  const selectPhaseList = React.useCallback(
    (phaseListTitle: string) => {
      dispatch(analystActions.setPhaseSelectorPhaseList(phaseListTitle));
      const phaseList = ArrayUtil.findOrThrow(
        phaseLists,
        list => list.listTitle === phaseListTitle
      );
      dispatch(
        analystActions.setDefaultSignalDetectionPhase(phaseList.defaultPhaseLabelAssignment)
      );
      // if the favorites list isn't populated populate it
      if (favoritesList[phaseListTitle] === undefined) {
        dispatch(
          analystActions.setPhaseSelectorFavorites({
            listName: phaseListTitle,
            favorites: phaseList?.favorites
          })
        );
      }
    },
    [dispatch, favoritesList, phaseLists]
  );

  const scrollListenerRef = React.useRef<HTMLElement | null>(null);
  const hasScrolled = useHasScrolled(scrollListenerRef);
  const numElementsTotal = selectedPhaseList?.categorizedPhases.reduce((total, category) => {
    return total + category.phases.length + 1;
  }, 0);

  const focusToCurrentPhase = () => {
    const tabbableElements = getTabbableElementsByClassname(dialogClassName, tabbableClassName);
    const currentPhaseElement = tabbableElements.find(element =>
      selectedPhases.includes(element.firstChild?.textContent ?? '')
    );
    currentPhaseElement?.focus();
  };

  return (
    <Dialog
      style={{ '--num-phases': numElementsTotal } as React.CSSProperties}
      className="phase-selector_dialog"
      isOpen={isOpen}
      onOpened={() => {
        focusToCurrentPhase();
      }}
      onClose={closeCallback}
      usePortal
      canOutsideClickClose
      shouldReturnFocusOnClose
      title={
        <div className="form__header phase-selector__header">
          <div>{title}</div>
          <div className="form__header-decoration">
            {hotkeyCombo ? <KeyComboMarks hotkeys={[hotkeyCombo]} description="" /> : null}
          </div>
        </div>
      }
    >
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <section
        className={classnames('phase-selector', 'phase-selector--current-phase')}
        onKeyDown={e => handleTabOrArrows(e, dialogClassName, tabbableClassName)}
      >
        <header className="phase-selector__header">
          <DropDown
            disabled={false}
            className="phase-selector__dropdown"
            dropDownItems={phaseLists?.map(pl => pl.listTitle)}
            value={selectedPhaseListTitle}
            onChange={val => selectPhaseList(val)}
          />
          {children}
        </header>
        <section
          ref={scrollListenerRef}
          className="phase-selector__body"
          data-has-scrolled={hasScrolled}
        >
          <section className="phase-selector__favorites">
            <PhaseCategoryList
              phaseHotkeys={phaseHotkeys ?? []}
              categorizedPhases={{
                categoryTitle: 'Favorites',
                phases: favoritesList[selectedPhaseListTitle]
              }}
              selectedPhases={selectedPhases || [currentPhase]}
              phaseSelectorCallback={phaseSelectorCallback}
              onClose={closeCallback}
              favorites={favoritesList[selectedPhaseListTitle]}
              updateFavoritesList={updateFavoritesList}
            />
          </section>

          <section className="phase-selector__phases">
            <ol className="phase-categories">
              {selectedPhaseList?.categorizedPhases.map(cat => (
                <PhaseCategoryList
                  key={cat.categoryTitle}
                  phaseHotkeys={phaseHotkeys ?? []}
                  categorizedPhases={cat}
                  selectedPhases={selectedPhases}
                  phaseSelectorCallback={phaseSelectorCallback}
                  onClose={closeCallback}
                  favorites={favoritesList[selectedPhaseListTitle]}
                  updateFavoritesList={updateFavoritesList}
                />
              ))}
            </ol>
          </section>
        </section>
      </section>
    </Dialog>
  );
}

/**
 * Creates a phase selector dialog popup.
 */
export const PhaseSelectorDialog = React.memo(InternalPhaseSelectorDialog);
