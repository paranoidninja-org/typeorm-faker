import { DataSource, ObjectLiteral } from "typeorm";
import { Type } from "./interfaces/type.interface";
import { FakerConfig } from "./interfaces/faker-config.interface";
import { Faker } from "./faker";
import { Metadata } from "./metadata";

export function registerFaker<T extends ObjectLiteral>(
    entityClass: Type<T>,
    config: FakerConfig<T>,
    dataSource: DataSource,
) {
    const faker = new Faker(dataSource, entityClass, config);

    Metadata.getInstance().registerFaker(entityClass.name, faker);

    return faker;
}
