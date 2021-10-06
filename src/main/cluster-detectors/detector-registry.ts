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

import { observable } from "mobx";
import type { ClusterMetadata } from "../../common/cluster-types";
import { iter, Singleton } from "../../common/utils";
import type { Cluster } from "../cluster";
import type { BaseClusterDetector, ClusterDetectionResult } from "./base-cluster-detector";

export type ClusterDetectionConstructor = new (cluster: Cluster) => BaseClusterDetector;

export class DetectorRegistry extends Singleton {
  private registry = observable.array<ClusterDetectionConstructor>([], { deep: false });

  add(detectorClass: ClusterDetectionConstructor): this {
    this.registry.push(detectorClass);

    return this;
  }

  async detectForCluster(cluster: Cluster): Promise<ClusterMetadata> {
    const results = new Map<string, ClusterDetectionResult>();
    const detections = this.registry.map(async DetectorClass => {
      const detector = new DetectorClass(cluster);

      return [detector.key, await detector.detect()] as const;
    });

    for (const detection of detections) {
      try {
        const [key, data] = await detection;

        if (
          data && (
            !results.has(key)
            || results.get(key).accuracy <= data.accuracy
          )
        ) {
          results.set(key, data);
        }
      } catch {} // ignore errors
    }

    return Object.fromEntries(
      iter.map(
        Object.entries(results),
        ([key, { value }]) => [key, value]
      )
    );
  }
}
