import { toInteger } from "lodash-es";
import { worldstate, airesponse, worldsetting, worldhistory } from "../interfaces";
import { gettime } from "../utils";
import { callAI } from "../aiService";
import { getWorldState, saveWorldState } from "../store";
import { getAIConfig } from "../config";

let ext: seal.ExtInfo;

export function initializeManager(extension: seal.ExtInfo) {
    ext = extension;
}

export async function createWorld(msg: seal.Message, seeds: string[]): Promise<worldsetting> {
    let prompt = seal.ext.getStringConfig(ext, "promptCreate");
    prompt = prompt.replace('{$seeds}', seeds.join('", "'));

    const aiConfig = getAIConfig('Create');
    const response :airesponse = await callAI(
        aiConfig.apiEndpoint,
        aiConfig.apiKey,
        aiConfig.modelName,
        aiConfig.maxTokens,
        aiConfig.temperature,
        aiConfig.TOPP,
        prompt
    );
    console.log('World Creation AI Response:', JSON.stringify(response));
    const worldSetting :worldsetting = JSON.parse(response.choices[0].message.content);

    const newState: worldstate = {
        day: "0",
        last_update_date: "",
        seeds: seeds,
        pending_seed_change: { operation: 'none', seed: '' },
        world_setting: worldSetting,
        history: []
    };
    saveWorldState(msg, newState);
    return worldSetting;
}

export async function processDay(msg: seal.Message, currentState: worldstate): Promise<{nextState: worldstate, newEvent: worldhistory}> {
    const timenow = gettime(msg.time);
    const today = `${timenow.getFullYear()}-${timenow.getMonth() + 1}-${timenow.getDate()}`;
    let worldday = toInteger(currentState.day);

    const { operation, seed } = currentState.pending_seed_change;
    let seedChangeDesc = "不变";
    if (operation === 'add') {
        seedChangeDesc = `添加了种子“${seed}”`;
    } else if (operation === 'remove') {
        seedChangeDesc = `移除了种子“${seed}”`;
    }

    let historyPrompt = seal.ext.getStringConfig(ext, "promptHistory");
    historyPrompt = historyPrompt.replace('{$day}', String(worldday))
                                     .replace('{$day_next}', String(worldday + 1))
                                     .replace('{$world_setting}', JSON.stringify(currentState.world_setting))
                                     .replace('{$seeds}', JSON.stringify(currentState.seeds))
                                     .replace('{$seed_change_desc}', seedChangeDesc);
    const historyAIConfig = getAIConfig('History');
    const neweventresponse :airesponse =  await callAI(
        historyAIConfig.apiEndpoint,
        historyAIConfig.apiKey,
        historyAIConfig.modelName,
        historyAIConfig.maxTokens,
        historyAIConfig.temperature,
        historyAIConfig.TOPP,
        historyPrompt
    );
    console.log('History Generation AI Response:', JSON.stringify(neweventresponse));
    const newEvent: worldhistory = JSON.parse(neweventresponse.choices[0].message.content);

    let updatePrompt = seal.ext.getStringConfig(ext, "promptUpdate");
    updatePrompt = updatePrompt.replace('{$world_setting}', JSON.stringify(currentState.world_setting))
                                 .replace('{$new_event}', JSON.stringify(newEvent));

    const updateAIConfig = getAIConfig('Update');
    const newWorldSettingresponse :airesponse = await callAI(
        updateAIConfig.apiEndpoint,
        updateAIConfig.apiKey,
        updateAIConfig.modelName,
        updateAIConfig.maxTokens,
        updateAIConfig.temperature,
        updateAIConfig.TOPP,
        updatePrompt
    );
    console.log('World Update AI Response:', JSON.stringify(newWorldSettingresponse));
    const newWorldSetting: worldsetting = JSON.parse(newWorldSettingresponse.choices[0].message.content);

    let newSeeds = [...currentState.seeds];
    if (operation === 'add') {
        newSeeds.push(seed);
    } else if (operation === 'remove') {
        newSeeds = newSeeds.filter(s => s !== seed);
    }

    const nextState: worldstate = {
        day: String(worldday + 1),
        last_update_date: today,
        seeds: newSeeds,
        pending_seed_change: {
            operation: "none",
            seed: ""
        },
        world_setting: newWorldSetting,
        history: [...currentState.history, newEvent]
    };
    saveWorldState(msg, nextState);
    return {nextState, newEvent};
}
