// Optional AST code compression for TypeScript / JavaScript. Strips function and method
// BODIES down to a marker while keeping every signature, import, type, and structure —
// so a model reading a large source file sees the shape (what exists, what it's called,
// what it takes/returns) without the line-by-line implementation. Reversible via the
// store like any other compression. Requires the optional `typescript` peer; returns
// null when it isn't installed, so the caller falls back to text compression.
const BODY_MARKER = "{ /* body elided — winnow */ }";
/** True when the text looks like TS/JS source worth AST-compressing. Pure, cheap. */
export function isCodeContent(text) {
    return /^\s*(import|export|function|class|const|let|var|interface|type|async)\b/m.test(text)
        && /[{};]/.test(text);
}
/**
 * Replace every block function/method/arrow body with a marker, keeping signatures.
 * Returns the compressed source, or null if `typescript` isn't available or it doesn't
 * shrink. Async because the typescript dep is imported lazily.
 */
export async function compressCode(source) {
    let ts;
    try {
        ts = await import("typescript");
    }
    catch {
        return null; // optional dep absent — caller falls back to text compression
    }
    const sf = ts.createSourceFile("x.ts", source, ts.ScriptTarget.Latest, true);
    const edits = [];
    const visit = (node) => {
        if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) ||
            ts.isFunctionExpression(node) || ts.isArrowFunction(node)) &&
            node.body && ts.isBlock(node.body) && node.body.statements.length > 0) {
            edits.push({ start: node.body.getStart(sf), end: node.body.getEnd() });
            return; // don't descend into a body we're eliding
        }
        ts.forEachChild(node, visit);
    };
    visit(sf);
    if (!edits.length)
        return null;
    // apply back-to-front so earlier offsets stay valid
    let out = source;
    for (const e of edits.sort((a, b) => b.start - a.start)) {
        out = out.slice(0, e.start) + BODY_MARKER + out.slice(e.end);
    }
    return out.length < source.length ? out : null;
}
//# sourceMappingURL=code.js.map