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

import { apiKubePrefix } from "../common/vars";
import type { IMetricsReqParams } from "../common/k8s-api/endpoints/metrics.api";
import { LensProxy } from "./lens-proxy";
import type { Cluster } from "./cluster";
import got, { OptionsOfJSONResponseBody } from "got";

function getKubeProxyUrl() {
  return `http://localhost:${LensProxy.getInstance().port}${apiKubePrefix}`;
}

export async function k8sRequest<T = any>(cluster: Cluster, path: string, options: OptionsOfJSONResponseBody = {}): Promise<T> {
  const kubeProxyUrl = getKubeProxyUrl();

  options.timeout ??= 30000;
  options.headers ??= {};
  options.headers.Host = `${cluster.id}.${new URL(kubeProxyUrl).host}`; // required in ClusterManager.getClusterForRequest()
  options.responseType = "json";

  const { body } = await got<T>(kubeProxyUrl + path, options);

  return body;
}

export async function getMetrics(cluster: Cluster, prometheusPath: string, queryParams: IMetricsReqParams & { query: string }): Promise<any> {
  const prometheusPrefix = cluster.preferences.prometheus?.prefix || "";
  const kubeProxyUrl = getKubeProxyUrl();
  const url = `${kubeProxyUrl}/api/v1/namespaces/${prometheusPath}/proxy${prometheusPrefix}/api/v1/query_range`;
  const { body } = await got.post<any>(url, {
    form: queryParams,
    headers: {
      Host: `${cluster.id}.${new URL(kubeProxyUrl).host}`,
    },
    responseType: "json"
  });

  return body;
}
