import { toInteger } from "lodash-es";
import { worldstate, worldhistory, Timer } from "../interfaces";
import { gettime } from "../utils";
import { getTimer, getWorldState, saveTimer, saveWorldState } from "../store";
import { createWorld, processDay } from "../core/worldManager";

export async function handleCreate(ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs) {
    const seeds = [cmdArgs.getArgN(2), cmdArgs.getArgN(3), cmdArgs.getArgN(4)];
    const createtimer: Timer | null = getTimer(msg, 'create');
    const timenow = gettime(msg.time);
    const today = `${timenow.getFullYear()}-${timenow.getMonth() + 1}-${timenow.getDate()}`;
    if (createtimer && createtimer.Date === today && toInteger(createtimer.Times) >= 3) {
        seal.replyToSender(ctx, msg, '今日创建小世界次数过多，请明天再试。');
        return;
    }

    if (seeds.some(s => !s)) {
        seal.replyToSender(ctx, msg, '创建世界需要提供三个种子词。');
        return console.error('创建世界需要提供三个种子词。');
    } else if (seeds.some(s => s.length > 20)) {
        seal.replyToSender(ctx, msg, '种子词长度过长，无法创建世界。');
        return console.error('种子词长度过长，无法创建世界。');
    }

    seal.replyToSender(ctx, msg, '正在基于种子生成世界，请稍候...');
    const worldSetting = await createWorld(msg, seeds);
    seal.replyToSender(ctx, msg, `世界【${worldSetting.world_name}】已成功创建！\n使用 .world status 查看详情。`);
    saveTimer(msg, 'create', (createtimer ? (toInteger(createtimer.Times) + 1).toString() : '1'));
    saveTimer(msg, 'reset', '0');
}

export async function handleToday(ctx: seal.MsgContext, msg: seal.Message) {
    const currentState = getWorldState(msg);
    if (!currentState) {
        seal.replyToSender(ctx, msg, '当前没有世界。请使用 .world create 创建一个。');
        return;
    }

    const timenow = gettime(msg.time);
    const today = `${timenow.getFullYear()}-${timenow.getMonth() + 1}-${timenow.getDate()}`;
    if (currentState.last_update_date === today) {
        seal.replyToSender(ctx, msg, '今日小世界已演化，请明天再来。');
        return;
    }

    const seedChange = currentState.pending_seed_change;
    let seedChangeDesc = "昨日无种子变更";
    if (seedChange.operation === 'add') {
        currentState.seeds.push(seedChange.seed);
        seedChangeDesc = `正在根据昨日添加的种子“${seedChange.seed}”`;
    } else if (seedChange.operation === 'remove') {
        currentState.seeds = currentState.seeds.filter(s => s !== seedChange.seed);
        seedChangeDesc = `正在根据昨日移除的种子“${seedChange.seed}”`;
    }

    let worldday = toInteger(currentState.day);
    seal.replyToSender(ctx, msg, `第 ${worldday} 天结束，世界${seedChangeDesc}，演化至第 ${worldday + 1} 天...`);

    const {nextState, newEvent} = await processDay(msg, currentState);
    seal.replyToSender(ctx, msg, `【第 ${nextState.day} 天】\n世界的历史变动：\n${newEvent.event_name}\n${newEvent.core_event}`);
    saveTimer(msg, 'reset', '0');
}

