import { faker } from "@faker-js/faker";
import {
    Column,
    DataSource,
    DataSourceOptions,
    Entity,
    ObjectId,
    ObjectIdColumn,
    ObjectLiteral,
    PrimaryGeneratedColumn,
} from "typeorm";

import { registerFaker } from "../src/register-faker";
import { Type } from "interfaces/type.interface";

describe("Databases simple faker test", () => {
    class BaseUser {
        @Column()
        firstName!: string;

        @Column()
        lastName!: string;

        @Column({ nullable: true })
        nickName!: string;
    }

    @Entity()
    class User extends BaseUser {
        @PrimaryGeneratedColumn()
        id!: number;
    }

    @Entity()
    class MongoUser extends BaseUser {
        @ObjectIdColumn()
        _id!: ObjectId;
    }

    const entities = [User];
    const mongoEntities = [MongoUser];
    it.each<[DataSourceOptions, Type<ObjectLiteral>]>([
        [
            {
                entities,
                type: "better-sqlite3",
                database: "test-better-sqlite3.db",
                synchronize: true,
            },
            User,
        ],
        [
            {
                entities,
                type: "sqlite",
                database: "test-sqlite.db",
                synchronize: true,
            },
            User,
        ],
        [
            {
                entities,
                type: "postgres",
                database: "test",
                username: "test",
                password: "test",
                synchronize: true,
            },
            User,
        ],
        [
            {
                entities,
                type: "mariadb",
                database: "test",
                username: "test",
                password: "test",
                synchronize: true,
            },
            User,
        ],
        [
            {
                entities,
                type: "mysql",
                database: "test",
                username: "test",
                password: "test",
                synchronize: true,
            },
            User,
        ],
        [
            {
                entities: mongoEntities,
                type: "mongodb",
                database: "test",
                synchronize: true,
            },
            MongoUser,
        ],
    ])("should operate with datasource options: %o", async (options, UserEntity) => {
        const dataSource = new DataSource(options);

        await dataSource.initialize();

        const repository = dataSource.getRepository(UserEntity);

        const userFaker = registerFaker(dataSource, UserEntity, {
            firstName: () => faker.person.firstName(),
            lastName: () => faker.person.lastName(),
        });

        const countBefore = await repository.count();

        await userFaker.createOne();

        expect(await repository.count()).toBe(countBefore + 1);

        await repository.delete({});

        await dataSource.destroy();
    });
});
