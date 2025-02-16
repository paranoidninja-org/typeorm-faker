import { ObjectLiteral } from "typeorm";

export type FakerOverrides<T extends ObjectLiteral> = {
    [K in keyof T]?: T[K] | (() => T[K] | Promise<T[K]>);
};
