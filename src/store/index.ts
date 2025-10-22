import { worldstate, Timer } from "../interfaces";
import { gettime } from "../utils";

let ext: seal.ExtInfo;

export function initializeStore(extension: seal.ExtInfo) {
    ext = extension;
}

function getStateKey(msg: seal.Message): string {
    return `little_world_data_${msg.sender.userId}`;
}

function getTimerKey(msg: seal.Message, command: string): string {
    return `little_world_timer_${msg.sender.userId}_${command}`;
}

export function getTimer(msg: seal.Message, command: string): string | null {
    const key = getTimerKey(msg, command);
    const data = ext.storageGet(key);
    return data ? JSON.parse(data) : null;
}

export function saveTimer(msg: seal.Message, command: string, times: string) {
    const key = getTimerKey(msg, command);
    const date = gettime(msg.time);
    const timer: Timer = {
        Date: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
        Times: times
    };
    ext.storageSet(key, JSON.stringify(timer));
}

export function getWorldState(msg: seal.Message): worldstate | null {
    const key = getStateKey(msg);
    const data = ext.storageGet(key);
    return data ? JSON.parse(data) : null;
}

export function saveWorldState(msg: seal.Message, state: worldstate | null) {
    const key = getStateKey(msg);
    ext.storageSet(key, JSON.stringify(state));
}
