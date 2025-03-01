import type { ObjectLiteral } from "typeorm";

import type { FakerFnInput } from "./faker-input.interface";

export type FakerOverrides<T extends ObjectLiteral> = {
    [K in keyof T]?: T[K] | ((input: FakerFnInput) => T[K] | Promise<T[K]>);
};
