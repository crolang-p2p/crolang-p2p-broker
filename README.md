# Crolang Broker

## Table of contents
- [The CrolangP2P Project](#the-crolangp2p-project)
  - [Goals](#goals)
  - [How](#how)
  - [Benefits](#benefits)
- [What does the Broker do](#what-does-the-broker-do)
- [Run the Broker](#run-the-broker)
  - [Run from source code](#run-from-source-code)
  - [Docker](#docker)
  - [Expanding Broker capabilities](#expanding-broker-capabilities)
- [Connecting a Crolang Node to the Broker](#connecting-a-crolang-node-to-the-broker)
- [Overcoming network limitations for Node's P2P connections](#overcoming-network-limitations-for-nodes-p2p-connections)
- [Message exchange via WebSocket](#message-exchange-via-websocket)
- [Customizing Broker behaviours: Modules](#customizing-broker-behaviours-modules)
  - [Horizontal scalability](#horizontal-scalability)
  - [Nodes RTC configuration](#nodes-rtc-configuration)
  - [Nodes authentication](#nodes-authentication)
  - [Nodes connection and communication via WebSocket authorization](#nodes-connection-and-communication-via-websocket-authorization)
  - [Nodes validity through lifecycle](#nodes-validity-through-lifecycle)
  - [On authenticated socket message](#on-authenticated-socket-message)
- [Environment variables](#environment-variables)
  - [.env file](#env-file)
  - [Supported Environment Variables](#supported-environment-variables)
  - [Variable Validation](#variable-validation)
- [License](#license)

## The CrolangP2P Project

### Goals
The CrolangP2P Project aims to provide a stable, robust, and exceptionally simple framework for establishing 
cross-language peer-to-peer (P2P) connections between clients facilitating seamless data exchange. 

The clients are known as Crolang Nodes and are implemented in various programming languages, but the logic is
agnostic to the language used, meaning that a client does not care about the language of the other client. Nodes just 
create a P2P connection referencing the ID of the other Node they want to connect to and start exchanging messages.

The project's core focus is on simplicity, offering a framework that minimizes the need for additional 
expertise and streamlines the P2P connection process. With a minimal setup time of just a few minutes, 
developers can concentrate on what truly matters: implementing their desired P2P logic.

Additionally, if a direct P2P connection is not possible or not desired, the Broker also allows nodes to exchange messages via WebSocket, using the Broker as a relay.

### How
To initiate connections, Crolang Nodes rely on a well-known intermediary: the Crolang Broker. This scalable 
architecture, composed of one or more Broker instances, operates transparently to the nodes. Once a P2P 
connection is established between two peers, data is exchanged directly among said peers, bypassing the Broker.

The P2P connection is possible by using the WebRTC technology.

### Benefits
- __Simple__: Minimal setup is required. Developers simply import the Crolang Node dependency into their client, 
specify the ID of the node they wish to connect to, and the connection process is initiated. This streamlined 
approach minimizes complexity and allows for rapid development.
- __Cross-language Transparency__: With multiple implementations of the Crolang Node library available in various 
programming languages, seamless P2P connections can be established between clients regardless of their 
underlying language. This cross-language compatibility fosters a versatile and interconnected ecosystem.
- __Arbitrary Packet Size Transmission__: WebRTC imposes a maximum limit on the size of data packets exchanged. 
CrolangP2P overcomes this limitation by introducing additional mechanisms to handle larger data payloads. 
This allows developers to transmit packets of any size, providing greater flexibility and enabling the transfer 
of substantial data volumes.
- __Customizable via extensions__: The Broker can be easily extended with custom business logic through a modular extension system. This allows you to adapt authentication, authorization, message handling, and more to your specific needs.

## What does the Broker do
The Crolang Broker is a scalable socket server that forms the backbone of the Crolang project. Nodes authenticate 
and connect to the Broker, establishing a communication channel with it.

When a Node intends to connect with another Node, the Broker facilitates the exchange of signaling messages between 
the two Nodes (which are not yet directly connected via P2P). This process enables both Nodes to gather the necessary 
information to establish a P2P connection. Essentially, the Broker acts as an intermediary for the initial handshake, 
allowing Nodes to discover each other and negotiate the parameters for a direct, peer-to-peer connection.

## Run the Broker
There are several strategies for running the Crolang Broker, including executing the source code directly or 
using Docker images.

### Run from source code
The Crolang Broker project is based on Node.js and written in TypeScript. To run the project from source, 
first you need to install the dependencies by running the following command:
```bash
npm install
```
Once the dependencies are installed, you can start the Broker in dev mode by running:
```bash
npm run dev
```
Running the Broker in dev mode provides a convenient way to test the application locally, restarting the 
server each time a file is modified. 

To run the Broker in production mode, first use the following command to build the project:
```bash
npm run build
```
Then, start the Broker by running:
```bash
npm run start
```

Both the dev and production modes will start the Broker on port 8080 by default. If you need to run the Broker 
on a different port, you can provide the PORT environment variable in a .env file or directly in your machine.

See the [Environment variables](#environment-variables) section for more information on available environment variables.

### Docker
You can run the Crolang Broker using Docker in two ways: by building your own Docker image or by using the official project image.

To create your own Docker image, first build the project using the following command:
```bash
docker build -t crolang-broker .
```
This will create a Docker image named `crolang-broker` using the Dockerfile in the project directory.

To run the Docker container, execute:
```bash
docker run -p 8080:8080 crolang-broker
```

If you prefer to use the official Docker image, you can run it by simply executing:
```bash
docker run -p 8080:8080 alessandrotalmi/broker-service
```

Both methods will start the Broker in a Docker container, mapping port 8080 on the host to port 8080 in the container.  
If you need to execute the Broker with a different port, you can change the port mapping accordingly and provide the PORT environment variable:
```bash
docker run -p 8081:8081 -e PORT=8081 crolang-broker
```
or
```bash
docker run -p 8081:8081 -e PORT=8081 alessandrotalmi/broker-service
```

See the [Environment variables](#environment-variables) section for more information on available environment variables.

### Expanding Broker capabilities
Through the use of environment variables, you can customize the Broker's behavior and capabilities, especially when it comes to horizontal scalability, Nodes connectivity and custom business logic.

See the following sections for more information on how to customize the Broker's behavior:
- [Overcoming network limitations for Node's P2P connections](#overcoming-network-limitations-for-nodes-p2p-connections)
- [Customizing Broker behaviours: Modules](#customizing-broker-behaviours-modules)
- [Environment variables](#environment-variables)

## Connecting a Crolang Node to the Broker
TODO

## Overcoming network limitations for Node's P2P connections
Without providing additional setup to the Broker, the connection among Nodes is not guaranteed due to network limitations.

Being based on WebRTC, Crolang Nodes need to exchange ICE candidates in order to establish a connection.
ICE (Interactive Connectivity Establishment) is a framework that allows WebRTC peers to discover possible network paths
they can use to communicate.
Each ICE candidate represents a potential connection method, including direct peer-to-peer connections, connections
through NAT traversal, or relayed connections if necessary.

STUN (Session Traversal Utilities for NAT) servers help WebRTC peers determine their public IP address and the type of
NAT they are behind.
This is crucial because, in many cases, devices are connected to the internet via a private IP (e.g., inside a home or
office network), and they need to know their external IP to establish a direct connection with another peer.
STUN servers facilitate this by responding with the public IP and port from which the request was received, allowing the
client to use this information when exchanging ICE candidates.

While STUN works well when both peers are behind NATs that allow direct connections, some network configurations make
peer-to-peer connections impossible. This can happen in cases where:

- One or both peers are behind symmetric NATs, which assign a different external port for each destination.
- Strict firewall rules block direct UDP traffic between peers.

In such scenarios, TURN (Traversal Using Relays around NAT) servers act as a relay between the two peers.
Instead of establishing a direct connection, both peers send their data to the TURN server, which then forwards it to
the other peer. This ensures connectivity even in the most restrictive network conditions, but it comes at a cost:
TURN increases latency and requires additional bandwidth on the relay server.
Since the TURN server is a relay, it has its cost based on traffic redirection, that's why you will only find free STUN
servers online.

The Broker by default provides a reference to the [Google's free STUN servers](https://dev.to/alakkadshaw/google-stun-server-list-21n4).
If your use case requires that Nodes are able to connect in more restrictive network conditions, you can provide your TURN server; 
see the [Nodes RTC configuration](#nodes-rtc-configuration) section for more info about it.

## Message exchange via WebSocket

In addition to facilitating the negotiation and establishment of peer-to-peer (P2P) connections between nodes using WebRTC, the project also allows for traditional message exchange between peers via WebSocket, using the Broker as a relay.

This feature enables nodes to send messages to each other even without establishing a P2P connection. The broker receives the message from the sender and delivers it to the recipient, making it easy to implement classic client-server communication logic or to provide a fallback in case a direct connection cannot be established.

## Customizing Broker behaviours: Modules
The Broker server offers modular customization, enabling users to extend or modify its functionality without altering the core codebase. 
This allows for seamless integration of various business logic and use cases while preserving system integrity.

Modules are independent components loaded at runtime, each providing specific functionality. They allow for dynamic addition, removal, 
or replacement of behaviour, such as custom authentication, logging, and event handling, without modifying the core server.

Benefits: 
- Decoupled Logic: Keeps business logic separate from the core, reducing maintenance.
- Extensibility: New features can be added without changing the server code.
- Configurability: Modules can be enabled/disabled based on requirements.
- Isolation: Customizations don’t affect the core system’s stability.
Example Implementation

An example repository showing module integration is available at this repository: [broker_complete_example](https://github.com/crolang/broker_complete_example)

As far as infrastructure is concerned, when the Broker is executed without any additional module, it can be seen as shown in the following image:
![Standalone architecture](./doc/broker_standalone_example.png)

While, on the other hand, the Broker uses all the modules, it can be seen as something similar to what is shown in the following image:
![Complete architecture](./doc/broker_complete_example.png)

### Horizontal scalability
Environment variable: `REDIS_URL`

The Broker service ensures that only one Node with a specific ID is connected to the Broker at any given time. Furthermore, the Broker(s) 
are responsible for propagating messages between connected Nodes during the connection negotiation process.

Running a single instance of the Broker is straightforward, as it can locally track the IDs of connected nodes and use Socket.IO events 
to propagate messages between senders and receivers.

However, scaling the Broker horizontally introduces challenges. For example, consider two Broker instances, A and B, and two Nodes, 
X and Y. If Node X connects to Broker A and Node Y connects to Broker B (due to load balancing or proxy routing), communication 
becomes problematic. Broker A is unaware of Node Y, and Broker B is unaware of Node X. Consequently, if Node X attempts to connect 
to Node Y, Broker A cannot propagate the signaling message to Broker B, and vice versa. Additionally, if another Node attempts to 
authenticate using Node X's ID and is routed to Broker B, Broker B cannot determine that Node X is already connected to Broker A. 
Ensuring unique Node IDs is crucial for maintaining accurate communication and preventing conflicts.

To address these challenges, the REDIS_URL environment variable can be used to specify the URL of a Redis service. By leveraging 
Redis, Broker instances can share information about connected Node IDs and reliably propagate messages across all Broker instances. 
This ensures consistent state and seamless communication, regardless of which Broker instance a Node connects to.

If the REDIS_URL environment variable is not provided, the Broker will operate in standalone mode, assuming no other Broker replicas 
are present. In this mode, it will use an in-memory approach to manage Node connections and message propagation.

### Nodes RTC configuration

Environment variable: `RTC_CONFIGURATION_RESOLVER_WEBHOOK_URL`

See the [Overcoming network limitations for Node's P2P connections](#overcoming-network-limitations-for-nodes-p2p-connections) section 
for more information on why you might need to provide your own TURN server.

If the `RTC_CONFIGURATION_RESOLVER_WEBHOOK_URL` environment variable is not provided, the Broker will use the default RTC configuration 
resolver, which provides a reference to [Google's free STUN servers](https://dev.to/alakkadshaw/google-stun-server-list-21n4).

However, if you provide a custom endpoint, this endpoint will be called every time a Crolang Node successfully connects to the Broker, 
providing that Node with the RTC configuration to connect to the STUN/TURN server.

#### Request
**Method:** `POST`

**Body:** JSON object with the following structure:

```json
{
  "nodeId": "string"
}
```
| Field     | Type     | Description                                | Required |
| :-------- | :------- | :----------------------------------------- | :------- |
| `nodeId`  | `string` | The unique ID of the connecting Crolang Node. | Yes      |

#### Response 
JSON object with the following structure:

```json
{
  "iceServers": [
    {
      "urls": [],
      "username": "string",
      "password": "string"
    }
  ],
  "iceTransportPolicy": "string",
  "bundlePolicy": "string",
  "rtcpMuxPolicy": "string",
  "iceCandidatePoolSize": "number"
}
```

| Field                   | Type     | Description                                                                          | Required |
| :---------------------- | :------- | :----------------------------------------------------------------------------------- | :------- |
| `iceServers`           | `array`  | A list of STUN/TURN servers to be used for peer-to-peer connections.                 | Yes      |
| `iceServers[].urls`    | `array`  | A list of URLs for the STUN/TURN server.                                            | Yes      |
| `iceServers[].username` | `string` | The username for authentication (if required by the server).                        | No       |
| `iceServers[].password` | `string` | The password for authentication (if required by the server).                        | No       |
| `iceTransportPolicy`   | `string` | Defines which ICE candidates are used (e.g., "all" or "relay").                     | No       |
| `bundlePolicy`         | `string` | Specifies the SDP bundle policy (e.g., "balanced", "max-compat", "max-bundle").     | No       |
| `rtcpMuxPolicy`        | `string` | Determines the RTCP multiplexing policy (e.g., "require").                          | No       |
| `iceCandidatePoolSize` | `number` | Controls the size of the ICE candidate pool for connections.                        | No       |

#### Notes

- The only required field is the `iceServers` array, which must contain at least one object with the `urls` field populated.
- The `username` and `password` fields are required **only** if your STUN/TURN server requires authentication.
- If you need a TURN server but do not want to host it yourself, you can use external paid services and still resolve the RTC configuration 
- through your custom endpoint.

### Nodes authentication
Environment variable: __NODES_AUTHENTICATION_WEBHOOK_URL__

The Broker service ensures that only one Node with a specific ID is connected to the Broker at any given time by default
and this behaviour cannot be changed and will always be enforced, independently of the status of the
NODES_AUTHENTICATION_WEBHOOK_URL environment variable; this expansion is useful when you need to add custom
authentication logic on top of the unique ID check.

By default, the Broker will allow any Node to connect to it; if the endpoint is provided, it will be called every
time a Node tries to connect to the Broker.

#### Request
**Method:** `POST`

**Body:** JSON object with the following structure:

```json
{
  "nodeId": "string",
  "data": "object"
}
```
| Field     | Type     | Description                                | Required |
| :-------- | :------- | :----------------------------------------- | :------- |
| `nodeId`  | `string` | The unique ID of the connecting Crolang Node. | Yes      |
| `data`    | `object` | Additional data to be used for authentication. | No       |

#### Response
JSON object with the following structure:

```json
{
  "authenticated": "boolean"
}
```
| Field           | Type      | Description                                  | Required |
| :-------------- | :-------- | :------------------------------------------- | :------- |
| `authenticated` | `boolean` | Indicates whether the Node is authenticated. | Yes      |

The data field is optional and can be used to pass additional information when connecting from the Node to the Broker.  
Let's say, for example, that you want to authenticate a Node based on a token. While connecting from the Node, you can pass such token in the data field providing an object like this:
```json
{
  "token": "string"
}
```
This structure will be redirected to the authentication endpoint, which will use it to enforce the custom authentication logic.

### Nodes connection and communication via WebSocket authorization

Environment variable: `AUTHORIZE_NODES_COMMUNICATION_WEBHOOK_URL`

By default, when two Nodes connected to a Broker attempt to establish a P2P connection, they exchange messages through the Broker to 
negotiate the connection. The Broker allows this message exchange for all connected Nodes.

However, if the `AUTHORIZE_NODES_COMMUNICATION_WEBHOOK_URL` environment variable is provided, the Broker will call the specified 
endpoint whenever two Nodes attempt to exchange messages, determining whether the P2P connection between them is permitted.

**This authorization mechanism is also used to determine if two Nodes are allowed to exchange messages via WebSocket through the Broker (i.e., using the Broker as a relay instead of a direct P2P connection).**

#### Request
**Method:** `POST`

**Body:** JSON object with the following structure:

```json
{
  "from": "string",
  "to": "string"
}
```
| Field   | Type     | Description                                    | Required |
| :------ | :------- | :--------------------------------------------- | :------- |
| `from`  | `string` | The unique ID of the Node initiating the request. | Yes      |
| `to`    | `string` | The unique ID of the Node receiving the request. | Yes      |

#### Response
JSON object with the following structure:
```json
{
  "authorized": "boolean"
}
```
| Field        | Type      | Description                                  | Required |
| :----------- | :-------- | :------------------------------------------- | :------- |
| `authorized` | `boolean` | Indicates whether the connection is allowed. | Yes      |

This structure ensures that any communication between two Nodes is subject to explicit authorization before proceeding.

### Nodes validity through lifecycle

Environment variable: `NODES_VALIDITY_CHECK_WEBHOOK_URL`

By default, the Broker considers all connected Nodes as valid. However, in certain cases, business logic may require a Node
to be disconnected—for example, if a Node is banned.

If the `NODES_VALIDITY_CHECK_WEBHOOK_URL` environment variable is provided, the Broker will periodically call the specified
endpoint to verify the validity of the currently connected Nodes.

#### Request
**Method:** `POST`

**Body:** JSON object with the following structure:

```json
{
  "connectedNodesIds": []
}
```
| Field               | Type     | Description                                         | Required |
| :------------------ | :------- | :-------------------------------------------------- | :------- |
| `connectedNodesIds` | `array`  | A list of IDs of the Nodes currently connected.    | Yes      |

#### Response
JSON object with the following structure:
```json
{
  "invalidNodesIds": []
}
```
| Field             | Type     | Description                                           | Required |
| :---------------- | :------- | :---------------------------------------------------- | :------- |
| `invalidNodesIds` | `array`  | A list of IDs of the Nodes that need to be disconnected. | Yes      |

This mechanism ensures that only valid Nodes remain connected to the Broker, allowing for automatic enforcement of business 
rules regarding Node connections.

### On authenticated socket message

Environment variable: `ON_AUTHENTICATED_SOCKET_MSG_WEBHOOK_URL`

This extension allows you to execute custom logic every time an authenticated message is exchanged between two nodes through the broker (for example, when using the WebSocket relay as an alternative to P2P). The extension is triggered every time a node attempts to send a message to another node via WebSocket, after the optional "Nodes connection authorization" extension has been evaluated and authorization has been granted.

If the `ON_AUTHENTICATED_SOCKET_MSG_WEBHOOK_URL` environment variable is set, the broker will call the specified webhook endpoint with the following payload each time a message is relayed:

```json
{
  "senderId": "string",
  "receiverId": "string",
  "isReceiverConnected": true
}
```
| Field                | Type      | Description                                             | Required |
|----------------------|-----------|---------------------------------------------------------|----------|
| `senderId`           | `string`  | The unique ID of the node sending the message           | Yes      |
| `receiverId`         | `string`  | The unique ID of the node receiving the message         | Yes      |
| `isReceiverConnected`| `boolean` | Whether the receiver node is currently connected        | Yes      |

The webhook is called asynchronously and its response is ignored. If the environment variable is not set, the extension does nothing by default.

This mechanism allows you to implement auditing, logging, or custom business logic for every authenticated message exchanged via the broker.
## Environment variables
Variable management is centralized in the `EnvVar` class, which ensures validation and provides default values when necessary.

### .env file

To configure the application, you can create a `.env` file in the project's root directory and define the required variables.

Example `.env` file:

```env
PORT=8080
LOG_LEVEL=2
REDIS_URL=redis://localhost:6379
NODES_STATUS_CHECK_INTERVAL_MS=30000
REDIS_LOCK_TTL_MS=60000
NODES_AUTHENTICATION_WEBHOOK_URL=https://example.com/auth
AUTHORIZE_NODES_COMMUNICATION_WEBHOOK_URL=https://example.com/authorize
NODES_VALIDITY_CHECK_WEBHOOK_URL=https://example.com/validity
RTC_CONFIGURATION_RESOLVER_WEBHOOK_URL=https://example.com/rtc
ON_AUTHENTICATED_SOCKET_MSG_WEBHOOK_URL=https://example.com/socket-auth
```

### Supported Environment Variables
See [Customizing Broker behaviours: Modules](#customizing-broker-behaviours-modules) for more information on how to customize the Broker's behavior through environment variables.

| Variable Name                                  | Description                                                               | Default |
|-----------------------------------------------|---------------------------------------------------------------------------|---------|
| `PORT`                                        | Port on which the server listens                                         | `8080`  |
| `LOG_LEVEL`                                   | Logging level (0 = minimal, 3 = maximum)                                 | `0`     |
| `REDIS_URL`                                   | Redis server URL for locking and message propagation                     | `undefined` |
| `NODES_STATUS_CHECK_INTERVAL_MS`              | Interval (ms) for checking node status                                   | `30000` |
| `REDIS_LOCK_TTL_MS`                           | TTL (ms) for node locks in Redis                                         | `60000` |
| `NODES_AUTHENTICATION_WEBHOOK_URL`            | Webhook for authenticating a connecting node                             | `undefined` |
| `AUTHORIZE_NODES_COMMUNICATION_WEBHOOK_URL`   | Webhook for authorizing communication between nodes                      | `undefined` |
| `NODES_VALIDITY_CHECK_WEBHOOK_URL`            | Webhook for periodically verifying the validity of connected nodes       | `undefined` |
| `RTC_CONFIGURATION_RESOLVER_WEBHOOK_URL`      | Webhook for retrieving RTC configuration for connected nodes             | `undefined` |
| `ON_AUTHENTICATED_SOCKET_MSG_WEBHOOK_URL`     | Webhook for processing authenticated socket messages                     | `undefined` |


### Variable Validation
During startup, the application validates environment variables:

URLs are checked to ensure they are valid.
- Numeric values must fall within the expected range.
- If a variable is not defined, the default value is used.
- If a variable is misconfigured, the application will throw an error and terminate to prevent unexpected behavior.

## License
This project is licensed under the Apache-2.0 License - see the [LICENSE](./LICENSE.md) file for details.
