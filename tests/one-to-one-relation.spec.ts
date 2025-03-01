import type { EntityFaker } from "../src/entity-faker";

import { faker } from "@faker-js/faker";
import {
    Column,
    DataSource,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    Relation,
    Repository,
} from "typeorm";

import { registerFaker, registry } from "../src";

describe("Faker with many to one relation test", () => {
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

    let userRepository: Repository<User>;
    let contactInfoRepository: Repository<ContactInfo>;

    let contactInfoFaker: EntityFaker<ContactInfo>;

    beforeAll(async () => {
        dataSource = new DataSource({
            entities: [User, ContactInfo],
            type: "better-sqlite3",
            database: ":memory:",
            synchronize: true,
        });

        await dataSource.initialize();

        userRepository = dataSource.getRepository(User);
        contactInfoRepository = dataSource.getRepository(ContactInfo);

        registerFaker(dataSource, User, {
            firstName: () => faker.person.firstName(),
            lastName: () => faker.person.lastName(),
        });
        registerFaker(dataSource, ContactInfo, {
            address: () => faker.location.street(),
        });

        contactInfoFaker = registry.getFaker(dataSource, ContactInfo);
    });

    afterAll(async () => {
        await dataSource.destroy();
    });

    it("should save many to one relations first (resolve foreign key dependencies regardless of entity cascade options)", async () => {
        const fakeContactInfo = await contactInfoFaker.createOne({
            user: ({ registry }) => {
                const userFaker = registry.getFaker(dataSource, User);

                return userFaker.buildOne();
            },
        });

        expect(contactInfoRepository.hasId(fakeContactInfo)).toBe(true);
        expect(userRepository.hasId(fakeContactInfo.user!)).toBe(true);
    });
});
