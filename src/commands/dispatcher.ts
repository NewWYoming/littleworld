import { handleCreate, handleToday, handleSeed, handleStatus, handleHistory, handleReset } from "./handler";

export function dispatcher(ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs) {
    const subCommand = cmdArgs.getArgN(1);

    (async () => {
        try {
            switch (subCommand) {
                case 'create':
                    await handleCreate(ctx, msg, cmdArgs);
                    break;
                case 'today':
                    await handleToday(ctx, msg);
                    break;
                case 'seed':
                    await handleSeed(ctx, msg, cmdArgs);
                    break;
                case 'status':
                    await handleStatus(ctx, msg);
                    break;
                case 'history':
                    await handleHistory(ctx, msg, cmdArgs);
                    break;
                case 'reset':
                    await handleReset(ctx, msg);
                    break;
                case 'help':{
                    const ret = seal.ext.newCmdExecuteResult(true);
                    ret.showHelp = true;
                    seal.replyToSender(ctx, msg, `微型世界模拟器指令:
	.world create <种子1> <种子2> <种子3>  - 创建世界
	.world today - 每日推进一天
	.world seed <add/remove <种子>> - 每日提交种子变更
	.world status - 查看世界设定
	.world history [页码] - 查看历史书页
	.world reset - 删除世界
	.w 为.world的缩写。`);
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
}
