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

import yaml from "js-yaml";
import { readFile } from "fs-extra";
import { promiseExecFile } from "../promise-exec";
import { helmCli } from "./helm-cli";
import { Singleton } from "../../common/utils/singleton";
import logger from "../logger";
import { iter } from "../../common/utils";

export type HelmEnv = Record<string, string> & {
  HELM_REPOSITORY_CACHE?: string;
  HELM_REPOSITORY_CONFIG?: string;
};

export interface HelmRepoConfig {
  repositories: HelmRepo[]
}

export interface HelmRepo {
  name: string;
  url: string;
  cacheFilePath?: string
  caFile?: string,
  certFile?: string,
  insecureSkipTlsVerify?: boolean,
  keyFile?: string,
  username?: string,
  password?: string,
}

/**
 * A Regex for matching strings of the form <key>=<value> where key MUST NOT
 * include a '='
 */
const envVarMatcher = /^((?<key>[^=]*)=(?<value>.*))$/;

export class HelmRepoManager extends Singleton {
  protected helmEnv: HelmEnv | null = null;

  private async ensureInitialized() {
    helmCli.setLogger(logger);
    await helmCli.ensureBinary();

    if (!this.helmEnv) {
      this.helmEnv = await HelmRepoManager.parseHelmEnv();
      await HelmRepoManager.update();
    }
  }

  protected static async executeHelm(args: string[]): Promise<string> {
    const helm = await helmCli.binaryPath();

    try {
      const { stdout } = await promiseExecFile(helm, args);

      return stdout;
    } catch (error) {
      throw error?.stderr || error;
    }
  }

  protected static async parseHelmEnv(): Promise<Record<string, string>> {
    const output = await HelmRepoManager.executeHelm(["env"]);

    return Object.fromEntries(
      iter.map(
        iter.filterMap(
          output.split(/\r?\n/),
          line => line.match(envVarMatcher),
        ),
        ({ groups: { key, value }}) => [key, JSON.parse(value)]
      )
    );
  }

  public async repo(name: string): Promise<HelmRepo> {
    const repos = await this.repositories();

    return repos.find(repo => repo.name === name);
  }

  private async readConfig(): Promise<HelmRepoConfig> {
    try {
      const rawConfig = await readFile(this.helmEnv.HELM_REPOSITORY_CONFIG, "utf8");
      const parsedConfig = yaml.load(rawConfig);

      if (typeof parsedConfig === "object" && parsedConfig) {
        return parsedConfig as HelmRepoConfig;
      }
    } catch { }

    return {
      repositories: []
    };
  }

  public async repositories(): Promise<HelmRepo[]> {
    try {
      await this.ensureInitialized();

      const { repositories } = await this.readConfig();

      if (!repositories.length) {
        await HelmRepoManager.addRepo({ name: "bitnami", url: "https://charts.bitnami.com/bitnami" });

        return await this.repositories();
      }

      return repositories.map(repo => ({
        ...repo,
        cacheFilePath: `${this.helmEnv.HELM_REPOSITORY_CACHE}/${repo.name}-index.yaml`
      }));
    } catch (error) {
      logger.error(`[HELM]: repositories listing error "${error}"`);

      return [];
    }
  }

  public static async update() {
    return HelmRepoManager.executeHelm(["repo", "update"]);
  }

  public static async addRepo({ name, url }: HelmRepo): Promise<void> {
    logger.info(`[HELM]: adding repo "${name}" from ${url}`);
    
    await HelmRepoManager.executeHelm(["repo", "add", name, url]);
  }

  public static async addCustomRepo(repoAttributes: HelmRepo): Promise<void> {
    const { 
      name, url, insecureSkipTlsVerify, caFile, certFile, 
      keyFile, password, username,
    } = repoAttributes;

    logger.info(`[HELM]: adding repo "${name}" from ${url}`);
    const args = ["repo", "add", name, url];

    if (insecureSkipTlsVerify) {
      args.push("--insecure-skip-tls-verify");
    }

    if (username) {
      args.push("--username", username);
    }

    if (password) {
      args.push("--password", password);
    }

    if (caFile) {
      args.push("--ca-file", caFile);
    }

    if (keyFile) {
      args.push("--key-file", keyFile);
    }

    if (certFile) {
      args.push("--cert-file", certFile);
    }

    await HelmRepoManager.executeHelm(args);
  }

  public static async removeRepo({ name, url }: HelmRepo): Promise<void> {
    logger.info(`[HELM]: removing repo "${name}" from ${url}`);
    
    await HelmRepoManager.executeHelm(["repo", "remove", name]);
  }
}
