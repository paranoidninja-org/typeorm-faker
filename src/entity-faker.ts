/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { DataSource, ObjectLiteral } from "typeorm";
import { Type } from "./interfaces/type.interface";
import { FakerOverrides } from "./interfaces/faker-overrides.interface";
import { FakerConfig } from "./interfaces/faker-config.interface";

export class EntityFaker<T extends ObjectLiteral = ObjectLiteral> {
    constructor(
        private readonly dataSource: DataSource,
        private readonly entityClass: Type<T>,
        private readonly config: FakerConfig<T>,
    ) {}

    async buildOne(overrides: FakerOverrides<T> = {}): Promise<T> {
        const instance: T = new this.entityClass();

        const overriddenKeys = [];

        for (const [key, value] of Object.entries(overrides)) {
            if (typeof value === "function") {
                // TODO: pass dependencies to faker fn
                (instance as any)[key] = await value();
            } else {
                (instance as any)[key] = value;
            }

            overriddenKeys.push(key);
        }

        for (const [key, fnValue] of Object.entries(this.config)) {
            if (overriddenKeys.includes(key)) {
                continue;
            }

            (instance as any)[key] = await fnValue();
        }

        return instance;
    }

    async buildMany(count: number, overrides: FakerOverrides<T> | FakerOverrides<T>[] = {}): Promise<T[]> {
        const instancePromises: Promise<T>[] = [];

        for (let i = 0; i < count; i++) {
            let currentOverrides: FakerOverrides<T>;

            if (Array.isArray(overrides)) {
                currentOverrides = overrides[i] ?? {};
            } else {
                currentOverrides = overrides;
            }

            instancePromises.push(this.buildOne(currentOverrides));
        }

        const instances = await Promise.all(instancePromises);

        return instances;
    }

    async createOne(overrides: FakerOverrides<T> = {}): Promise<T> {
        const instance = await this.buildOne(overrides);

        return this.save(instance);
    }

    async createMany(count: number, overrides: FakerOverrides<T> | FakerOverrides<T>[] = {}): Promise<T[]> {
        const instances = await this.buildMany(count, overrides);

        return this.save(instances);
    }

    async save(entity: T): Promise<T>;
    async save(entities: T[]): Promise<T[]>;
    async save(entities: T | T[]): Promise<T | T[]> {
        const isArray = Array.isArray(entities);
        const entityArray = isArray ? entities : [entities];

        await this.resolveAndSaveDependencies(entityArray);

        const repository = this.dataSource.getRepository(this.entityClass);
        const savedInstances = await repository.save(entityArray);

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return isArray ? savedInstances : savedInstances[0]!;
    }

    private async resolveAndSaveDependencies<OtherEntity extends ObjectLiteral>(entityArray: OtherEntity[]) {
        if (entityArray.length === 0) {
            return;
        }

        const entitiesToSaveByRelation: Record<string, any[]> = {};

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const entityMetadata = this.dataSource.getRepository(entityArray[0]!.constructor).metadata;
        const propertyByDatabaseColumnName: Record<string, string> = {};
        for (const column of entityMetadata.columns) {
            propertyByDatabaseColumnName[column.databaseName] = column.propertyName;
        }

        for (const entity of entityArray) {
            for (const manyToOneRelation of entityMetadata.manyToOneRelations) {
                const propertiesToCheck: string[] = [];
                let atLeastOneVirtual = false;
                for (const joinColumn of manyToOneRelation.joinColumns) {
                    if (joinColumn.isVirtual) {
                        atLeastOneVirtual = true;
                        break;
                    }

                    const propertyName = propertyByDatabaseColumnName[joinColumn.databaseName];
                    if (!propertyName) {
                        throw new Error("No property name found for non-virtual join column!");
                    }

                    propertiesToCheck.push(propertyName);
                }

                if (atLeastOneVirtual) {
                    continue;
                }

                let allDefined = true;
                for (const propertyToCheck of propertiesToCheck) {
                    if ((entity as any)[propertyToCheck] === undefined || (entity as any)[propertyToCheck] === null) {
                        allDefined = false;
                        break;
                    }
                }

                if (allDefined) {
                    continue;
                }

                const relationProperty = manyToOneRelation.propertyName;
                const relationTarget = manyToOneRelation.inverseEntityMetadata.target;
                const relationValue = (entity as any)[relationProperty];

                const relationRepository = this.dataSource.getRepository(relationTarget);
                if (relationValue) {
                    if (relationRepository.hasId(relationValue)) {
                        continue;
                    }

                    let relationTargetName: string;
                    if (typeof relationTarget === "function") {
                        relationTargetName = relationTarget.name;
                    } else {
                        relationTargetName = relationTarget;
                    }

                    entitiesToSaveByRelation[relationTargetName] ??= [];
                    entitiesToSaveByRelation[relationTargetName]?.push(relationValue);
                }
            }
        }

        for (const [relationTargetName, relationValues] of Object.entries(entitiesToSaveByRelation)) {
            await this.resolveAndSaveDependencies(relationValues);

            const relationRepository = this.dataSource.getRepository(relationTargetName);
            await relationRepository.save(relationValues);
        }
    }
}
