import { AIConfig } from "../interfaces";
import { defaultPromptCreate, defaultPromptHistory, defaultPromptUpdate } from "./prompts";

let ext: seal.ExtInfo;

export function initializeConfig(extension: seal.ExtInfo) {
    ext = extension;
}

export function getAIConfig(taskType: 'Create' | 'History' | 'Update'): AIConfig {
    const apiendpointconfigname = `apiEndpoint${taskType}`;
    const apikeyconfigname = `apiKey${taskType}`;
    const modelnameconfigname = `modelName${taskType}`;
    const modeltokensconfigname = `maxtokens${taskType}`;
    const modeltemperatureconfigname = `modeltemperature${taskType}`;
    const modelTOPPconfigname = `modelTOP-P${taskType}`;

    const apiEndpoint = seal.ext.getStringConfig(ext, apiendpointconfigname);
    const apiKey = seal.ext.getStringConfig(ext, apikeyconfigname);
    const modelName = seal.ext.getStringConfig(ext, modelnameconfigname);
    const maxTokens = seal.ext.getIntConfig(ext, modeltokensconfigname);
    const temperature = seal.ext.getFloatConfig(ext, modeltemperatureconfigname);
    const TOPP = seal.ext.getFloatConfig(ext, modelTOPPconfigname);

    if (!apiEndpoint || !apiKey || !modelName) {
        throw new Error(`AI服务(任务: ${taskType})的配置不完整。请骰主在WebUI中设置。`);
    }

    return { apiEndpoint, apiKey, modelName, maxTokens, temperature, TOPP };
}

export function registerConfigs() {
    seal.ext.registerStringConfig(ext, "---------------------------- 基础设置 ----------------------------", "本配置项无实际意义");
    seal.ext.registerIntConfig(ext, "maxSeedCount", 5, "世界能拥有的最大种子数量");
    seal.ext.registerIntConfig(ext, "historyPageSize", 3, "历史记录每页显示条数");

    seal.ext.registerStringConfig(ext, "---------------------------- 创建世界设置 ----------------------------", "本配置项无实际意义");
    seal.ext.registerStringConfig(ext, "apiEndpointCreate", "", "创建世界所用AI的 API 地址。");
    seal.ext.registerStringConfig(ext, "apiKeyCreate", "", "创建世界所用AI的 API Key。");
    seal.ext.registerStringConfig(ext, "modelNameCreate", "", "创建世界所用AI的模型名称。");
    seal.ext.registerIntConfig(ext, "maxtokensCreate", 300, "创建世界所用AI的输出Token上限。");
    seal.ext.registerFloatConfig(ext, "modeltemperatureCreate", 0.7, "创建世界所用AI的温度参数。");
    seal.ext.registerFloatConfig(ext, "modelTOP-PCreate", 1, "创建世界所用AI的Top-P参数。");
    seal.ext.registerStringConfig(ext, "promptCreate", defaultPromptCreate, "创建世界用的 Prompt 模板");

    seal.ext.registerStringConfig(ext, "---------------------------- 生成历史设置 ----------------------------", "本配置项无实际意义");
    seal.ext.registerStringConfig(ext, "apiEndpointHistory", "", "生成历史所用AI的 API 地址。");
    seal.ext.registerStringConfig(ext, "apiKeyHistory", "", "生成历史所用AI的 API Key。");
    seal.ext.registerStringConfig(ext, "modelNameHistory", "", "生成历史所用AI的模型名称。");
    seal.ext.registerIntConfig(ext, "maxtokensHistory", 200, "生成历史所用AI的输出Token上限。");
    seal.ext.registerFloatConfig(ext, "modeltemperatureHistory", 0.7, "生成历史所用AI的温度参数。");
    seal.ext.registerFloatConfig(ext, "modelTOP-PHistory", 1, "生成历史所用AI的Top-P参数。");
    seal.ext.registerStringConfig(ext, "promptHistory", defaultPromptHistory, "生成历史事件的 Prompt 模板");

    seal.ext.registerStringConfig(ext, "---------------------------- 更新世界设置 ----------------------------", "本配置项无实际意义");
    seal.ext.registerStringConfig(ext, "apiEndpointUpdate", "", "更新世界所用AI的 API 地址。");
    seal.ext.registerStringConfig(ext, "apiKeyUpdate", "", "更新世界所用AI的 API Key。");
    seal.ext.registerStringConfig(ext, "modelNameUpdate", "", "更新世界所用AI的模型名称。");
    seal.ext.registerIntConfig(ext, "maxtokensUpdate", 300, "更新世界所用AI的输出Token上限。");
    seal.ext.registerFloatConfig(ext, "modeltemperatureUpdate", 0.7, "更新世界所用AI的温度参数。");
    seal.ext.registerFloatConfig(ext, "modelTOP-PUpdate", 1, "更新世界所用AI的Top-P参数。");
    seal.ext.registerStringConfig(ext, "promptUpdate", defaultPromptUpdate, "更新世界设定的 Prompt 模板");
}
