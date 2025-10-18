import { toInteger } from "lodash-es";

interface airesponse {
	 choices:
	 [{
		message:
		{
			content: string,
			role: string
		},
		finish_reason: string,
		index: number,
		logprobs: any
	}],
		object:string,
		usage:{
			prompt_tokens:number|string,
			completion_tokens:number|string,
			total_tokens:number|string
		},
		created:number|string,
		system_fingerprint:any,
		model:string,
		id:string
}
interface worldhistory {
	event_date: string;
	event_name: string;
	core_event: string;
	seeds_influence: string;
	change_domain: "core_theme" | "geography" | "inhabitants" | "conflicts" | "tech" | null;
}

interface inhabitants {
	name: string;
	description: string;
}

interface worldsetting {
	world_name: string;
	core_theme: string;
	geography: string;
	inhabitants: inhabitants[];
	conflicts: string;
	tech: string;
}

interface worldstate {
	day: string;
	last_update_date: string;
	seeds: string[],
	pending_seed_change: {
		operation: 'none' | 'add' | 'remove',
		seed: string
	},
	world_setting: worldsetting,
	history: worldhistory[];
}

function gettime(timestamps: number) {//将时间戳转换为北京时间
	let time = timestamps
	let beijingtime = new Date((time+28800)*1000);
	return beijingtime
}

