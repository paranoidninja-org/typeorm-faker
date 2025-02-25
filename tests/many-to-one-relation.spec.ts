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

    const dataSource = new DataSource({
        entities: [Gender, User],
        type: "better-sqlite3",
        database: ":memory:",
        synchronize: true,
    });

    let genderRepository: Repository<Gender>;
    let userRepository: Repository<User>;

    const firstNameGenerator = vi.fn(() => faker.person.firstName());
    const lastNameGenerator = vi.fn(() => faker.person.lastName());
    const genderNameGenerator = vi.fn(() => faker.person.gender());

    let genderFaker: EntityFaker<Gender>;
    let userFaker: EntityFaker<User>;

    beforeAll(async () => {
        await dataSource.initialize();

        genderRepository = dataSource.getRepository(Gender);
        userRepository = dataSource.getRepository(User);

        genderFaker = registerFaker(dataSource, Gender, {
            name: genderNameGenerator,
        });

        userFaker = registerFaker(dataSource, User, {
            firstName: firstNameGenerator,
            lastName: lastNameGenerator,
        });
    });

    afterAll(async () => {
        await dataSource.destroy();
    });

    it("should save many to one relations first", async () => {
        const fakeUser = await userFaker.createOne({
            gender: () => genderFaker.buildOne(),
        });

        expect(genderRepository.hasId(fakeUser.gender!)).toBe(true);
        expect(userRepository.hasId(fakeUser)).toBe(true);
    });
});
