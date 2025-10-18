import { worldstate } from "../interfaces";

let ext: seal.ExtInfo;

export function initializeStore(extension: seal.ExtInfo) {
    ext = extension;
}

function getStateKey(msg: seal.Message): string {
    return `little_world_data_${msg.sender.userId}`;
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
