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

import React from "react";
import { DrawerSubTitle } from ".";
import { DrawerTitle } from "./drawer-title";

export interface DrawerSectionProps {
  className?: string;
  title?: React.ReactNode;
  hidden?: boolean;
}

export class DrawerSection extends React.Component<DrawerSectionProps> {
  render() {
    const { title, children, className, hidden } = this.props;

    if (hidden) {
      return null;
    }

    return (
      <>
        <DrawerTitle className={className} title={title} />
        {children}
      </>
    );
  }
}

export class DrawerSubSection extends React.Component<DrawerSectionProps> {
  render() {
    const { title, children, className, hidden } = this.props;

    if (hidden) {
      return null;
    }

    return (
      <>
        <DrawerSubTitle className={className} title={title} />
        {children}
      </>
    );
  }
}
