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

import { Server as SocketServer, Socket } from "socket.io";

import EnvVar from "../utils/EnvVar";
import { setupRedisAdapter, createRedisClient } from "./RedisSetup";
import log from "../utils/Logger";
import { OnConnectionData } from "./OnConnectionData";
import { AUTHENTICATED } from "../domain/Messages";
import { applyNodeSocketMsgListeners } from "./RedirectMessageListeners";
import { CONNECTION_ERROR_EVENT, CONNECTION_EVENT, DISCONNECT_EVENT, DISCONNECTING_EVENT } from "../domain/SocketEvents";
import { getNodesStatusCheckFunction } from "./nodes_status_check";
import Redis from "ioredis";
import { ExtensionsContainerSingleton } from "../extensions/ExtensionsContainerSingleton";
import { RTCConfiguration } from "../extensions/interfaces/RTCConfigurationResolverExtension";
import { LockManagerSingleton } from "../utils/LockManagerSingleton";

const GENERIC_SOCKET_CONNECTION_ERROR: string = "Socket connection refused: ";
const AUTH_CLIENT_ALREADY_CONNECTED: string = GENERIC_SOCKET_CONNECTION_ERROR + "a client with the provided id is already connected";
const CLIENT_AUTH_WEBHOOK_FAILED: string = GENERIC_SOCKET_CONNECTION_ERROR + "authentication failed";
const RTC_CONFIGURATION_WEBHOOK_FAILED: string = GENERIC_SOCKET_CONNECTION_ERROR + "error retrieving RTC configuration";

type SocketAdditionalData = {
  idNode: string
};

/**
 * Sets up and configures a Socket.IO server instance based on environment variables and provided configurations.
 *
 * It sets the listeners for a socket on the CONNECTION_EVENT event, which is triggered when a new connection is established.
 *
 * It also sets up a periodic check to verify the status of connected nodes, removing the invalid ones and refreshing
 * the lock's TTL
 *
 * Code here sucks, I know, but I'm trying to improve performances avoiding function calls and conditional decisions at runtime
 * as much as possible, trying to find the right compromise between readability and performances.
 *
 * @returns The configured Socket.IO server instance.
 */
export default async function setupSocketServer(envVar: EnvVar): Promise<SocketServer> {

  const logLevel: number = envVar.LOG_LEVEL;
  const redisLockTtlMs: number = envVar.REDIS_LOCK_TTL_MS;

  const socketServer: SocketServer = new SocketServer({
    transports: ["websocket"],
    cors: {
      origin: "*",
      methods: "*",
      credentials: true,
    },
  });

  if(envVar.REDIS_URL === undefined) {
    console.log("Using in-memory lock manager");
    LockManagerSingleton.initInMemory();
  } else {
    console.log("Using Redis lock manager");
    await setupRedisAdapter(envVar.REDIS_URL, socketServer);
    const redisClient: Redis = await createRedisClient(envVar.REDIS_URL);
    LockManagerSingleton.initDistributed(redisClient);
  }

  // middleware to handle new node connections
  socketServer.use(async (socket, next) => {
    try{
      const onConnectionData: OnConnectionData = OnConnectionData.createFromPayload(socket.handshake.query);

      // currently onConnectionData's version and runtime are not used, but maybe they can be used in the future

      const authorized: boolean = await ExtensionsContainerSingleton.instance.authentication.authenticate(
        onConnectionData
      );
      if(!authorized) {
        log(CLIENT_AUTH_WEBHOOK_FAILED);
        return next(new Error("authentication failed"));
      }

      try {
        const acquired: boolean = await LockManagerSingleton.instance.acquireLock(
          redisLockTtlMs, onConnectionData.id, socket.id
        );
        if(!acquired) {
          log(AUTH_CLIENT_ALREADY_CONNECTED);
          return next(new Error("client already connected"));
        }
      } catch(err) {
        log(AUTH_CLIENT_ALREADY_CONNECTED);
        return next(new Error("client already connected"));
      }

      //attach additional data to the socket
      socket.data.additionalData = {
        idNode: onConnectionData.id
      } as SocketAdditionalData;

      registerSingleSocketDisconnectionEvent(CONNECTION_ERROR_EVENT, socket, logLevel);
      registerSingleSocketDisconnectionEvent(DISCONNECTING_EVENT, socket, logLevel);
      registerSingleSocketDisconnectionEvent(DISCONNECT_EVENT, socket, logLevel);

      // registering listeners to log incoming and outgoing messages
      if(logLevel > 1) {
        socket.onAnyOutgoing(async (event, payload) => {
          if(event === AUTHENTICATED) {
            log("Sending " + AUTHENTICATED + " msg to node " + socket.data.additionalData.idNode);
          } else {
            logExchangedMessage(
              "Redirecting",
              event + " message to node " + socket.data.additionalData.idNode + ":",
              payload
            );
          }
        });
        if(logLevel > 2) {
          socket.prependAny(async (event, payload) => {
            logExchangedMessage(
              "Incoming",
              event + " message from node " + socket.data.additionalData.idNode + ":",
              payload
            );
          });
        }
      }

      applyNodeSocketMsgListeners(
        socket,
        onConnectionData.id,
        envVar.P2P_CONNECTION_ENABLED,
        envVar.WEBSOCKET_RELAY_ENABLED
      );

      if(logLevel > 0) {
        log("Event: " + CONNECTION_EVENT + " for node " + socket.data.additionalData.idNode);
      }
      next();
    } catch (e: unknown) {
      log(GENERIC_SOCKET_CONNECTION_ERROR + e);
      return next(new Error("server side exception: " + e.toString()));
    }
  });

  // if middleware is successful, set up the connection event
  socketServer.on(CONNECTION_EVENT, async (socket: Socket) => {
    let rtcConfiguration: RTCConfiguration;
    try {
      rtcConfiguration = await ExtensionsContainerSingleton
        .instance
        .rtcConfiguration
        .getRTCConfiguration(socket.data.additionalData.idNode);
      socket.emit(AUTHENTICATED, JSON.stringify(rtcConfiguration, null, 2));
    } catch (err) {
      disconnectSocketAndLog(socket, RTC_CONFIGURATION_WEBHOOK_FAILED);
      return "rtc configuration webhook failed";
    }
  });

  // periodically check the status of nodes connected to this local instance of the server and remove the invalid ones
  setInterval(
    getNodesStatusCheckFunction(socketServer, redisLockTtlMs),
    envVar.NODES_STATUS_CHECK_INTERVAL_MS
  );

  return socketServer;
}

function registerSingleSocketDisconnectionEvent(event: string, socket: Socket, logLevel: number): void {
  if(logLevel > 0) {
    socket.on(event, async () => {
      if(socket && socket.data && socket.data.additionalData && socket.data.additionalData.idNode) {
        LockManagerSingleton.instance.releaseLock(socket.data.additionalData.idNode).then((released: boolean) => {
          log((released ? "Lock was released on " : "Lock was not released on ") + event + " event for node " + socket.data.additionalData.idNode);
        });
      }
      log("Event: " + event + " for node " + socket.data.additionalData.idNode);
    });
  } else {
    socket.on(event, async () => {
      if(socket && socket.data && socket.data.additionalData && socket.data.additionalData.idNode) {
        LockManagerSingleton.instance.releaseLock(socket.data.additionalData.idNode).then(() => {});
      }
    });
  }
}

function logExchangedMessage(type: string, msg: string, payload: unknown): void {
  log(type + " " +  msg + "\n" + payload + "\n");
}

export function disconnectSocketAndLog(socket: Socket, msg: string): void {
  socket.disconnect(true);
  log(msg);
}
