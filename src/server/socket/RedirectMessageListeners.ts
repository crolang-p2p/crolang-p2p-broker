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

import { Socket } from "socket.io";

import {
  ARE_NODES_CONNECTED_TO_BROKER,
  CONNECTION_ACCEPTANCE,
  CONNECTION_ATTEMPT,
  CONNECTION_REFUSAL,
  ICE_CANDIDATES_EXCHANGE_INITIATOR_TO_RESPONDER,
  ICE_CANDIDATES_EXCHANGE_RESPONDER_TO_INITIATOR,
  INCOMING_CONNECTIONS_NOT_ALLOWED,
  SOCKET_MSG_EXCHANGE
} from "../domain/Messages";
import { ExtensionsContainerSingleton } from "../extensions/ExtensionsContainerSingleton";
import {
  NodesCommunicationAuthorizationExtension
} from "../extensions/interfaces/NodesCommunicationAuthorizationExtension";
import { LockManagerSingleton } from "../utils/LockManagerSingleton";

const CALLBACK_OK: string = "OK";
const CALLBACK_ERROR: string = "ERROR";
const CALLBACK_UNAUTHORIZED: string = "UNAUTHORIZED";
const CALLBACK_NOT_CONNECTED: string = "NOT_CONNECTED";

const TO: string = "to";
const IDS: string = "ids";

const STRING_TYPE: string = "string";
const FUNCTION_TYPE: string = "function";

/**
 * Applies Socket.IO message listeners for nodes messages.
 *
 * @param socket - The Socket.IO socket instance to attach listeners to.
 * @param nodeId - The ID of the node associated with the socket.
 */
export function applyNodeSocketMsgListeners(socket: Socket, nodeId: string): void {
  const extension: NodesCommunicationAuthorizationExtension = ExtensionsContainerSingleton
    .instance
    .communicationAuthorization;
  applyAreNodesConnectedToBrokerListener(socket, ARE_NODES_CONNECTED_TO_BROKER);
  applyRedirectToReceiverListener(extension, socket, nodeId, CONNECTION_ATTEMPT);
  applyRedirectToReceiverListener(extension, socket, nodeId, CONNECTION_ACCEPTANCE);
  applyRedirectToReceiverListener(extension, socket, nodeId, CONNECTION_REFUSAL);
  applyRedirectToReceiverListener(extension, socket, nodeId, INCOMING_CONNECTIONS_NOT_ALLOWED);
  applyRedirectToReceiverListener(extension, socket, nodeId, ICE_CANDIDATES_EXCHANGE_INITIATOR_TO_RESPONDER);
  applyRedirectToReceiverListener(extension, socket, nodeId, ICE_CANDIDATES_EXCHANGE_RESPONDER_TO_INITIATOR);
  applyRedirectToReceiverListener(
    extension,
    socket,
    nodeId,
    SOCKET_MSG_EXCHANGE,
    (senderId, receiverId, isReceiverConnected) => {
      ExtensionsContainerSingleton.instance.onAuthenticatedSocketMsg.handle(senderId, receiverId, isReceiverConnected);
    }
  );
}

/**
 * Applies a Socket.IO listener to check if nodes are connected to the Broker.
 * @param socket - The Socket.IO socket instance to attach the listener to.
 * @param message - The message type to listen for.
 */
function applyAreNodesConnectedToBrokerListener(socket: Socket, message: string): void {
  socket.on(
    message,
    async (payload, callback) => {
      if(payload !== undefined && payload !== null) {
        const ids: string[] | undefined = getStringArrayOrUndefined(payload, IDS);
        if(ids !== undefined) {
          const lockManager: LockManagerSingleton = LockManagerSingleton.instance;
          const res: {id: string, connected: boolean}[] = [];
          for(const id of ids) {
            const socketId: string | undefined = await lockManager.getSocketId(id);
            res.push({ id, connected: socketId !== undefined });
          }
          callback({ results: res });
          return;
        }
      }
      callback(CALLBACK_ERROR);
    }
  );
}

/**
 * Applies a Socket.IO listener that redirects messages to a specific recipient.
 *
 * @param extension - The extension to use for message authorization.
 * @param socket - The Socket.IO socket instance to attach the listener to.
 * @param nodeId - The ID of the node associated with the socket.
 * @param message - The message type to listen for.
 */
function applyRedirectToReceiverListener(
  extension: NodesCommunicationAuthorizationExtension,
  socket: Socket,
  nodeId: string,
  message: string,
  onAuthenticatedMsgStrategy?: (senderId: string, receiverId: string, isReceiverConnected: boolean) => void
): void {
  socket.on(
    message,
    async (payload, callback) => {
      try {
        if (payload !== undefined && payload !== null) {
          const to: string = getStringOrThrow(payload, TO);
          const authorized: boolean = await extension.authorize(nodeId, to);
          if (!authorized) {
            return callback(CALLBACK_UNAUTHORIZED);
          }
          const socketId: string | undefined = await LockManagerSingleton.instance.getSocketId(to);
          const isReceiverConnected = socketId !== undefined;
          if (onAuthenticatedMsgStrategy) {
            try {
              await onAuthenticatedMsgStrategy(nodeId, to, isReceiverConnected);
            } catch (err) {
              return callback(CALLBACK_ERROR);
            }
          }
          if (!isReceiverConnected) {
            return callback(CALLBACK_NOT_CONNECTED);
          }
          callback(CALLBACK_OK);
          socket.to(socketId).emit(message, payload);
        } else {
          return callback(CALLBACK_ERROR);
        }
      } catch (e) {
        if (typeof callback === FUNCTION_TYPE) {
          return callback(CALLBACK_ERROR);
        }
      }
    }
  );
}

function getStringOrThrow(payload: string, name: string): string {
  let res: string = JSON.parse(payload)[name];
  if(res === null || res === undefined || typeof res !== STRING_TYPE) {
    throw new Error();
  }
  res = res.trim();
  if(res.length === 0) {
    throw new Error();
  }
  return res;
}

function getStringArrayOrUndefined(payload: string, name: string): string[] | undefined {
  try {
    let res: string[] = JSON.parse(payload)[name];
    if(res === null || res === undefined || !Array.isArray(res)) {
      return undefined;
    }
    res = res.map((s: string) => s.trim());
    if(res.some((s: string) => s.length === 0)) {
      return undefined;
    }
    return res;
  } catch (e) {
    return undefined;
  }
}
