import { isCustomToolbarItem } from '@gms/ui-core-components/lib/components/ui-widgets/toolbar/toolbar-item/custom-item';
import { render } from '@testing-library/react';
import * as React from 'react';

import {
  AmplitudeScalingOptions,
  useScalingOptions
} from '../../../../../../../../src/ts/components/analyst-ui/components/waveform/components/waveform-controls/scaling-options';

describe('Scaling Options Toolbar Item', () => {
  it('should exist', () => {
    expect(useScalingOptions).toBeDefined();
  });
  it('should return a ToolbarItem element that matches a snapshot', () => {
    function ScalingOptionWrapper() {
      const newScalingOptionToolbarItem = useScalingOptions(
        AmplitudeScalingOptions.AUTO,
        1,
        () => {
          /* empty */
        },
        () => {
          /* empty */
        },
        'testscaling'
      );
      const { props: itemBase } = newScalingOptionToolbarItem.toolbarItem;
      return isCustomToolbarItem(itemBase) ? itemBase.element : <div />;
    }
    const { container } = render(<ScalingOptionWrapper />);
    expect(container).toMatchSnapshot();
  });
});
