import { faker } from "@faker-js/faker";
import { Column, DataSource, DataSourceOptions, Entity, PrimaryGeneratedColumn } from "typeorm";

import { registerFaker } from "../src/register-faker";

describe("Databases simple faker test", () => {
    @Entity()
    class User {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        firstName!: string;

        @Column()
        lastName!: string;

        @Column({ nullable: true })
        nickName!: string;
    }

    const entities = [User];
    it.each<DataSourceOptions[]>([
        [
            {
                entities,
                type: "better-sqlite3",
                database: "test-better-sqlite3.db",
                synchronize: true,
            },
        ],
        [
            {
                entities,
                type: "sqlite",
                database: "test-sqlite.db",
                synchronize: true,
            },
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
        ],
    ])("should operate with datasource options: %o", async (options) => {
        const dataSource = new DataSource(options);

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const userFaker = registerFaker(dataSource, User, {
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
