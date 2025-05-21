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

import { OnAuthenticatedSocketMsgExtension } from "../extensions/interfaces/OnAuthenticatedSocketMsgExtension";
import axios from "axios";

export class OnAuthenticatedSocketMsgWebhookExtension implements OnAuthenticatedSocketMsgExtension {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async handle(senderId: string, receiverId: string, isReceiverConnected: boolean): Promise<void> {
    await axios.post(this.webhookUrl, {
      senderId,
      receiverId,
      isReceiverConnected
    });
  }
}
