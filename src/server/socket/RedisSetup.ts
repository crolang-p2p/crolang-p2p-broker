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

import { createClient, RedisClientType } from "redis";
import { Server as SocketServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import log from "../utils/Logger";
import Redis from "ioredis";

const READY_EVENT: string = "ready";
const ERROR_EVENT: string = "error";

/**
 * Attaches a Redis adapter function for Socket.IO based on the provided Redis URL.
 *
 * The Redis adapter is used to send messages across multiple Socket.IO instances.
 *
 * @param redisUrl - The URL of the Redis server.
 * @param socketServer - The Socket.IO server instance.
 */
export async function setupRedisAdapter(redisUrl: string, socketServer: SocketServer): Promise<void> {

  const pubClient: RedisClientType = createClient({ url: redisUrl });
  const subClient: RedisClientType = pubClient.duplicate();

  setupEventListeners(pubClient, "Pub", redisUrl);
  setupEventListeners(subClient, "Sub", redisUrl);

  await pubClient.connect();
  await subClient.connect();

  socketServer.adapter(createAdapter(pubClient, subClient));
}

/**
 * Sets up event listeners for a Redis client to handle connection readiness and errors.
 *
 * This function listens for the `ready` event to log when the client successfully connects
 * to the Redis server. It also listens for the `error` event to handle and throw connection errors.
 *
 * @param client - The Redis client instance for which the event listeners are being set up.
 * @param clientName - A name or identifier for the client (e.g., "Pub" or "Sub") used in log messages.
 * @param redisUrl - The URL of the Redis server the client is connecting to, included in log messages for clarity.
 * @throws An error if the `error` event is emitted by the Redis client.
 */
function setupEventListeners(client: RedisClientType, clientName: string, redisUrl: string): void {
  client.on(READY_EVENT, () => log(`Redis ${clientName} client ready and connected to ${redisUrl}`));
  client.on(ERROR_EVENT, (err) => { throw new Error(`Redis ${clientName} client error: ${err}`); });
}

export async function createRedisClient(redisUrl: string): Promise<Redis> {
  const ioRedisClient: Redis = new Redis(redisUrl + "?family=0", { lazyConnect: true });
  await connectIoRedisSafely(ioRedisClient);
  return ioRedisClient;
}

/**
 * Safely connects to a Redis server using the ioredis library.
 *
 * This function listens for the `connect` and `error` events to ensure that the client
 * is properly connected or that any errors during the connection are handled.
 *
 * @param client - An instance of the ioredis client.
 * @returns A promise that resolves when the client connects successfully or rejects if an error occurs.
 * @throws An error if the Redis connection fails.
 */
async function connectIoRedisSafely(client: Redis): Promise<void> {
  return new Promise((resolve, reject) => {
    client.once("connect", () => {
      log("ioredis client connected to Redis");
      resolve();
    });
    client.once("error", (err) => {
      reject("ioredis client error: " + err);
    });
    client.connect();
  });
}
