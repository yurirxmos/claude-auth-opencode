#!/usr/bin/env node
import { createDefaultCredentialStore } from "./credentials/index.js";
import { describeCredentials } from "./status.js";
import { PACKAGE_NAME } from "./update.js";
async function runDoctor() {
    const credentials = await createDefaultCredentialStore().getValidCredentials();
    for (const line of describeCredentials(credentials)) {
        console.log(line);
    }
    console.log(`\nPara instalar no OpenCode:\n  opencode plugin add ${PACKAGE_NAME}\n  opencode service restart`);
    return credentials ? 0 : 1;
}
async function main(argv) {
    const command = argv[0] ?? "doctor";
    if (command === "doctor") {
        return runDoctor();
    }
    console.error(`Comando desconhecido: ${command}\nUso: ${PACKAGE_NAME} doctor`);
    return 1;
}
process.exitCode = await main(process.argv.slice(2));
