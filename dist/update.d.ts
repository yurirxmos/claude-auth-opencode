export declare const PACKAGE_NAME = "claude-auth-opencode";
export declare function isNewerVersion(candidate: string, current: string): boolean;
export declare function findAvailableUpdate(): Promise<{
    current: string;
    latest: string;
} | undefined>;
export declare function installUpdate(): Promise<void>;
export declare function restartOpenCodeService(): Promise<void>;
