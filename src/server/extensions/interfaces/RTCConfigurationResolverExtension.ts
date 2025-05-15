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

export interface RTCConfigurationResolverExtension {

  getRTCConfiguration(nodeId: string): Promise<RTCConfiguration>

}

export class DefaultRTCConfigurationResolverExtension implements RTCConfigurationResolverExtension {

  private readonly iceServers: RTCIceServer[] = [
    this.createRTCIceServer(["stun:openrelay.metered.ca:80"]),
    this.createRTCIceServer(["turn:openrelay.metered.ca:80"], "openrelayproject", "openrelayproject"),
    this.createRTCIceServer(["turn:openrelay.metered.ca:443"], "openrelayproject", "openrelayproject"),
    this.createRTCIceServer(["turn:openrelay.metered.ca:443?transport=tcp"], "openrelayproject", "openrelayproject")
  ];

  async getRTCConfiguration(_: string): Promise<RTCConfiguration> {
    return new RTCConfiguration(
      this.iceServers,
      "all",
      "max-bundle",
      "require",
      10
    );
  }

  private createRTCIceServer(urls: string[], username?: string, password?: string): RTCIceServer {
    return new RTCIceServer(urls, username, password);
  }

}

class RTCIceServer {
  urls: string[];
  username?: string;
  password?: string;

  constructor(urls: string[], username?: string, password?: string) {
    this.urls = urls;
    this.username = username;
    this.password = password;
  }
}

export class RTCConfiguration {
  iceServers: RTCIceServer[];
  iceTransportPolicy?: string;
  bundlePolicy?: string;
  rtcpMuxPolicy?: string;
  iceCandidatePoolSize?: number;

  constructor(
    iceServers: RTCIceServer[],
    iceTransportPolicy?: string,
    bundlePolicy?: string,
    rtcpMuxPolicy?: string,
    iceCandidatePoolSize?: number
  ) {
    this.iceServers = iceServers;
    this.iceTransportPolicy = iceTransportPolicy;
    this.bundlePolicy = bundlePolicy;
    this.rtcpMuxPolicy = rtcpMuxPolicy;
    this.iceCandidatePoolSize = iceCandidatePoolSize;
  }

}
