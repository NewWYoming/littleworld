import { worldstate, Timer } from "../interfaces";
import { gettime } from "../utils";

let ext: seal.ExtInfo;

export function initializeStore(extension: seal.ExtInfo) {
    ext = extension;
}

function getStateKey(msg: seal.Message, isold?: boolean): string {
  if (isold || !msg.groupId) {
    return `little_world_data_${msg.sender.userId}`;
  } else {
    return `little_world_data_${msg.groupId}_${msg.sender.userId}`;
  }
}

function getTimerKey(msg: seal.Message, command: string, isold?: boolean): string {
  if (isold || !msg.groupId) {
    return `little_world_timer_${msg.sender.userId}_${command}`;
  } else {
    return `little_world_timer_${msg.groupId}_${msg.sender.userId}_${command}`;
  }
}

export function getTimer(msg: seal.Message, command: string, isold?: boolean): Timer | null {
  let key:string;
  if (isold) {
    key = getTimerKey(msg, command, true);
  } else {
    key = getTimerKey(msg, command);
  }
  const data = ext.storageGet(key);
  return data ? JSON.parse(data) : null;
}

export function saveTimer(msg: seal.Message, command: string, times: string, isold?: boolean) {
  let key:string;
  if (isold) {
    key = getTimerKey(msg, command, true);
  } else {
    key = getTimerKey(msg, command);
  }
    const date = gettime(msg.time);
    const timer: Timer = {
        Date: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
        Times: times
    };
    // 设计清除数据功能
    if (times === null) {
        ext.storageSet(key, null);
        return;
    }
    ext.storageSet(key, JSON.stringify(timer));
}

export function getWorldState(msg: seal.Message, isold?: boolean): worldstate | null {
  let key:string;
  if (isold) {
    key = getStateKey(msg, true);
  } else {
    key = getStateKey(msg);
  }
    const data = ext.storageGet(key);
    return data ? JSON.parse(data) : null;
}

export function saveWorldState(msg: seal.Message, state: worldstate | null, isold?: boolean) {
  let key:string;
  if (isold) {
    key = getStateKey(msg, true);
  } else {
    key = getStateKey(msg);
  }
    ext.storageSet(key, JSON.stringify(state));
}
