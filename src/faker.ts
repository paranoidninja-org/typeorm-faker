/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataSource, ObjectLiteral } from "typeorm";
import { Type } from "./interfaces/type.interface";
import { FakerOverrides } from "./interfaces/faker-overrides.interface";
import { FakerConfig } from "./interfaces/faker-config.interface";

export class Faker<T extends ObjectLiteral = ObjectLiteral> {
    constructor(
        private readonly dataSource: DataSource,
        private readonly entityClass: Type<T>,
        private readonly config: FakerConfig<T>,
    ) {}

    async buildOne(overrides: FakerOverrides<T> = {}): Promise<T> {
        const instance: T = new this.entityClass();

        const overriddenKeys = [];

        for (const [key, value] of Object.values(overrides)) {
            if (typeof value === "function") {
                // TODO: pass dependencies to faker fn
                (instance as any)[key] = await value();
            } else {
                (instance as any)[key] = value;
            }

            overriddenKeys.push(key);
        }

        for (const [key, fn] of Object.values(this.config)) {
            if (overriddenKeys.includes(key)) {
                continue;
            }

            (instance as any)[key] = await fn();
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

    private async save(entity: T): Promise<T>;
    private async save(entities: T[]): Promise<T[]>;
    private async save(entities: T | T[]): Promise<T | T[]> {
        const entityArray = Array.isArray(entities) ? entities : [entities];

        const repository = this.dataSource.getRepository(this.entityClass);

        return repository.save(entityArray);
    }
}
