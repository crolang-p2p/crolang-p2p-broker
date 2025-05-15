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
 * limitations under the License.s
 */

import { Server as SocketServer } from "socket.io";

import EnvVar from "./server/utils/EnvVar";
import setupSocketServer from "./server/socket/SocketServerSetup";
import { getStartupAsciiArt } from "./server/utils/ascii_art_creator";
import { setupExtensionsContainer } from "./server/utils/extensions_container_setup";

const envVar: EnvVar = new EnvVar();

setupExtensionsContainer(envVar);

setupSocketServer(envVar).then(async (server: SocketServer) => {
  server.listen(envVar.PORT);
  console.log(`\nCrolang Broker Socket server listening on port ${envVar.PORT}`);
  console.log(getStartupAsciiArt());
}).catch((err) => {
  console.error("\nFailed to setup socket server: " + err.toString());
  process.exit(1);
});
