import type { EntityFaker } from "../src/entity-faker";

import { faker } from "@faker-js/faker";
import {
    Column,
    DataSource,
    Entity,
    ManyToOne,
    OneToMany,
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

        @Column()
        genderId!: number;

        @ManyToOne(() => Gender, (gender) => gender.users)
        gender?: Relation<Gender>;

        @OneToMany(() => Post, (post) => post.user)
        posts?: Relation<Post[]>;
    }

    @Entity()
    class Gender {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        name!: string;

        @OneToMany(() => User, (user) => user.gender)
        users?: Relation<User[]>;
    }

    @Entity()
    class Post {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        text!: string;

        @Column()
        userId!: number;

        @ManyToOne(() => User, (user) => user.posts)
        user?: Relation<User>;
    }

    let dataSource: DataSource;

    let genderRepository: Repository<Gender>;
    let userRepository: Repository<User>;
    let postRepository: Repository<Post>;

    let userFaker: EntityFaker<User>;
    let postFaker: EntityFaker<Post>;

    beforeAll(async () => {
        dataSource = new DataSource({
            entities: [Gender, User, Post],
            type: "better-sqlite3",
            database: ":memory:",
            synchronize: true,
        });

        await dataSource.initialize();

        genderRepository = dataSource.getRepository(Gender);
        userRepository = dataSource.getRepository(User);
        postRepository = dataSource.getRepository(Post);

        registerFaker(dataSource, Gender, {
            name: () => faker.person.gender(),
        });
        registerFaker(dataSource, User, {
            firstName: () => faker.person.firstName(),
            lastName: () => faker.person.lastName(),
        });
        registerFaker(dataSource, Post, {
            text: () => faker.lorem.text(),
        });

        userFaker = registry.getFaker(dataSource, User);
        postFaker = registry.getFaker(dataSource, Post);
    });

    afterAll(async () => {
        await dataSource.destroy();
    });

    it("should save many to one relations first (resolve foreign key dependencies regardless of entity cascade options)", async () => {
        const fakeUser = await userFaker.createOne({
            gender: ({ registry }) => {
                const genderFaker = registry.getFaker(dataSource, Gender);

                return genderFaker.buildOne();
            },
        });

        expect(genderRepository.hasId(fakeUser.gender!)).toBe(true);
        expect(userRepository.hasId(fakeUser)).toBe(true);
    });

    it("should resolve foreign key dependencies through multiple entities", async () => {
        const fakePost = await postFaker.createOne({
            user: ({ registry }) => {
                const userFaker = registry.getFaker(dataSource, User);

                return userFaker.buildOne({
                    gender: ({ registry }) => {
                        const genderFaker = registry.getFaker(dataSource, Gender);

                        return genderFaker.buildOne();
                    },
                });
            },
        });

        expect(userRepository.hasId(fakePost.user!)).toBe(true);
        expect(postRepository.hasId(fakePost)).toBe(true);
    });
});
