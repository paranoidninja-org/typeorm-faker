import type { ObjectLiteral } from "typeorm";

import type { FakerFnInput } from "./faker-input.interface";

export type FakerConfig<T extends ObjectLiteral> = {
    [K in keyof T]?: (input: FakerFnInput) => T[K] | Promise<T[K]>;
};
