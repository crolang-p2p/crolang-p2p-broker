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

import dotenv from "dotenv";

/**
 * Class to safely access environment variables and their default values.
 * If something is wrong with the environment variables, exceptions will be thrown on new instance creation
 */
export default class EnvVar {

  /**
   * The port number on which the socket server will listen for incoming requests.
   */
  readonly PORT: number;

  /**
   * The log level of the server. The higher the number, the more verbose the logs. Possible values are 0, 1, 2, and 3.
   */
  readonly LOG_LEVEL: number;

  /**
   * The URL of the Redis server used for distributed locking and propagating messages among the server instances using the Redis adapter.
   */
  readonly REDIS_URL: string | undefined;

  /**
   * The interval in milliseconds at which the server will check the status of all connected nodes.
   * The status check includes removing invalid connected nodes and updating the time-to-live (TTL) of the Redis lock
   * used for distributed locking.
   */
  readonly NODES_STATUS_CHECK_INTERVAL_MS: number;

  /**
   * The URL of the webhook used for authenticating a new connecting node.
   */
  readonly NODES_AUTHENTICATION_WEBHOOK_URL: string | undefined;

  /**
   * The URL of the webhook used for authorizing communication between connected nodes
   */
  readonly AUTHORIZE_NODES_COMMUNICATION_WEBHOOK_URL: string | undefined;

  /**
   * The URL of the webhook used for periodically checking the connected nodes' validity.
   */
  readonly NODES_VALIDITY_CHECK_WEBHOOK_URL: string | undefined;

  /**
   * The URL of the webhook used for resolving the RTC configurations for the connected nodes.
   */
  readonly RTC_CONFIGURATION_RESOLVER_WEBHOOK_URL: string | undefined;

  /**
   * The time-to-live (TTL) in milliseconds for the Redis locks used for distributed locking
   * (if in-memory locking is used this variable will not be used).
   * Having a lock ensures that only one node with a certain id is connected at a time among all server instances.
   * The lock has a time-to-live (TTL) to ensure that the lock is released if the node disconnects unexpectedly or the server crashes.
   * The TTL is updated periodically to ensure that the lock is not released while the node is still connected.
   * The interval at which the TTL is updated is equal to NODES_STATUS_CHECK_INTERVAL_MS;
   * considering that the nodes status check is not instantaneous, the TTL should be adequately greater than NODES_STATUS_CHECK_INTERVAL_MS.
   */
  readonly REDIS_LOCK_TTL_MS: number;

  constructor() {
    dotenv.config();
    this.PORT = getOptionalEnvIntGtZero("PORT", 8080);
    this.REDIS_URL = getOptionalEnvString("REDIS_URL", undefined);
    this.LOG_LEVEL = getOptionalIntRange("LOG_LEVEL", 0, 3, 0);
    this.NODES_STATUS_CHECK_INTERVAL_MS = getOptionalEnvIntGtZero("NODES_STATUS_CHECK_INTERVAL_MS", 30000);
    this.REDIS_LOCK_TTL_MS = getOptionalEnvIntGtZero("REDIS_LOCK_TTL_MS", 60000);
    this.NODES_AUTHENTICATION_WEBHOOK_URL = getOptionalEnvString("NODES_AUTHENTICATION_WEBHOOK_URL", undefined);
    this.AUTHORIZE_NODES_COMMUNICATION_WEBHOOK_URL = getOptionalEnvString("AUTHORIZE_NODES_COMMUNICATION_WEBHOOK_URL", undefined);
    this.NODES_VALIDITY_CHECK_WEBHOOK_URL = getOptionalEnvString("NODES_VALIDITY_CHECK_WEBHOOK_URL", undefined);
    this.RTC_CONFIGURATION_RESOLVER_WEBHOOK_URL = getOptionalEnvString("RTC_CONFIGURATION_RESOLVER_WEBHOOK_URL", undefined);

    validateUrl(this.REDIS_URL);
    validateUrl(this.NODES_AUTHENTICATION_WEBHOOK_URL);
    validateUrl(this.AUTHORIZE_NODES_COMMUNICATION_WEBHOOK_URL);
    validateUrl(this.NODES_VALIDITY_CHECK_WEBHOOK_URL);
    validateUrl(this.RTC_CONFIGURATION_RESOLVER_WEBHOOK_URL);
  }

}

/**
 * Validates a URL if it is provided.
 * Throws an error if the URL is invalid.
 *
 * @param url - The URL string to validate.
 * @returns The valid URL string or undefined if not provided.
 * @throws Error if the URL is invalid.
 */
function validateUrl(url: string | undefined): void {
  if(url !== undefined) {
    try {
      new URL(url);
    } catch {
      throw new Error(`Invalid URL provided: ${url}`);
    }
  }
}

/**
 * Retrieves an optional environment variable as a string.
 * Returns a default value if the environment variable is not set.
 *
 * @param name - The name of the environment variable.
 * @param defaultValue - The default value to return if the environment variable is not set.
 * @returns The value of the environment variable as a trimmed string, or the default value.
 */
export function getOptionalEnvString(name: string, defaultValue: string): string {
  const v: string | undefined = process.env[name];
  if (v !== undefined && v !== null) {
    return v.trim();
  } else {
    return defaultValue;
  }
}

/**
 * Retrieves an optional environment variable as an integer within a specific range.
 * Returns a default value if the environment variable is not set.
 * Throws an error if the environment variable is not a valid integer or not within the range.
 *
 * @param name - The name of the environment variable.
 * @param min - The minimum allowable value (inclusive).
 * @param max - The maximum allowable value (inclusive).
 * @param defaultValue - The default value to return if the environment variable is not set.
 * @returns The value of the environment variable as an integer, or the default value.
 * @throws Error if the environment variable is not a valid integer or not within the specified range.
 */
export function getOptionalIntRange(name: string, min: number, max: number, defaultValue: number): number {
  const v: string | undefined = process.env[name];
  if (v === undefined || v === null) {
    return defaultValue;
  }
  if (!isNaN(parseInt(v))) {
    const r: number = parseInt(v);
    if (r >= min && r <= max) {
      return r;
    }
  }
  throw Error(
    "Environment variable " + name + " must be an integer between " + min + " and " + max + ", if provided"
  );
}

/**
 * Retrieves an optional environment variable as an integer greater than zero.
 * Returns a default value if the environment variable is not set.
 * Throws an error if the environment variable is not a valid integer or is not greater than zero.
 *
 * @param name - The name of the environment variable.
 * @param defaultValue - The default value to return if the environment variable is not set.
 * @returns The value of the environment variable as an integer greater than zero, or the default value.
 * @throws Error if the environment variable is not a valid integer or not greater than zero.
 */
export function getOptionalEnvIntGtZero(name: string, defaultValue: number): number {
  const v: string | undefined = process.env[name];
  if (v !== undefined && v !== null) {
    const parsedValue = parseInt(v.trim());
    if (!isNaN(parsedValue) && parsedValue > 0) {
      return parsedValue;
    }
    throw Error("Environment variable " + name + " must be an integer greater than zero, if provided");
  }
  if (defaultValue > 0) {
    return defaultValue;
  }
  throw Error("Default value must be greater than zero");
}
