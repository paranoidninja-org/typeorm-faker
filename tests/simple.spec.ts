import { faker } from "@faker-js/faker";
import { Column, DataSource, Entity, PrimaryGeneratedColumn, Repository } from "typeorm";

import { registerFaker } from "../src/register-faker";
import { EntityFaker } from "../src/entity-faker";

describe("Simple faker test", () => {
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

    let repository: Repository<User>;
    let dataSource: DataSource;

    const firstNameGenerator = vi.fn(() => faker.person.firstName());
    const lastNameGenerator = vi.fn(() => faker.person.lastName());

    let userFaker: EntityFaker<User>;

    beforeAll(async () => {
        dataSource = new DataSource({
            entities: [User],
            type: "better-sqlite3",
            database: ":memory:",
            synchronize: true,
        });

        await dataSource.initialize();

        repository = dataSource.getRepository(User);

        userFaker = registerFaker(dataSource, User, {
            firstName: firstNameGenerator,
            lastName: lastNameGenerator,
        });
    });

    afterAll(async () => {
        await dataSource.destroy();
    });

    afterEach(async () => {
        await repository.delete({});
        vi.resetAllMocks();
    });

    it("should build a user using the faker definition", async () => {
        const fakeUser = await userFaker.buildOne();

        expect(typeof fakeUser.firstName).toBe("string");
        expect(typeof fakeUser.lastName).toBe("string");
        expect(firstNameGenerator).toHaveBeenCalled();
        expect(lastNameGenerator).toHaveBeenCalled();
        expect(fakeUser.nickName).not.toBeDefined();
    });

    it.each([["Dude"], ["Man"]])(
        "should build a user with the passed literal overrides { firstName: '%s' }",
        async (firstNameOverride) => {
            const fakeUser = await userFaker.buildOne({ firstName: firstNameOverride });

            expect(firstNameGenerator).not.toHaveBeenCalled();
            expect(lastNameGenerator).toHaveBeenCalled();
            expect(fakeUser.firstName).toBe(firstNameOverride);
        },
    );

    it.each([[() => "Dude"], [() => "Man"]])(
        "should build a user with the passed generator overrides { firstName: '%s' }",
        async (firstNameOverride) => {
            const firstNameOverrideSpy = vi.fn(firstNameOverride);
            const fakeUser = await userFaker.buildOne({ firstName: firstNameOverrideSpy });

            expect(firstNameGenerator).not.toHaveBeenCalled();
            expect(firstNameOverrideSpy).toHaveBeenCalled();
            expect(lastNameGenerator).toHaveBeenCalled();
            expect(fakeUser.firstName).toBe(firstNameOverride());
        },
    );

    it.each([[5], [10], [100]])("should build %d users using the faker definition", async (count) => {
        const fakeUsers = await userFaker.buildMany(count);

        expect(fakeUsers.length).toBe(count);
        expect(firstNameGenerator).toHaveBeenCalledTimes(count);
        expect(lastNameGenerator).toHaveBeenCalledTimes(count);

        for (const fakeUser of fakeUsers) {
            expect(typeof fakeUser.firstName).toBe("string");
            expect(typeof fakeUser.lastName).toBe("string");
            expect(fakeUser.nickName).not.toBeDefined();
        }
    });

    it.each([
        [5, "Dude"],
        [10, "Man"],
    ])(
        "should build %d users with the passed literal overrides { firstName: '%s' }",
        async (count, firstNameOverride) => {
            const fakeUsers = await userFaker.buildMany(count, { firstName: firstNameOverride });

            expect(fakeUsers.length).toBe(count);
            expect(firstNameGenerator).not.toHaveBeenCalled();
            expect(lastNameGenerator).toHaveBeenCalledTimes(count);

            for (const fakeUser of fakeUsers) {
                expect(typeof fakeUser.lastName).toBe("string");
                expect(fakeUser.firstName).toBe(firstNameOverride);
                expect(fakeUser.nickName).not.toBeDefined();
            }
        },
    );

    it.each([
        [5, () => "Dude"],
        [10, () => "Man"],
    ])(
        "should build %d users with the passed generator overrides { firstName: %s }",
        async (count, firstNameOverride) => {
            const firstNameOverrideSpy = vi.fn(firstNameOverride);
            const fakeUsers = await userFaker.buildMany(count, { firstName: firstNameOverrideSpy });

            expect(fakeUsers.length).toBe(count);
            expect(firstNameGenerator).not.toHaveBeenCalled();
            expect(firstNameOverrideSpy).toHaveBeenCalledTimes(count);
            expect(lastNameGenerator).toHaveBeenCalledTimes(count);

            for (const fakeUser of fakeUsers) {
                expect(typeof fakeUser.lastName).toBe("string");
                expect(fakeUser.firstName).toBe(firstNameOverride());
                expect(fakeUser.nickName).not.toBeDefined();
            }
        },
    );

    it("should create a user using the faker definition", async () => {
        const countBefore = await repository.count();
        const fakeUser = await userFaker.createOne();

        expect(typeof fakeUser.firstName).toBe("string");
        expect(typeof fakeUser.lastName).toBe("string");
        expect(firstNameGenerator).toHaveBeenCalled();
        expect(lastNameGenerator).toHaveBeenCalled();
        expect(fakeUser.nickName).toBeNull();
        await expect(repository.count()).resolves.toBe(countBefore + 1);
    });

    it.each([["Dude"], ["Man"]])(
        "should create a user with the passed literal overrides { firstName: '%s' }",
        async (firstNameOverride) => {
            const countBefore = await repository.count();
            const fakeUser = await userFaker.createOne({ firstName: firstNameOverride });

            expect(firstNameGenerator).not.toHaveBeenCalled();
            expect(lastNameGenerator).toHaveBeenCalled();
            expect(fakeUser.firstName).toBe(firstNameOverride);
            await expect(repository.count()).resolves.toBe(countBefore + 1);
        },
    );

    it.each([[() => "Dude"], [() => "Man"]])(
        "should create a user with the passed generator overrides { firstName: '%s' }",
        async (firstNameOverride) => {
            const firstNameOverrideSpy = vi.fn(firstNameOverride);
            const countBefore = await repository.count();
            const fakeUser = await userFaker.createOne({ firstName: firstNameOverrideSpy });

            expect(firstNameGenerator).not.toHaveBeenCalled();
            expect(firstNameOverrideSpy).toHaveBeenCalled();
            expect(lastNameGenerator).toHaveBeenCalled();
            expect(fakeUser.firstName).toBe(firstNameOverride());
            await expect(repository.count()).resolves.toBe(countBefore + 1);
        },
    );

    it.each([[5], [10], [100]])("should create %d users using the faker definition", async (count) => {
        const countBefore = await repository.count();
        const fakeUsers = await userFaker.createMany(count);

        expect(fakeUsers.length).toBe(count);
        expect(firstNameGenerator).toHaveBeenCalledTimes(count);
        expect(lastNameGenerator).toHaveBeenCalledTimes(count);
        await expect(repository.count()).resolves.toBe(countBefore + count);

        for (const fakeUser of fakeUsers) {
            expect(typeof fakeUser.firstName).toBe("string");
            expect(typeof fakeUser.lastName).toBe("string");
            expect(fakeUser.nickName).toBeNull();
        }
    });

    it.each([
        [5, "Dude"],
        [10, "Man"],
    ])(
        "should create %d users with the passed literal overrides { firstName: '%s' }",
        async (count, firstNameOverride) => {
            const countBefore = await repository.count();
            const fakeUsers = await userFaker.createMany(count, { firstName: firstNameOverride });

            expect(fakeUsers.length).toBe(count);
            expect(firstNameGenerator).not.toHaveBeenCalled();
            expect(lastNameGenerator).toHaveBeenCalledTimes(count);
            await expect(repository.count()).resolves.toBe(countBefore + count);

            for (const fakeUser of fakeUsers) {
                expect(typeof fakeUser.lastName).toBe("string");
                expect(fakeUser.firstName).toBe(firstNameOverride);
                expect(fakeUser.nickName).toBeNull();
            }
        },
    );

    it.each([
        [5, () => "Dude"],
        [10, () => "Man"],
    ])(
        "should create %d users with the passed generator overrides { firstName: %s }",
        async (count, firstNameOverride) => {
            const countBefore = await repository.count();
            const firstNameOverrideSpy = vi.fn(firstNameOverride);
            const fakeUsers = await userFaker.createMany(count, { firstName: firstNameOverrideSpy });

            expect(fakeUsers.length).toBe(count);
            expect(firstNameGenerator).not.toHaveBeenCalled();
            expect(firstNameOverrideSpy).toHaveBeenCalledTimes(count);
            expect(lastNameGenerator).toHaveBeenCalledTimes(count);
            await expect(repository.count()).resolves.toBe(countBefore + count);

            for (const fakeUser of fakeUsers) {
                expect(typeof fakeUser.lastName).toBe("string");
                expect(fakeUser.firstName).toBe(firstNameOverride());
                expect(fakeUser.nickName).toBeNull();
            }
        },
    );
});
