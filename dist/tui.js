import { spawn } from "node:child_process";
import { Plugin } from "@opencode/plugin/tui";
import { CLAUDE_RENEW_COMMAND } from "./auth.js";
function runDetached(command, arguments_) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, arguments_, {
            detached: true,
            stdio: "ignore",
            windowsHide: false,
        });
        child.once("error", reject);
        child.once("spawn", () => {
            child.unref();
            resolve();
        });
    });
}
function runConfiguredCommand(command) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, {
            detached: true,
            shell: true,
            stdio: "ignore",
            windowsHide: false,
        });
        child.once("error", reject);
        child.once("spawn", () => {
            child.unref();
            resolve();
        });
    });
}
/**
 * Opens Claude Code in a separate terminal so its interactive authentication
 * does not compete with the terminal owned by the OpenCode TUI.
 *
 * CLAUDE_RENEW_COMMAND may be used to provide a preferred terminal launcher,
 * for example: `kitty --detach claude`.
 */
async function openClaudeCode() {
    const configuredCommand = process.env.CLAUDE_RENEW_COMMAND;
    if (configuredCommand && configuredCommand.trim().length > 0) {
        await runConfiguredCommand(configuredCommand);
        return;
    }
    if (process.platform === "win32") {
        await runDetached("cmd.exe", ["/d", "/s", "/c", 'start "Claude renewal" claude']);
        return;
    }
    if (process.env.WSL_INTEROP || process.env.WSL_DISTRO_NAME) {
        await runDetached("cmd.exe", ["/d", "/s", "/c", 'start "Claude renewal" claude']);
        return;
    }
    if (process.platform === "darwin") {
        await runDetached("osascript", [
            "-e",
            'tell application "Terminal" to do script "claude"',
        ]);
        return;
    }
    await runDetached("x-terminal-emulator", ["-e", "claude"]);
}
const plugin = Plugin.define({
    id: "claude-auth-opencode.tui",
    setup(context) {
        context.keymap.layer(() => ({
            mode: "global",
            commands: [
                {
                    id: "claude-auth-opencode.renew",
                    title: "Renovar sessão do Claude",
                    description: "Abre o Claude Code para renovar a sessão OAuth",
                    group: "Claude",
                    palette: true,
                    slash: { name: CLAUDE_RENEW_COMMAND.slice(1) },
                    run: async () => {
                        try {
                            await openClaudeCode();
                            context.ui.toast.show({
                                title: "Renovação do Claude",
                                message: "Claude Code foi aberto em outro terminal. Conclua a renovação e envie sua mensagem novamente.",
                                variant: "info",
                            });
                        }
                        catch {
                            await context.ui.dialog.alert({
                                title: "Não foi possível abrir o Claude Code",
                                message: "Abra outro terminal e rode `claude`. Você também pode definir CLAUDE_RENEW_COMMAND com o comando do seu emulador de terminal.",
                            });
                        }
                    },
                },
            ],
        }));
    },
});
export default plugin;
