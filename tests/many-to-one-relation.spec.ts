import { faker } from "@faker-js/faker";
import { registerFaker } from "../src/register-faker";
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
import { EntityFaker } from "../src/entity-faker";

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

    let genderFaker: EntityFaker<Gender>;
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

        genderFaker = registerFaker(dataSource, Gender, {
            name: () => faker.person.gender(),
        });

        userFaker = registerFaker(dataSource, User, {
            firstName: () => faker.person.firstName(),
            lastName: () => faker.person.lastName(),
        });

        postFaker = registerFaker(dataSource, Post, {
            text: () => faker.lorem.text(),
        });
    });

    afterAll(async () => {
        await dataSource.destroy();
    });

    it("should save many to one relations first (resolve foreign key dependencies regardless of entity cascade options)", async () => {
        const fakeUser = await userFaker.createOne({
            gender: () => genderFaker.buildOne(),
        });

        expect(genderRepository.hasId(fakeUser.gender!)).toBe(true);
        expect(userRepository.hasId(fakeUser)).toBe(true);
    });

    it("should resolve foreign key dependencies through multiple entities", async () => {
        const fakePost = await postFaker.createOne({
            user: () =>
                userFaker.buildOne({
                    gender: () => genderFaker.buildOne(),
                }),
        });

        expect(userRepository.hasId(fakePost.user!)).toBe(true);
        expect(postRepository.hasId(fakePost)).toBe(true);
    });
});
