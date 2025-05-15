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

import Redis from "ioredis";
import AsyncLock from "async-lock";

export class LockManagerSingleton {

  static instance: LockManagerSingleton;

  private readonly lockManager: LockManager;

  private constructor(lockManager: LockManager) {
    this.lockManager = lockManager;
  }

  static initInMemory(): void {
    LockManagerSingleton.instance = new LockManagerSingleton(new InMemoryLockManager());
  }

  static initDistributed(redisClient: Redis): void {
    LockManagerSingleton.instance = new LockManagerSingleton(new DistributedLockManager(redisClient));
  }

  public async acquireLock(ttlMs: number, nodeId: string, socketId: string): Promise<boolean> {
    return this.lockManager.acquireLock(ttlMs, nodeId, socketId);
  }

  public async releaseLock(nodeId: string): Promise<boolean> {
    return this.lockManager.releaseLock(nodeId);
  }

  public async extendLock(nodeId: string, ttlMs: number): Promise<boolean> {
    return this.lockManager.extendLock(nodeId, ttlMs);
  }

  public async getSocketId(nodeId: string): Promise<string | undefined> {
    return this.lockManager.getSocketId(nodeId);
  }
}

interface LockManager {

  acquireLock(ttlMs: number, nodeId: string, socketId: string): Promise<boolean>;

  releaseLock(nodeId: string): Promise<boolean>;

  extendLock(nodeId: string, ttlMs: number): Promise<boolean>;

  getSocketId(nodeId: string): Promise<string | undefined>;

}

class DistributedLockManager implements LockManager {

  private readonly redisClient: Redis;

  constructor(redisClient: Redis) {
    this.redisClient = redisClient;
  }

  async acquireLock(ttlMs: number, nodeId: string, socketId: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.redisClient.set(nodeId, socketId, "PX", ttlMs, "NX", (err, result) => {
        if (err) {
          resolve(false);
        } else {
          resolve(result === "OK");
        }
      });
    });
  }

  async extendLock(nodeId: string, ttlMs: number): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.redisClient.pexpire(nodeId, ttlMs, (err, result) => {
        if (err) {
          return resolve(false);
        }
        return resolve(result === 1);
      });
    });
  }

  async releaseLock(nodeId: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.redisClient.del(nodeId, (err, result) => {
        if (err) {
          return resolve(false);
        } else {
          return resolve(result === 1);
        }
      });
    });
  }

  async getSocketId(nodeId: string): Promise<string | undefined> {
    return new Promise<string | undefined>((resolve) => {
      this.redisClient.get(nodeId, (err, result) => {
        if (err) {
          return resolve(undefined);
        }
        resolve(result ?? undefined);
      });
    });
  }

}

class InMemoryLockManager implements LockManager {

  private static readonly LOCK_TIMEOUT_MS: number = 5000;
  private readonly lock: AsyncLock = new AsyncLock();
  private readonly grantedLocks: Map<string, string> = new Map();

  async acquireLock(_ttlMs: number, nodeId: string, socketId: string): Promise<boolean> {
    return this.lock.acquire(
      nodeId,
      async () => {
        if (this.grantedLocks.has(nodeId)) {
          return false;
        } else {
          this.grantedLocks.set(nodeId, socketId);
          return true;
        }
      },
      { timeout: InMemoryLockManager.LOCK_TIMEOUT_MS }
    ).catch(() => false);
  }

  async extendLock(nodeId: string, _ttlMs: number): Promise<boolean> {
    return this.lock.acquire(
      nodeId,
      async () => this.grantedLocks.has(nodeId),
      { timeout: InMemoryLockManager.LOCK_TIMEOUT_MS }
    ).catch(() => false);
  }

  async releaseLock(nodeId: string): Promise<boolean> {
    return this.lock.acquire(
      nodeId,
      async () => {
        if(this.grantedLocks.has(nodeId)) {
          this.grantedLocks.delete(nodeId);
          return true;
        } else {
          return false;
        }
      },
      { timeout: InMemoryLockManager.LOCK_TIMEOUT_MS }
    ).catch(() => false);
  }

  async getSocketId(nodeId: string): Promise<string | undefined> {
    return this.lock.acquire(
      nodeId,
      async () => this.grantedLocks.get(nodeId),
      { timeout: InMemoryLockManager.LOCK_TIMEOUT_MS }
    ).catch(() => undefined);
  }

}