function main() {
	// 1. 扩展初始化
	let ext = seal.ext.find('little-world');
	if (!ext) {
		ext = seal.ext.new('little-world', 'NewWYoming', '0.2.3');
		seal.ext.register(ext);
	}

	// --- 2. AI 交互模块 ---
	/**
	 * 调用AI服务生成内容
	 * @param {'create' | 'history' | 'update'} taskType - 任务类型
	 * @param {string} prompt - 发送给AI的提示
	 * @returns {Promise<any>} - AI返回的JSON对象
	 */
	async function callAI(taskType: 'Create' | 'History' | 'Update', prompt: string): Promise<any> {
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

		let content = "";
		try {
			const response = await fetch(apiEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					model: modelName,
					max_tokens: maxTokens,
					temperature: temperature,
					top_p: TOPP,
					messages: [{ role: "user", content: prompt }],
					response_format: { type: "json_object" }
				})
			});

			if (!response.ok) {
				throw new Error(`AI API request failed with status ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			console.error('AI call failed:', error);
			throw new Error('AI服务调用失败，请检查后台日志。');
		}
	}

	// --- 3. 状态管理器 ---
	function getStateKey(msg: seal.Message): string {// 每个用户一个世界
		return `little_world_data_${msg.sender.userId}`;
	}

	function getWorldState(msg: seal.Message): worldstate | null {
		const key = getStateKey(msg);
		const data = ext.storageGet(key);
		return data ? JSON.parse(data) : null;
	}

	function saveWorldState(msg: seal.Message, state: worldstate | null) {
		const key = getStateKey(msg);
		ext.storageSet(key, JSON.stringify(state));
	}

	// --- 4. 业务逻辑与指令处理 ---
	const cmdWorld = seal.ext.newCmdItemInfo();
	cmdWorld.name = 'world';
	cmdWorld.help = `微型世界模拟器指令:
.world create <种子1> <种子2> <种子3>  - 创建世界
.world today - 每日推进一天
.world seed <add/remove <种子>> - 每日提交种子变更
.world status - 查看世界设定
.world history [页码] - 查看历史书页
.world reset - 删除世界
.w 为.world的缩写。`;
	cmdWorld.solve = (ctx, msg, cmdArgs) => {
		const subCommand = cmdArgs.getArgN(1);

		(async () => {
			try {
				switch (subCommand) {
					case 'create': {
						const seeds = [cmdArgs.getArgN(2), cmdArgs.getArgN(3), cmdArgs.getArgN(4)];
						if (seeds.some(s => !s)) {
							seal.replyToSender(ctx, msg, '创建世界需要提供三个种子词。');
							return console.error('创建世界需要提供三个种子词。');
						} else if (seeds.some(s => s.length > 20)) {
							seal.replyToSender(ctx, msg, '种子词长度过长，无法创建世界。');
							return console.error('种子词长度过长，无法创建世界。');
						}

						let prompt = seal.ext.getStringConfig(ext, "promptCreate");
						prompt = prompt.replace('{$seeds}', seeds.join('", "'));
						seal.replyToSender(ctx, msg, '正在基于种子生成世界，请稍候...');
						const response :airesponse = await callAI('Create', prompt);
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
						seal.replyToSender(ctx, msg, `世界【${worldSetting.world_name}】已成功创建！\n使用 .world status 查看详情。`);
						break;
					}

					case 'today': {
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

						let worldday = toInteger(currentState.day);

						seal.replyToSender(ctx, msg, `第 ${worldday} 天结束，世界正在根据昨日的种子变更，演化至第 ${worldday + 1} 天...`);

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
						const neweventresponse :airesponse =  await callAI('History', historyPrompt);
						console.log('History Generation AI Response:', JSON.stringify(neweventresponse));
						const newEvent: worldhistory = JSON.parse(neweventresponse.choices[0].message.content);

						let updatePrompt = seal.ext.getStringConfig(ext, "promptUpdate");
						updatePrompt = updatePrompt.replace('{$world_setting}', JSON.stringify(currentState.world_setting))
																			 .replace('{$new_event}', JSON.stringify(newEvent));

						const newWorldSettingresponse :airesponse = await callAI('Update', updatePrompt);
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

						seal.replyToSender(ctx, msg, `【第 ${nextState.day} 天】\n世界的历史变动：\n${newEvent.event_name}\n${newEvent.core_event}`);
						break;
					}

					case 'seed': {
						const currentState = getWorldState(msg);
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
						} else if (seedWord.length > 5) {
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

						seal.replyToSender(ctx, msg, `种子变更已提交/覆盖：【${seedOp === 'add' ? '添加' : '移除'}】“${seedWord}”。此变更将在明天的世界演化中生效。`);
						break;
					}

					case 'status': {
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
`.trim();
						seal.replyToSender(ctx, msg, replyText);
						break;
					}

					case 'history': {
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

							const historyText = paginatedHistory.map((h: worldhistory) => `第${h.event_date}天 - ${h.event_name}: ${h.core_event}`).join('\n');
							seal.replyToSender(ctx, msg, `历史记录 (第 ${page}/${totalPages} 页):\n${historyText}`);
							break;
					}

					case 'reset': {
						saveWorldState(msg, null);
						seal.replyToSender(ctx, msg, '当前世界已被重置。');
						break;
					}

					case 'help':{
						const ret = seal.ext.newCmdExecuteResult(true);
						ret.showHelp = true;
						seal.replyToSender(ctx, msg, cmdWorld.help);
						return ret;
					}
					default: {
						seal.replyToSender(ctx, msg, `微型世界模拟器插件，请使用create/today/seed/status/history/reset参数。输入 .world help 查看帮助。`);
						return seal.ext.newCmdExecuteResult(false);
					}
				}
			} catch (e: any) {
				seal.replyToSender(ctx, msg, `发生错误: ${e.message}`);
			}
		})();

		return seal.ext.newCmdExecuteResult(true);
	};
	ext.cmdMap['world'] = cmdWorld;
	ext.cmdMap['w'] = cmdWorld; // Alias

	// --- 5. 注册配置项 ---
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
	const defaultPromptCreate = `你是一个世界观设计师。请基于以下三个初始种子，生成一个微型科幻世界的初始设定。\n`+
`语气采用百科全书，仅陈述事实，设计越简单越好。\n`+
`三个初始种子为：["{$seeds}"]\n`+
`请严格遵循以下JSON格式输出：\n`+
`{\n`+
	`"world_name": "世界名称（2-5字，命名而非概况含义）",\n`+
	`"core_theme": "一句话概括世界核心主题",\n`+
	`"geography": "简要地理描述（1-2句）",\n`+
	`"inhabitants": [{ "name": "主要居民种族的名字（1-3类）", "description": "生物学和社会学wiki介绍" }],\n`+
	`"conflicts": "潜在矛盾或张力（1点）",\n`+
	`"tech": "科技体系简述",\n`+
