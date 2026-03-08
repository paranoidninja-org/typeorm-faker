import type { Relation } from "typeorm";

import { Column, DataSource, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

import { registry } from "../src";
import { registerFaker } from "../src/register-faker";
import { faker } from "@faker-js/faker";

describe("Registry tests", () => {
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

        @OneToOne(() => ContactInfo, (contactInfo) => contactInfo.user)
        contactInfo?: Relation<ContactInfo>;
    }

    @Entity()
    class ContactInfo {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        address!: string;

        @Column()
        userId!: number;

        @OneToOne(() => User, (user) => user.contactInfo)
        @JoinColumn()
        user?: Relation<User>;
    }

    let dataSource: DataSource;

    beforeAll(async () => {
        dataSource = new DataSource({
            entities: [User, ContactInfo],
            type: "better-sqlite3",
            database: ":memory:",
            synchronize: true,
        });

        await dataSource.initialize();

        registerFaker(dataSource, User, {
            firstName: () => faker.person.firstName(),
            lastName: () => faker.person.lastName(),
        });
    });

    afterAll(async () => {
        await dataSource.destroy();
    });

    it("should not allow double registration for the same entity", () => {
        expect(() => {
            registerFaker(dataSource, User, {});
        }).toThrow();
    });

    it("should not allow retrieval of non-existent faker", () => {
        expect(() => {
            registry.getFaker(dataSource, ContactInfo);
        }).toThrow();
    });
});
