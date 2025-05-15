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
import log from "../utils/Logger";
import { WebhookExtensions } from "./WebhookExtensions";
import {
  NodesCommunicationAuthorizationExtension
} from "../extensions/interfaces/NodesCommunicationAuthorizationExtension";

type NodesCommunicationAuthorizationResult = {
  authorized: boolean
};

export class NodesCommunicationAuthorizationWebhookExtension
  extends WebhookExtensions
  implements NodesCommunicationAuthorizationExtension
{

  constructor(url: string) {
    super(url);
  }

  async authorize(from: string, to: string): Promise<boolean> {
    try {
      return (await axios.post<NodesCommunicationAuthorizationResult>(this.url, { from, to })).data.authorized;
    } catch (error) {
      log("Error calling authorize nodes communication webhook " + this.url + ": " + error);
      return false;
    }
  }

}