`}`;
	seal.ext.registerStringConfig(ext, "promptCreate", defaultPromptCreate, "创建世界用的 Prompt 模板");

	seal.ext.registerStringConfig(ext, "---------------------------- 生成历史设置 ----------------------------", "本配置项无实际意义");
	seal.ext.registerStringConfig(ext, "apiEndpointHistory", "", "生成历史所用AI的 API 地址。");
	seal.ext.registerStringConfig(ext, "apiKeyHistory", "", "生成历史所用AI的 API Key。");
	seal.ext.registerStringConfig(ext, "modelNameHistory", "", "生成历史所用AI的模型名称。");
	seal.ext.registerIntConfig(ext, "maxtokensHistory", 200, "生成历史所用AI的输出Token上限。");
	seal.ext.registerFloatConfig(ext, "modeltemperatureHistory", 0.7, "生成历史所用AI的温度参数。");
	seal.ext.registerFloatConfig(ext, "modelTOP-PHistory", 1, "生成历史所用AI的Top-P参数。");
	const defaultPromptHistory = `你是一个历史心理学家。已知一个世界在昨天（第{$day}天）的状态和种子的变化，请推导今日（第{$day_next}天）发生的核心事件。\n`+
`昨日世界设定: {$world_setting}\n`+
`昨日世界种子: {$seeds}\n`+
`种子更改状态: {$seed_change_desc}\n`+
`请选择世界设定的一个方面（"core_theme"、"geography"、"inhabitants"、"conflicts"、"tech"）作为改变基础进行推演，并严格按以下JSON格式输出：\n`+
`{\n`+
	`"event_date": "事件发生的日期（即昨日day+1）",\n`+
	`"event_name": "事件名称（2-5字）",\n`+
	`"core_event": "一句话概括发生的核心标志性事件",\n`+
	`"seeds_influence": "种子的改变对事件产生的影响",\n`+
	`"change_domain": "事件主要影响了世界的哪个属性("core_theme"、"geography"、"inhabitants"、"conflicts"、"tech"),若没有明显变化，则留空"\n`+
`}`;
	seal.ext.registerStringConfig(ext, "promptHistory", defaultPromptHistory, "生成历史事件的 Prompt 模板");

	seal.ext.registerStringConfig(ext, "---------------------------- 更新世界设置 ----------------------------", "本配置项无实际意义");
	seal.ext.registerStringConfig(ext, "apiEndpointUpdate", "", "更新世界所用AI的 API 地址。");
	seal.ext.registerStringConfig(ext, "apiKeyUpdate", "", "更新世界所用AI的 API Key。");
	seal.ext.registerStringConfig(ext, "modelNameUpdate", "", "更新世界所用AI的模型名称。");
	seal.ext.registerIntConfig(ext, "maxtokensUpdate", 300, "更新世界所用AI的输出Token上限。");
	seal.ext.registerFloatConfig(ext, "modeltemperatureUpdate", 0.7, "更新世界所用AI的温度参数。");
	seal.ext.registerFloatConfig(ext, "modelTOP-PUpdate", 1, "更新世界所用AI的Top-P参数。");
	const defaultPromptUpdate = `你是一个世界档案管理员。请根据刚刚发生的历史事件，更新世界设定。\n`+
`旧的世界设定: {$world_setting}\n`+
`今日发生的历史事件: {$new_event}\n`+
`请基于事件，仅更新受影响的部分，并以完整的世界设定JSON格式返回。确保语气和格式与初始设定一致，语气采用百科全书，仅陈述事实，越简练简短越好，禁止在设定中记录变化过程，只陈述最终结果，结果较旧设定发生改变的部分必须删除旧设定只保留新设定。\n`+
`例子：原设定geography:完整的一块盘古大陆。事件：大陆分裂。新设定geography:分裂的盘古大陆。\n`+
`禁止采用:新设定geography:完整的一块盘古大陆,而后分裂。`;
	seal.ext.registerStringConfig(ext, "promptUpdate", defaultPromptUpdate, "更新世界设定的 Prompt 模板");
}

main();
