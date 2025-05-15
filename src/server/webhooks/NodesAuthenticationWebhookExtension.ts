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

import axios from "axios";
import { OnConnectionData } from "../socket/OnConnectionData";
import log from "../utils/Logger";
import { NodesAuthenticationExtension } from "../extensions/interfaces/NodesAuthenticationExtension";
import { WebhookExtensions } from "./WebhookExtensions";

type NodesAuthenticationResult = {
  authenticated: boolean
};

export class NodesAuthenticationWebhookExtension extends WebhookExtensions implements NodesAuthenticationExtension {

  constructor(url: string) {
    super(url);
  }

  async authenticate(data: OnConnectionData): Promise<boolean> {
    try {
      return (await axios.post<NodesAuthenticationResult>(this.url, { id: data.id, data: data.data }))
        .data
        .authenticated;
    } catch (error) {
      log("Error calling authentication webhook " + this.url + ": " + error);
      return false;
    }
  }

}
