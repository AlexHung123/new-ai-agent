'use client';

import CloseBackToItms from './CloseBackToItms';
import { RightPanelToggle } from './RightPanelContext';

export default function WorkspaceChrome() {
  return (
    <div className="workspace-panel-chrome">
      <CloseBackToItms />
      <RightPanelToggle />
    </div>
  );
}
