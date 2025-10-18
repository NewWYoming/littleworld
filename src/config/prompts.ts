export const defaultPromptCreate = `你是一个世界观设计师。请基于以下三个初始种子，生成一个微型科幻世界的初始设定。\n`+
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

export const defaultPromptHistory = `你是一个历史心理学家。已知一个世界在昨天（第{$day}天）的状态和种子的变化，请推导今日（第{$day_next}天）发生的核心事件。\n`+
`昨日世界设定: {$world_setting}\n`+
`昨日世界种子: {$seeds}\n`+
`种子更改状态: {$seed_change_desc}\n`+
`请选择世界设定的一个方面（"core_theme"、"geography"、"inhabitants"、"conflicts"、"tech"）作为改变基础进行推演，并严格按以下JSON格式输出：\n`+
`{\n`+
	`"event_date": "事件发生的日期（即昨日day+1）,第x天",\n`+
	`"event_name": "事件名称（2-5字）",\n`+
	`"core_event": "一句话概括发生的核心标志性事件",\n`+
	`"seeds_influence": "种子的改变对事件产生的影响",\n`+
	`"change_domain": "事件主要影响了世界的哪个属性("core_theme"、"geography"、"inhabitants"、"conflicts"、"tech"),若没有明显变化，则留空"\n`+
`}`;

export const defaultPromptUpdate = `你是一个世界档案管理员。请根据刚刚发生的历史事件，更新世界设定。\n`+
`旧的世界设定: {$world_setting}\n`+
`今日发生的历史事件: {$new_event}\n`+
`请基于事件，仅更新受影响的部分，并以完整的世界设定JSON格式返回。确保语气和格式与初始设定一致，语气采用百科全书，仅陈述事实，越简练简短越好，禁止在设定中记录变化过程，只陈述最终结果，结果较旧设定发生改变的部分必须删除旧设定只保留新设定。\n`+
`例子：原设定geography:完整的一块盘古大陆。事件：大陆分裂。新设定geography:分裂的盘古大陆。\n`+
`禁止采用:新设定geography:完整的一块盘古大陆,而后分裂。`;
