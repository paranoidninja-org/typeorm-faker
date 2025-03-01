import { DataSource, ObjectLiteral } from "typeorm";
import { Type } from "./interfaces/type.interface";
import { FakerConfig } from "./interfaces/faker-config.interface";
import { EntityFaker } from "./entity-faker";

export function createFaker<T extends ObjectLiteral>(
    dataSource: DataSource,
    entityClass: Type<T>,
    config: FakerConfig<T>,
) {
    return new EntityFaker(dataSource, entityClass, config);
}
