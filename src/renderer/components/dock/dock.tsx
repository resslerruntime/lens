/**
 * Copyright (c) 2021 OpenLens Authors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import "./dock.scss";
import React from "react";
import { observer } from "mobx-react";
import { cssNames, prevDefault } from "../../utils";
import { Icon } from "../icon";
import { MenuItem } from "../menu";
import { MenuActions } from "../menu/menu-actions";
import { ResizeDirection, ResizingAnchor } from "../resizing-anchor";
import { createResourceTab } from "./create-resource.store";
import { DockTabs } from "./dock-tabs";
import { dockStore, DockTab } from "./dock.store";
import { createTerminalTab } from "./terminal.store";
import { dockViewsManager } from "./dock.views-manager";

interface Props {
  className?: string;
}

@observer
export class Dock extends React.Component<Props> {
  onKeydown = (evt: React.KeyboardEvent<HTMLElement>) => {
    const { close, closeTab, selectedTab } = dockStore;

    if (!selectedTab) return;
    const { code, ctrlKey, shiftKey } = evt.nativeEvent;

    if (shiftKey && code === "Escape") {
      close();
    }

    if (ctrlKey && code === "KeyW") {
      if (selectedTab.pinned) close();
      else closeTab(selectedTab.id);
    }
  };

  onChangeTab = (tab: DockTab) => {
    const { open, selectTab } = dockStore;

    open();
    selectTab(tab.id);
  };
  
  render() {
    const { className } = this.props;
    const { isOpen, toggle, tabs, toggleFillSize, selectedTab, hasTabs, fullSize, height } = dockStore;
    const DockTabContent = dockViewsManager.get(selectedTab?.kind)?.tabContent;

    return (
      <div
        className={cssNames("Dock", className, { isOpen, isClosed: !isOpen, fullSize })}
        onKeyDown={this.onKeydown}
        tabIndex={-1}
      >
        <ResizingAnchor
          disabled={!hasTabs()}
          getCurrentExtent={() => dockStore.height}
          minExtent={dockStore.minHeight}
          maxExtent={dockStore.maxHeight}
          direction={ResizeDirection.VERTICAL}
          onStart={dockStore.open}
          onMinExtentSubceed={dockStore.close}
          onMinExtentExceed={dockStore.open}
          onDrag={extent => dockStore.height = extent}
        />
        <div className="tabs-container flex align-center" onDoubleClick={prevDefault(toggle)}>
          <DockTabs
            tabs={tabs}
            selectedTab={selectedTab}
            autoFocus={isOpen}
            onChangeTab={this.onChangeTab}
          />
          <div className="toolbar flex gaps align-center box grow">
            <div className="dock-menu box grow">
              <MenuActions usePortal triggerIcon={{ material: "add", className: "new-dock-tab", tooltip: "New tab" }} closeOnScroll={false}>
                <MenuItem className="create-terminal-tab" onClick={() => createTerminalTab()}>
                  <Icon small svg="terminal" size={15}/>
                  Terminal session
                </MenuItem>
                <MenuItem className="create-resource-tab" onClick={() => createResourceTab()}>
                  <Icon small material="create"/>
                  Create resource
                </MenuItem>
              </MenuActions>
            </div>
            {hasTabs() && (
              <>
                <Icon
                  material={fullSize ? "fullscreen_exit" : "fullscreen"}
                  tooltip={fullSize ? "Exit full size mode" : "Fit to window"}
                  onClick={toggleFillSize}
                />
                <Icon
                  material={`keyboard_arrow_${isOpen ? "down" : "up"}`}
                  tooltip={isOpen ? "Minimize" : "Open"}
                  onClick={toggle}
                />
              </>
            )}
          </div>
        </div>
        <div className="tab-content" style={{ flexBasis: isOpen ? height : 0 }}>
          {DockTabContent && <DockTabContent tab={selectedTab}/>}
        </div>
      </div>
    );
  }
}
