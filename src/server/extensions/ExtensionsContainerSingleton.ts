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

import { NodesAuthenticationExtension } from "./interfaces/NodesAuthenticationExtension";
import { NodesCommunicationAuthorizationExtension } from "./interfaces/NodesCommunicationAuthorizationExtension";
import { NodesValidityCheckExtension } from "./interfaces/NodesValidityCheckExtension";
import { RTCConfigurationResolverExtension } from "./interfaces/RTCConfigurationResolverExtension";
import { OnAuthenticatedSocketMsgExtension } from "./interfaces/OnAuthenticatedSocketMsgExtension";

export class ExtensionsContainerSingleton {

  static instance: ExtensionsContainerSingleton;

  readonly authentication: NodesAuthenticationExtension;
  readonly communicationAuthorization: NodesCommunicationAuthorizationExtension;
  readonly validityCheck: NodesValidityCheckExtension;
  readonly rtcConfiguration: RTCConfigurationResolverExtension;
  readonly onAuthenticatedSocketMsg: OnAuthenticatedSocketMsgExtension;

  private constructor(
    authentication: NodesAuthenticationExtension,
    communicationAuthorization: NodesCommunicationAuthorizationExtension,
    validityCheck: NodesValidityCheckExtension,
    rtcConfiguration: RTCConfigurationResolverExtension,
    onAuthenticatedSocketMsg: OnAuthenticatedSocketMsgExtension
  ) {
    this.authentication = authentication;
    this.communicationAuthorization = communicationAuthorization;
    this.validityCheck = validityCheck;
    this.rtcConfiguration = rtcConfiguration;
    this.onAuthenticatedSocketMsg = onAuthenticatedSocketMsg;
  }

  static init(
    authentication: NodesAuthenticationExtension,
    communicationAuthorization: NodesCommunicationAuthorizationExtension,
    validityCheck: NodesValidityCheckExtension,
    rtcConfiguration: RTCConfigurationResolverExtension,
    onAuthenticatedSocketMsg: OnAuthenticatedSocketMsgExtension
  ): void {
    ExtensionsContainerSingleton.instance = new ExtensionsContainerSingleton(
      authentication, communicationAuthorization, validityCheck, rtcConfiguration, onAuthenticatedSocketMsg
    );
  }

}
