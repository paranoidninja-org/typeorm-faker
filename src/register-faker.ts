import type { DataSource, ObjectLiteral } from "typeorm";

import type { Type } from "./interfaces/type.interface";
import type { FakerConfig } from "./interfaces/faker-config.interface";

import { EntityFaker } from "./entity-faker";
import { Registry } from "./registry";

export function registerFaker<T extends ObjectLiteral>(
    dataSource: DataSource,
    entityClass: Type<T>,
    config: FakerConfig<T>,
) {
    const entityFaker = new EntityFaker(dataSource, entityClass, config);

    Registry.instance.registerFaker(dataSource, entityClass, entityFaker);
}
