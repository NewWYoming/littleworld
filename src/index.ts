import { initializeStore } from "./store";
import { initializeConfig, registerConfigs } from "./config";
import { dispatcher } from "./commands/dispatcher";
import { initializeHandlers } from "./commands/handler";
import { initializeManager } from "./core/worldManager";

function main() {
	// 1. 扩展初始化
	let ext = seal.ext.find('little-world');
	if (!ext) {
		ext = seal.ext.new('little-world', 'NewWYoming', '0.2.3-restruct');
		seal.ext.register(ext);
	}

	// 2. 初始化所有模块
	initializeStore(ext);
	initializeConfig(ext);
	initializeHandlers(ext);
	initializeManager(ext);

	// 3. 注册配置项
	registerConfigs();

	// 4. 注册指令
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
		return dispatcher(ctx, msg, cmdArgs);
	};
	ext.cmdMap['world'] = cmdWorld;
	ext.cmdMap['w'] = cmdWorld; // Alias
}

main();
