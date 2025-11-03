import { handleCreate, handleToday, handleSeed, handleStatus, handleHistory, handleReset } from "./handler";

export function dispatcher(ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs) {
    const subCommand = cmdArgs.getArgN(1);
    let rtresult = seal.ext.newCmdExecuteResult(false);

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
                    await handleReset(ctx, msg, cmdArgs);
                    break;
                case 'help':{
                    rtresult = seal.ext.newCmdExecuteResult(true);
                    rtresult.showHelp = true;
                    return rtresult;
                }
                default: {
                    seal.replyToSender(ctx, msg, `微型世界模拟器插件，请使用create/today/seed/status/history/reset参数。输入 .lw help 查看帮助。`);
                    rtresult = seal.ext.newCmdExecuteResult(false);
                    return rtresult;
                }
            }
        } catch (e: any) {
            seal.replyToSender(ctx, msg, `发生错误: ${e.message}`);
        }
    })();

    return rtresult;
}
