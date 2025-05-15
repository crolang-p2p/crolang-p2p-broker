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

import { disconnectSocketAndLog } from "./SocketServerSetup";
import { ExtensionsContainerSingleton } from "../extensions/ExtensionsContainerSingleton";
import { LockManagerSingleton } from "../utils/LockManagerSingleton";

/**
 * Retrieves all sockets connected to the `socketServer`, mapped by their `idNode` from `socket.data.additionalData`.
 *
 * This function iterates through all connected sockets and filters those that have a valid additionalData` property.
 *
 * @param socketServer - The Socket.IO server instance to retrieve the sockets from.
 * @returns A `Map` where the keys are the `idNode` values (as strings) and the values are the corresponding Socket instances.
 */
function getAllSocketsByIdNodes(socketServer: SocketServer): Map<string, Socket> {
  const dataMap = new Map<string, Socket>();
  for (const [_id, socket] of socketServer.sockets.sockets) {
    if(socket.data !== undefined && socket.data !== null) {
      if(socket.data.additionalData !== undefined && socket.data.additionalData !== null) {
        dataMap.set(socket.data.additionalData.idNode, socket);
      }
    }
  }
  return dataMap;
}

/**
 * Creates a function to periodically check the status of connected nodes.
 *
 * The returned function performs the following tasks:
 * 1. Retrieves all connected sockets and their associated `idNode`.
 * 2. Identifies invalid nodes by calling the webhook (if present).
 * 3. Disconnects invalid nodes.
 * 4. Extends the lock TTL for valid nodes, or disconnects them if the lock cannot be extended.
 *
 * @param socketServer - The Socket.IO server instance to manage the connected sockets.
 * @param lockTtlMs - The duration (in milliseconds) to extend the TTL for valid locks.
 * @returns A function that performs the status check when invoked.
 */
export function getNodesStatusCheckFunction(
  socketServer: SocketServer, lockTtlMs: number
): () => Promise<void> {
  return async () => {
    const allSocketsByIdNodes: Map<string, Socket> = getAllSocketsByIdNodes(socketServer);
    if(allSocketsByIdNodes.size === 0) {
      return;
    }

    const invalidNodesIds: string[] = await ExtensionsContainerSingleton.instance.validityCheck.getInvalidNodes(
      Array.from(allSocketsByIdNodes.keys())
    );
    for(const invalidNodeId of invalidNodesIds) {
      const socket: Socket | undefined = allSocketsByIdNodes.get(invalidNodeId);
      if(socket !== undefined) {
        allSocketsByIdNodes.delete(invalidNodeId);
        if(!socket.disconnected) {
          disconnectSocketAndLog(socket, "Disconnecting the invalid node with id " + invalidNodeId);
        }
      }
    }

    const lockManager: LockManagerSingleton = LockManagerSingleton.instance;
    for (const [idNode, socket] of allSocketsByIdNodes) {
      if(socket.data === undefined || socket.data === null) {
        disconnectSocketAndLog(socket, "Disconnecting node without proper additional data with id " + idNode);
      } else if(socket.data.additionalData === undefined || socket.data.additionalData === null) {
        disconnectSocketAndLog(socket, "Disconnecting node without proper additional data with id " + idNode);
      } else {
        lockManager.extendLock(idNode, lockTtlMs).then((extended: boolean) => {
          if(!extended) {
            disconnectSocketAndLog(socket, "Failed to extend TTL for lock for node " + idNode);
          }
        });

      }
    }
  };
}
