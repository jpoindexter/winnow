export type Position = "head" | "tail" | "middle" | "anywhere";
export interface BenchCase {
    id: string;
    kind: "json" | "logs" | "text";
    doc: string;
    needle: string;
    where: Position;
}
export declare const CORPUS: BenchCase[];
