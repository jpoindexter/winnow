type Rpc = {
    jsonrpc: "2.0";
    id?: number | string;
    method?: string;
    params?: Record<string, unknown>;
};
/** Handle one JSON-RPC message; returns the response line, or null for notifications. */
export declare function handleMessage(msg: Rpc): Promise<string | null>;
/** Start the stdio MCP server. Resolves when stdin closes. */
export declare function startMcpServer(): Promise<void>;
export {};
