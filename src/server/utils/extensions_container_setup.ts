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

import EnvVar from "./EnvVar";
import {
  NodesAuthenticationExtension,
  NodesDefaultAuthenticationExtension
} from "../extensions/interfaces/NodesAuthenticationExtension";
import { NodesAuthenticationWebhookExtension } from "../webhooks/NodesAuthenticationWebhookExtension";
import {
  DefaultNodesCommunicationAuthorizationExtension,
  NodesCommunicationAuthorizationExtension
} from "../extensions/interfaces/NodesCommunicationAuthorizationExtension";
import {
  NodesCommunicationAuthorizationWebhookExtension
} from "../webhooks/NodesCommunicationAuthorizationWebhookExtension";
import {
  DefaultNodesValidityCheckExtension,
  NodesValidityCheckExtension
} from "../extensions/interfaces/NodesValidityCheckExtension";
import { NodesValidityCheckWebhookExtension } from "../webhooks/NodesValidityCheckWebhookExtension";
import {
  DefaultRTCConfigurationResolverExtension,
  RTCConfigurationResolverExtension
} from "../extensions/interfaces/RTCConfigurationResolverExtension";
import { RTCConfigurationResolverWebhookExtension } from "../webhooks/RTCConfigurationResolverWebhookExtension";
import { ExtensionsContainerSingleton } from "../extensions/ExtensionsContainerSingleton";

export function setupExtensionsContainer(envVar: EnvVar): void {

  let authentication: NodesAuthenticationExtension = new NodesDefaultAuthenticationExtension();
  if(envVar.NODES_AUTHENTICATION_WEBHOOK_URL === undefined) {
    console.log("Using default authentication extension");
  } else {
    console.log("Using webhook authentication extension");
    authentication = new NodesAuthenticationWebhookExtension(envVar.NODES_AUTHENTICATION_WEBHOOK_URL);
  }

  let commAuth: NodesCommunicationAuthorizationExtension = new DefaultNodesCommunicationAuthorizationExtension();
  if(envVar.AUTHORIZE_NODES_COMMUNICATION_WEBHOOK_URL === undefined) {
    console.log("Using default communication authorization extension");
  } else {
    console.log("Using webhook communication authorization extension");
    commAuth = new NodesCommunicationAuthorizationWebhookExtension(
      envVar.AUTHORIZE_NODES_COMMUNICATION_WEBHOOK_URL
    );
  }

  let validityCheck: NodesValidityCheckExtension = new DefaultNodesValidityCheckExtension();
  if(envVar.NODES_VALIDITY_CHECK_WEBHOOK_URL === undefined) {
    console.log("Using default nodes validity check extension");
  } else {
    console.log("Using webhook nodes validity check extension");
    validityCheck = new NodesValidityCheckWebhookExtension(envVar.NODES_VALIDITY_CHECK_WEBHOOK_URL);
  }

  let rtcConfiguration: RTCConfigurationResolverExtension = new DefaultRTCConfigurationResolverExtension();
  if(envVar.RTC_CONFIGURATION_RESOLVER_WEBHOOK_URL === undefined) {
    console.log("Using default RTC configuration resolver extension");
  } else {
    console.log("Using webhook RTC configuration resolver extension");
    rtcConfiguration = new RTCConfigurationResolverWebhookExtension(envVar.RTC_CONFIGURATION_RESOLVER_WEBHOOK_URL);
  }

  ExtensionsContainerSingleton.init(authentication, commAuth, validityCheck, rtcConfiguration);

}
