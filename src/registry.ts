import type { DataSource, ObjectLiteral } from "typeorm";

import type { EntityFaker } from "./entity-faker";
import type { Type } from "./interfaces/type.interface";

export class Registry {
    static readonly instance: Registry = new Registry();
    private data = new Map<DataSource, Record<string, EntityFaker>>();

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    registerFaker<T extends ObjectLiteral>(dataSource: DataSource, entityClass: Type<T>, faker: EntityFaker<T>) {
        if (this.data.get(dataSource)?.[entityClass.name]) {
            // TODO: replace dataSource.name
            throw new Error(`Double registration for entity ${entityClass.name} in data source ${dataSource.name}`);
        }

        let dataSourceMap: Record<string, EntityFaker>;
        if (!this.data.has(dataSource)) {
            dataSourceMap = {};
            this.data.set(dataSource, dataSourceMap);
        } else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            dataSourceMap = this.data.get(dataSource)!;
        }

        dataSourceMap[entityClass.name] = faker;
    }

    getFaker<T extends ObjectLiteral>(dataSource: DataSource, entityClass: Type<T>): EntityFaker<T> {
        const entityFaker = this.data.get(dataSource)?.[entityClass.name];
        if (!entityFaker) {
            // TODO: replace dataSource.name
            throw new Error(`No registered faker for ${entityClass.name} in data source ${dataSource.name}`);
        }

        return entityFaker as EntityFaker<T>;
    }

    reset() {
        this.data.clear();
    }
}
