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
                    await handleToday(ctx, msg, cmdArgs);
                    break;
                case 'seed':
                    await handleSeed(ctx, msg, cmdArgs);
                    break;
                case 'status':
                    await handleStatus(ctx, msg, cmdArgs);
                    break;
                case 'history':
                    await handleHistory(ctx, msg, cmdArgs);
                    break;
                case 'reset':
                    await handleReset(ctx, msg, cmdArgs);
                    break;
                case 'help':{
                    const ret = seal.ext.newCmdExecuteResult(true);
                    ret.showHelp = true;
                    // Note: You might need a better way to access help string
                    // For now, let's keep it simple. A full implementation would involve passing ext or registering the command in a central place.
                    seal.replyToSender(ctx, msg, "Help string will be available here.");
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