export async function handleSeed(ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs) {
    const currentState = getWorldState(msg);
    const lastChange = currentState?.pending_seed_change;
    if (!currentState) {
        seal.replyToSender(ctx, msg, '当前没有世界。');
        return;
    }

    const seedOp = cmdArgs.getArgN(2);
    const seedWord = cmdArgs.getArgN(3);

    if ((seedOp !== 'add' && seedOp !== 'remove') || !seedWord) {
        seal.replyToSender(ctx, msg, '指令格式错误。请使用 .world seed <add/remove> <种子词>');
        return;
    }

    const maxSeeds = seal.ext.getIntConfig(ext, "maxSeedCount");
    if (seedOp === 'add' && currentState.seeds.length >= maxSeeds) {
            seal.replyToSender(ctx, msg, `种子数量已达上限（${maxSeeds}个），无法添加。`);
            return;
    } else if (seedWord.length > 20) {
        seal.replyToSender(ctx, msg, '种子词长度过长，无法提交变更。');
        return;
    } else if (seedOp === 'add' && currentState.seeds.includes(seedWord)) {
      seal.replyToSender(ctx, msg, '该种子词已存在于当前世界中，无法添加。');
      return;
    } else if (seedOp === 'remove' && !currentState.seeds.includes(seedWord)) {
      seal.replyToSender(ctx, msg, '该种子词不存在于当前世界中，无法移除。');
      return;
    }

    currentState.pending_seed_change = {
        operation: seedOp,
        seed: seedWord
    };
    saveWorldState(msg, currentState);

    if (lastChange.operation !== 'none') {
      seal.replyToSender(ctx, msg, `每日仅能进行一次种子变更，已覆盖变更：【${seedOp === 'add' ? '添加' : '移除'}】“${seedWord}”。此变更将在明天的世界演化中生效。`);
    } else {
      seal.replyToSender(ctx, msg, `种子变更已提交：【${seedOp === 'add' ? '添加' : '移除'}】“${seedWord}”。此变更将在明天的世界演化中生效。`);
    }
    saveTimer(msg, 'reset', '0');
}

export async function handleStatus(ctx: seal.MsgContext, msg: seal.Message) {
    const state = getWorldState(msg);
    if (!state) {
        seal.replyToSender(ctx, msg, '当前没有世界。');
        return;
    }
    const setting = state.world_setting;
    const inhabitants = setting.inhabitants.map(i => `${i.name} (${i.description})`).join('; ');
    const replyText = `
世界名称: ${setting.world_name} (第 ${state.day} 天)
核心主题: ${setting.core_theme}
地理: ${setting.geography}
居民: ${inhabitants}
矛盾: ${setting.conflicts}
科技: ${setting.tech}
当前种子: [${state.seeds.join(', ')}]
变更队列: ${state.pending_seed_change.operation === "none" ? '无' : `${state.pending_seed_change.operation === 'add' ? '添加' : '移除'} “${state.pending_seed_change.seed}”`}
`.trim();
    seal.replyToSender(ctx, msg, replyText);
    saveTimer(msg, 'reset', '0');
}

export async function handleHistory(ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs) {
    const page = parseInt(cmdArgs.getArgN(2), 10) || 1;
    const pageSize = seal.ext.getIntConfig(ext, "historyPageSize");
    const state = getWorldState(msg);
    if (!state || state.history.length === 0) {
            seal.replyToSender(ctx, msg, '这个世界还没有历史。');
            return;
    }

    const totalPages = Math.ceil(state.history.length / pageSize);
    if (page > totalPages || page < 1) {
            seal.replyToSender(ctx, msg, `页码超出范围，总计 ${totalPages} 页。`);
            return;
    }

    const startIndex = state.history.length - (page * pageSize);
    const endIndex = startIndex + pageSize;
    const paginatedHistory = state.history.slice(Math.max(0, startIndex), endIndex).reverse();

    const historyText = paginatedHistory.map((h: worldhistory) => `${h.event_date} - ${h.event_name}: ${h.core_event}`).join('\n');
    seal.replyToSender(ctx, msg, `历史记录 (第 ${page}/${totalPages} 页):\n${historyText}`);
    saveTimer(msg, 'reset', '0');
}

export async function handleReset(ctx: seal.MsgContext, msg: seal.Message) {
    const resettimer: Timer | null = getTimer(msg, 'reset');
    const timenow = gettime(msg.time);
    const today = `${timenow.getFullYear()}-${timenow.getMonth() + 1}-${timenow.getDate()}`;
    if (resettimer && resettimer.Date === today && toInteger(resettimer.Times) >= 1) {
      saveWorldState(msg, null);
      seal.replyToSender(ctx, msg, '二次确认成功，当前世界已被重置。');
      saveTimer(msg, 'reset', '0');
    } else {
      seal.replyToSender(ctx, msg, '二次确认：请确认是否删除当前世界的所有数据。\n如果确认，请使用 .world reset 再次执行。');
      saveTimer(msg, 'reset', '1');
    }
}

let ext: seal.ExtInfo;

export function initializeHandlers(extension: seal.ExtInfo) {
    ext = extension;
}
