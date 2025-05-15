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

// Message Identifiers
// These constants represent different types of messages sent by Nodes
export const AUTHENTICATED: string = "AUTHENTICATED";
export const ARE_NODES_CONNECTED_TO_BROKER: string = "ARE_NODES_CONNECTED_TO_BROKER";
export const CONNECTION_ATTEMPT: string = "CONNECTION_ATTEMPT";
export const CONNECTION_ACCEPTANCE: string = "CONNECTION_ACCEPTANCE";
export const CONNECTION_REFUSAL: string = "CONNECTION_REFUSAL";
export const INCOMING_CONNECTIONS_NOT_ALLOWED: string = "INCOMING_CONNECTIONS_NOT_ALLOWED";
export const ICE_CANDIDATES_EXCHANGE_INITIATOR_TO_RESPONDER: string = "ICE_CANDIDATES_EXCHANGE_INITIATOR_TO_RESPONDER";
export const ICE_CANDIDATES_EXCHANGE_RESPONDER_TO_INITIATOR: string = "ICE_CANDIDATES_EXCHANGE_RESPONDER_TO_INITIATOR";
