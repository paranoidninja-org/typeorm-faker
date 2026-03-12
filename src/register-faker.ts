import type { DataSource, ObjectLiteral } from "typeorm";

import type { Type } from "./interfaces/type.interface";
import type { FakerConfig } from "./interfaces/faker-config.interface";

import { EntityFaker } from "./entity-faker";
import { Registry } from "./registry";

export function registerFaker<T extends ObjectLiteral>(
    dataSource: DataSource,
    entityClass: Type<T>,
    config: FakerConfig<T>,
    subClass: Type<EntityFaker> = EntityFaker,
    ...extraConstructorArgs: unknown[]
) {
    const entityFaker = new subClass(dataSource, entityClass, config, ...extraConstructorArgs);

    Registry.instance.registerFaker(dataSource, entityClass, entityFaker);

    return entityFaker;
}
