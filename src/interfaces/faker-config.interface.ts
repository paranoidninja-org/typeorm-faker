import { ObjectLiteral } from "typeorm";

export type FakerConfig<T extends ObjectLiteral> = {
    [K in keyof T]?: () => T[K] | Promise<T[K]>;
};
