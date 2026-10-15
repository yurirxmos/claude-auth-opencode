export function describeCredentials(credentials) {
    if (!credentials) {
        return [
            "Credenciais do Claude Code não encontradas ou expiradas. Rode `claude` para autenticar.",
        ];
    }
    const expiration = credentials.expiresAt === undefined
        ? "não informada"
        : new Date(credentials.expiresAt).toISOString();
    return [
        "Credenciais do Claude Code encontradas.",
        `Expiração: ${expiration}`,
    ];
}
