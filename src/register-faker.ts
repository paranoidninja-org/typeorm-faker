import { DataSource, ObjectLiteral } from "typeorm";
import { Type } from "./interfaces/type.interface";
import { FakerConfig } from "./interfaces/faker-config.interface";
import { Metadata } from "./metadata";
import { EntityFaker } from "./entity-faker";

export function registerFaker<T extends ObjectLiteral>(
    dataSource: DataSource,
    entityClass: Type<T>,
    config: FakerConfig<T>,
) {
    const entityFaker = new EntityFaker(dataSource, entityClass, config);

    Metadata.getInstance().registerFaker(entityClass.name, entityFaker);

    return entityFaker;
}
