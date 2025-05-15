/*
 * Copyright 2025 Alessandro Talmi
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ParsedUrlQuery } from "querystring";

const ID_VALUE_NAME: string = "id";
const VERSION_VALUE_NAME: string = "version";
const RUNTIME_VALUE_NAME: string = "runtime";
const DATA_VALUE_NAME: string = "data";

const MISSING_PAYLOAD_ERROR: Error = new Error("node's payload is missing");
const EXTRACTION_ERROR_PRELUDE: string = "Missing required OnConnectionData value: ";
const ID_VALUE_NAME_EXTRACTION_ERROR: Error = new Error(EXTRACTION_ERROR_PRELUDE + ID_VALUE_NAME);
const VERSION_VALUE_NAME_EXTRACTION_ERROR: Error = new Error(EXTRACTION_ERROR_PRELUDE + VERSION_VALUE_NAME);
const RUNTIME_VALUE_NAME_EXTRACTION_ERROR: Error = new Error(EXTRACTION_ERROR_PRELUDE + RUNTIME_VALUE_NAME);

/**
 * Represents data received on socket connection, provided by Nodes.
 */
export class OnConnectionData {
  /**
   * The unique identifier of the node.
   */
  readonly id: string;

  /**
   * The version of the node.
   */
  readonly version: string;

  /**
   * The runtime of the node (JVM, NODE_JS, etc...)
   */
  readonly runtime: string;

  /**
   * Optional data field that can contain any value.
   */
  readonly data: unknown | undefined;

  private constructor(id: string, version: string, runtime: string, data?: unknown) {
    this.id = id;
    this.version = version;
    this.runtime = runtime;
    this.data = data;
  }

  /**
   * Creates an OnConnectionData instance from the provided payload data.
   * @param payload - The parsed URL query object containing the node id and additional values.
   * @returns A new instance of OnConnectionData built from the payload.
   * @throws Error if the payload is null, undefined, or if required values are missing or invalid.
   */
  public static createFromPayload(payload: ParsedUrlQuery): OnConnectionData {
    if (payload === null || payload === undefined) {
      throw MISSING_PAYLOAD_ERROR;
    }

    const id: string = getRequiredStringOrFail(payload, ID_VALUE_NAME, ID_VALUE_NAME_EXTRACTION_ERROR);
    const version: string = getRequiredStringOrFail(payload, VERSION_VALUE_NAME, VERSION_VALUE_NAME_EXTRACTION_ERROR);
    const runtime: string = getRequiredStringOrFail(payload, RUNTIME_VALUE_NAME, RUNTIME_VALUE_NAME_EXTRACTION_ERROR);
    const data = payload[DATA_VALUE_NAME] ?? undefined;

    return new OnConnectionData(id, version, runtime, data);
  }
}

/**
 * Helper function to extract a required string value from the structure.
 */
function getRequiredStringOrFail(structure: ParsedUrlQuery, valueName: string, error: Error): string {
  const v: string | string[] = structure[valueName];
  if (v === null || v === undefined || typeof v !== "string") {
    throw error;
  }
  return v;
}
